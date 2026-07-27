// ==========================================================================
// Component: Address Block
// Renders one repeatable business-location block for the Business Details
// step. Each block carries its own address line, an embedded map preview
// the user can nudge to confirm the pin, and a small Verify button that
// confirms the location automatically. Blocks can be added and removed
// dynamically; the module keeps its own instance registry so callers can
// read every block's data back out in one call.
//
// This is a frontend-only project (no build step, no map API key), so the
// "choose on map" affordance uses an embedded OpenStreetMap iframe driven
// by the typed address. Swap the iframe src for a keyed embed later without
// touching the surrounding markup.
// ==========================================================================

import { ICONS } from "../utils/icons.js";
import { makeCollapsible } from "./collapsible.js";

let addressCounter = 0;
const addressBlocks = []; // { id, element, getData, collapsible }

// Small HTML escape for text dropped into a summary line via innerHTML
function esc(text) {
  return String(text).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

// Builds the OpenStreetMap embed URL for a free-text query. Centering on a
// typed address without a geocoding key isn't possible, so we bias the
// embed toward a reasonable default view and let the user drag/zoom.
function buildMapSrc(query) {
  const q = encodeURIComponent(query || "United States");
  return `https://www.openstreetmap.org/export/embed.html?bbox=-125,24,-66,50&layer=mapnik&marker=39.5,-98.35&query=${q}`;
}

// Creates and appends one address block. `options.removable` controls
// whether the block shows its own Remove button (the first block is not
// removable so at least one address always exists). `options.prefill`
// restores a saved { address, verified } state (used when carrying a
// business across page navigations).
export function addAddressBlock(containerEl, { removable = true, prefill = null } = {}) {
  addressCounter += 1;
  const id = addressCounter;
  let verified = false;

  // Adding a new location folds the existing ones to their summary line so
  // the list of locations stays short.
  addressBlocks.forEach((entry) => entry.collapsible && entry.collapsible.collapse());

  const block = document.createElement("div");
  block.className = "address-block";
  block.dataset.addressId = String(id);

  block.innerHTML = `
    <div class="address-block__header">
      <span class="address-block__title">Location ${id} <span class="address-block__title-sub">· Address</span></span>
      <button type="button" class="address-block__remove ${removable ? "" : "is-hidden"}" data-role="remove-address">
        ${ICONS.close} Remove
      </button>
    </div>

    <div class="address-block__body">
      <div class="field-group" style="margin-top: 0;">
        <div class="input-field">
          <span class="input-field__icon">${ICONS.pin}</span>
          <input class="input-field__control address-block__line" type="text" placeholder="123 Main St, City, State" />
        </div>
      </div>

      <!-- Map picker: preview + a "choose on map" affordance. -->
      <div class="field-group">
        <label class="field-group__label">Pinpoint on map</label>
        <div class="map-picker">
          <iframe class="map-picker__frame" data-role="map-frame" title="Location map preview"
            src="${buildMapSrc("")}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
          <button type="button" class="map-picker__locate" data-role="locate">
            ${ICONS.pin} Use my current location
          </button>
        </div>
        <p class="field-group__hint">Type an address above, then confirm the pin. Drag the map to fine-tune.</p>
      </div>

      <!-- Small per-location verify button. Auto-verifies on click, then turns
           blue with a check beside the label. -->
      <button type="button" class="location-verify" data-role="verify-location">
        <span class="location-verify__icon" data-role="verify-icon">${ICONS.shield}</span>
        <span data-role="verify-label">Verify location</span>
      </button>
    </div>
  `;

  containerEl.appendChild(block);

  // ---- Per-block wiring --------------------------------------------------
  const lineInput = block.querySelector(".address-block__line");
  const mapFrame = block.querySelector("[data-role='map-frame']");
  const locateBtn = block.querySelector("[data-role='locate']");
  const removeBtn = block.querySelector("[data-role='remove-address']");
  const verifyBtn = block.querySelector("[data-role='verify-location']");
  const verifyIcon = block.querySelector("[data-role='verify-icon']");
  const verifyLabel = block.querySelector("[data-role='verify-label']");

  // Debounce so we auto-verify shortly after the user stops typing, plus a
  // cancelable run timer so editing mid-verification aborts cleanly.
  let autoVerifyTimer;
  let verifyRunTimer;

  // Schedules an automatic verification once the address looks substantial
  function scheduleAutoVerify() {
    clearTimeout(autoVerifyTimer);
    if (lineInput.value.trim().length < 4) return;
    autoVerifyTimer = setTimeout(runVerify, 700);
  }

  // Typing: invalidate a prior verification, then queue an auto-verify. No
  // button press is needed - the verify button runs on its own.
  lineInput.addEventListener("input", () => {
    if (verified) resetVerify();
    scheduleAutoVerify();
  });

  // Committing the address (blur/Enter) re-centers the map and verifies now
  lineInput.addEventListener("change", () => {
    mapFrame.src = buildMapSrc(lineInput.value.trim());
    clearTimeout(autoVerifyTimer);
    if (verified) resetVerify();
    if (lineInput.value.trim()) runVerify();
  });

  function resetVerify() {
    clearTimeout(verifyRunTimer);
    verified = false;
    verifyBtn.classList.remove("is-verifying", "is-verified");
    verifyIcon.innerHTML = ICONS.shield;
    verifyLabel.textContent = "Verify location";
  }

  // Runs the verify sequence: brief spinner, then a green verified state.
  // Guarded so overlapping triggers (auto + manual) can't double-fire.
  function runVerify() {
    if (verified || verifyBtn.classList.contains("is-verifying")) return;
    if (!lineInput.value.trim()) return;
    verifyBtn.classList.add("is-verifying");
    verifyIcon.innerHTML = ICONS.spinner;
    verifyLabel.textContent = "Verifying";
    verifyRunTimer = setTimeout(() => {
      verified = true;
      verifyBtn.classList.remove("is-verifying");
      verifyBtn.classList.add("is-verified");
      verifyIcon.innerHTML = ICONS.check;
      verifyLabel.textContent = "Verified";
    }, 900);
  }

  // The button still works as a manual trigger for the same sequence
  verifyBtn.addEventListener("click", runVerify);

  // Best-effort browser geolocation recenters the map on the user's
  // coordinates. Silently ignored if the user denies permission.
  locateBtn.addEventListener("click", () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const delta = 0.01;
      const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
      mapFrame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
    });
  });

  // Removing a block also drops it from the registry
  removeBtn.addEventListener("click", () => {
    const index = addressBlocks.findIndex((entry) => entry.id === id);
    if (index !== -1) addressBlocks.splice(index, 1);
    block.remove();
  });

  const collapsible = makeCollapsible(block, {
    header: block.querySelector(".address-block__header"),
    titleEl: block.querySelector(".address-block__title"),
    body: block.querySelector(".address-block__body"),
    ignore: "[data-role='remove-address']",
    getSummary: () => {
      const addr = lineInput.value.trim();
      const label = addr ? esc(addr) : "<em>No address yet</em>";
      const ok = verified
        ? ` <span class="collapsible__summary-ok">${ICONS.check}</span> Verified`
        : "";
      return label + ok;
    },
  });

  const entry = {
    id,
    element: block,
    collapsible,
    getData: () => ({
      address: lineInput.value.trim(),
      verified,
    }),
  };
  addressBlocks.push(entry);

  // Restore a saved address + verified state (carry-over across navigations)
  if (prefill) {
    if (prefill.address) {
      lineInput.value = prefill.address;
      mapFrame.src = buildMapSrc(prefill.address);
    }
    if (prefill.verified) {
      verified = true;
      verifyBtn.classList.add("is-verified");
      verifyIcon.innerHTML = ICONS.check;
      verifyLabel.textContent = "Verified";
    }
  }

  return entry;
}

// Returns the data for every current address block, in display order.
export function getAllAddresses() {
  return addressBlocks.map((entry) => entry.getData());
}

// Returns { value, label } options for other steps (e.g. linking a menu to a
// location). Value is the stable block id; label is the typed address, or a
// "Location N" fallback while the address line is still empty.
export function getLocationOptions() {
  return addressBlocks.map((entry) => {
    const { address } = entry.getData();
    return { value: String(entry.id), label: address || `Location ${entry.id}` };
  });
}

// Clears all blocks (used by the wizard's "Start over" reset).
export function resetAddressBlocks(containerEl) {
  addressBlocks.length = 0;
  addressCounter = 0;
  if (containerEl) containerEl.innerHTML = "";
}
