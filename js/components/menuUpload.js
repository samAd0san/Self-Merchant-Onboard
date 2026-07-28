// ==========================================================================
// Component: Menu Upload
// A repeatable "menu" card for the Knowledge Base step. Each card offers
// three mutually-exclusive ways to provide a menu - build it in a structured
// editor (categories + items + optional photos), upload a file, or paste a
// link that gets scraped into that same editor to review. Only the chosen
// mode's field takes up space, switched via a small segmented control. All
// three share a single "link to location" dropdown sourced from the business
// locations entered in step 1. Cards can be added and removed freely; the
// module keeps its own registry so the wizard can read every menu back out,
// refresh the location options after locations change, and clear everything
// on reset.
// ==========================================================================

import { ICONS } from "../utils/icons.js";
import { initCustomSelects, refreshCustomSelects } from "./customSelect.js";
import { createMenuEditor, menuToText } from "./menuEditor.js";
import { makeCollapsible } from "./collapsible.js";

// Total item count across a structured menu's categories
function countItems(data) {
  if (!data || !data.categories) return 0;
  return data.categories.reduce((sum, cat) => sum + (cat.items ? cat.items.length : 0), 0);
}

let menuCounter = 0;
const menuCards = []; // { id, element, getData, setLocations }

// Accepted menu file types (menus are usually PDFs, sometimes images)
const ACCEPTED_TYPES = "application/pdf,image/png,image/jpeg,image/webp";

// Menu modes, in the order a merchant reaches for them: paste a link first
// (fastest - we read it for you), else upload a file, else type it by hand.
const MODES = [
  { key: "link", label: "Paste a link" },
  { key: "upload", label: "Upload" },
  { key: "manual", label: "Add manually" },
];

// Stand-in for a real "search the web + scrape the page" backend. The demo's
// point is the review-and-fix step, not the fetch - so a known restaurant URL
// (e.g. bagelology) returns that restaurant's menu; anything else falls back
// to a generic sample. Real onboarding runs the POS menu-import extractor.
const BAGELOLOGY_SAMPLE = {
  categories: [
    { name: "Bagels", items: [
      { name: "Everything Bagel", price: "2.50", description: "House-baked daily, toasted, seeds & spices.", photo: "" },
      { name: "Sesame Bagel", price: "2.25", description: "Classic, golden, toasted to order.", photo: "" },
      { name: "Plain Bagel", price: "2.00", description: "Soft inside, chewy crust.", photo: "" },
      { name: "Cinnamon Raisin", price: "2.50", description: "Sweet, studded with plump raisins.", photo: "" },
      { name: "Gluten-Free Everything", price: "3.50", description: "Baked in a dedicated gluten-free oven.", photo: "" },
    ] },
    { name: "Breakfast Sandwiches", items: [
      { name: "Bacon, Egg & Cheese", price: "7.95", description: "Crispy bacon, cage-free egg, American cheese.", photo: "" },
      { name: "Lox & Schmear", price: "11.50", description: "Nova lox, cream cheese, capers, red onion.", photo: "" },
      { name: "Avocado Smash", price: "8.50", description: "Smashed avocado, chili flakes, lemon, sea salt.", photo: "" },
    ] },
    { name: "Cream Cheese & Spreads", items: [
      { name: "Plain Schmear", price: "1.50", description: "Whipped house cream cheese.", photo: "" },
      { name: "Scallion", price: "1.95", description: "Fresh scallions folded through.", photo: "" },
      { name: "Honey Walnut", price: "2.25", description: "Sweet and nutty, made in-house.", photo: "" },
    ] },
    { name: "Drinks", items: [
      { name: "Cold Brew", price: "4.25", description: "Slow-steeped 18 hours, smooth finish.", photo: "" },
      { name: "Fresh Orange Juice", price: "3.75", description: "Squeezed each morning.", photo: "" },
      { name: "Drip Coffee", price: "2.50", description: "Locally roasted, bottomless.", photo: "" },
    ] },
  ],
};

const GENERIC_SAMPLE = {
  categories: [
    { name: "Starters", items: [
      { name: "Garlic Bread", price: "6.50", description: "Warm, buttery, house focaccia.", photo: "" },
      { name: "Soup of the Day", price: "7.00", description: "Ask your server what's simmering.", photo: "" },
      { name: "Bruschetta", price: "8.50", description: "Tomato, basil, olive oil on toast.", photo: "" },
    ] },
    { name: "Mains", items: [
      { name: "Margherita Pizza", price: "14.00", description: "San Marzano, fresh mozzarella, basil.", photo: "" },
      { name: "Spaghetti Carbonara", price: "16.50", description: "Guanciale, egg, pecorino.", photo: "" },
      { name: "Grilled Salmon", price: "22.00", description: "Seasonal vegetables, lemon butter.", photo: "" },
    ] },
    { name: "Desserts", items: [
      { name: "Tiramisu", price: "8.00", description: "Espresso-soaked, mascarpone.", photo: "" },
      { name: "Vanilla Gelato", price: "6.00", description: "Two scoops, made in-house.", photo: "" },
    ] },
  ],
};

// Picks the fetched menu for a given link (bagelology → its menu, else generic)
function sampleForUrl(url) {
  return /bagelolog/i.test(url || "") ? BAGELOLOGY_SAMPLE : GENERIC_SAMPLE;
}

// Builds the <option> markup for the location dropdown, preserving a
// previously chosen value when that location still exists.
function locationOptionsHTML(locations, selectedValue) {
  const head = `<option value="">Select a location</option>`;
  const opts = (locations || [])
    .map((loc) => {
      const isSel = String(loc.value) === String(selectedValue) ? " selected" : "";
      return `<option value="${loc.value}"${isSel}>${loc.label}</option>`;
    })
    .join("");
  return head + opts;
}

// Creates and appends one menu card. `locations` seeds the link dropdown.
export function addMenu(containerEl, { removable = true, locations = [], prefill = null } = {}) {
  menuCounter += 1;
  const id = menuCounter;

  // Adding a new menu folds the existing cards to their summary line
  menuCards.forEach((entry) => entry.collapsible && entry.collapsible.collapse());

  const card = document.createElement("div");
  card.className = "menu-card";
  card.dataset.menuId = String(id);

  card.innerHTML = `
    <div class="menu-card__header">
      <span class="menu-card__title">Menu</span>
      <button type="button" class="menu-card__remove ${removable ? "" : "is-hidden"}" data-role="remove-menu" aria-label="Remove menu">
        ${ICONS.close} Remove
      </button>
    </div>

    <div class="menu-card__body">
    <!-- Mode switcher (left) + which location this menu belongs to (right),
         sharing one compact row so neither takes a line of its own -->
    <div class="menu-card__toprow">
      <div class="align-toggle menu-card__mode" role="tablist" data-role="mode-toggle">
        ${MODES.map((m, i) => `<button type="button" class="align-toggle__option ${i === 0 ? "is-active" : ""}" data-mode="${m.key}">${m.label}</button>`).join("")}
      </div>
      <div class="select-field menu-card__location-field">
        <select class="select-field__control menu-card__location" aria-label="Link to location">
          ${locationOptionsHTML(locations)}
        </select>
        <span class="select-field__chevron">${ICONS.chevronDown}</span>
      </div>
    </div>

    <!-- Mode: paste a link; we "read + import" it into the card editor to review -->
    <div class="menu-card__panel" data-panel="link" style="margin-top: var(--space-3);">
      <div class="menu-link">
        <div class="input-field menu-link__field">
          <span class="input-field__icon">${ICONS.link}</span>
          <input class="input-field__control" type="url" data-role="link-input" placeholder="https://parcera.bagelology.com/menu" />
        </div>
        <button type="button" class="menu-link__fetch" data-role="fetch-link">${ICONS.sparkle} Fetch menu</button>
      </div>
      <div class="menu-link__status is-hidden" data-role="link-status" aria-live="polite"></div>
      <div class="menu-link__result is-hidden" data-role="link-result">
        <p class="menu-link__result-note">${ICONS.check} We found this menu - edit anything that's off, then confirm.</p>
        <div data-role="scraped-editor"></div>
        <button type="button" class="menu-link__confirm" data-role="confirm-link">${ICONS.check} Confirm menu</button>
      </div>
    </div>

    <!-- Mode: click or drag a PDF/image; preview replaces it once set -->
    <div class="dropzone menu-card__dropzone menu-card__panel is-hidden" data-panel="upload" data-role="dropzone" style="margin-top: var(--space-3);">
      <span class="dropzone__icon">${ICONS.image}</span>
      <div class="dropzone__title">Drop menu or click to upload</div>
      <div class="dropzone__hint">PDF, PNG, JPEG, or WEBP</div>
    </div>

    <!-- Mode: build the menu by hand in the card editor -->
    <div class="menu-card__panel is-hidden" data-panel="manual" style="margin-top: var(--space-3);">
      <div data-role="manual-editor"></div>
    </div>
    </div>
  `;

  containerEl.appendChild(card);

  // ---- Per-card wiring ---------------------------------------------------
  const modeToggle = card.querySelector('[data-role="mode-toggle"]');
  const modeButtons = Array.from(modeToggle.querySelectorAll("[data-mode]"));
  const panels = Array.from(card.querySelectorAll(".menu-card__panel"));
  const linkInput = card.querySelector('[data-role="link-input"]');
  const dropzone = card.querySelector('[data-role="dropzone"]');
  const removeBtn = card.querySelector('[data-role="remove-menu"]');
  const locationSelect = card.querySelector(".menu-card__location");
  let fileName = ""; // most recent uploaded file's name
  let mode = "link"; // link-first: paste a URL and we read the menu for you

  // Structured editor for the "Type it in" mode
  const manualEditor = createMenuEditor(card.querySelector('[data-role="manual-editor"]'));

  // ---- Link scrape flow --------------------------------------------------
  const fetchBtn = card.querySelector('[data-role="fetch-link"]');
  const linkStatus = card.querySelector('[data-role="link-status"]');
  const linkResult = card.querySelector('[data-role="link-result"]');
  const confirmBtn = card.querySelector('[data-role="confirm-link"]');
  const scrapedMount = card.querySelector('[data-role="scraped-editor"]');
  let scrapedEditor = null; // created on first successful fetch
  let scrapeConfirmed = false;
  let scrapeTimers = [];

  function clearScrapeTimers() {
    scrapeTimers.forEach((t) => clearTimeout(t));
    scrapeTimers = [];
  }

  function setStatus(text, spinning) {
    linkStatus.classList.remove("is-hidden");
    linkStatus.classList.toggle("is-spinning", Boolean(spinning));
    linkStatus.innerHTML = spinning ? `<span class="menu-link__spinner">${ICONS.spinner}</span>${text}` : text;
  }

  function runScrape() {
    const url = linkInput.value.trim();
    if (!url) {
      linkInput.closest(".input-field").classList.add("input-field--error");
      return;
    }
    linkInput.closest(".input-field").classList.remove("input-field--error");
    clearScrapeTimers();
    scrapeConfirmed = false;
    linkResult.classList.add("is-hidden");
    confirmBtn.classList.remove("is-confirmed");
    confirmBtn.innerHTML = `${ICONS.check} Confirm menu`;
    fetchBtn.disabled = true;

    // Two-beat simulated search + scrape, then reveal the editable result
    setStatus("Searching the web for your menu…", true);
    scrapeTimers.push(setTimeout(() => {
      setStatus("Reading the menu…", true);
    }, 750));
    scrapeTimers.push(setTimeout(() => {
      linkStatus.classList.add("is-hidden");
      fetchBtn.disabled = false;
      fetchBtn.innerHTML = `${ICONS.sparkle} Scan again`;
      const scraped = sampleForUrl(url);
      if (!scrapedEditor) {
        scrapedEditor = createMenuEditor(scrapedMount, scraped);
      } else {
        scrapedEditor.setData(scraped);
      }
      linkResult.classList.remove("is-hidden");
    }, 1750));
  }

  fetchBtn.addEventListener("click", runScrape);
  confirmBtn.addEventListener("click", () => {
    scrapeConfirmed = true;
    confirmBtn.classList.add("is-confirmed");
    confirmBtn.innerHTML = `${ICONS.check} Menu confirmed`;
  });

  function selectMode(nextMode) {
    mode = nextMode;
    modeButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.mode === nextMode));
    panels.forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.panel !== nextMode));
  }

  modeButtons.forEach((btn) => btn.addEventListener("click", () => selectMode(btn.dataset.mode)));

  // Hidden native file input drives both click and drag-drop uploads
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ACCEPTED_TYPES;
  fileInput.className = "is-hidden";
  dropzone.appendChild(fileInput);

  const placeholderHTML = dropzone.innerHTML;

  // Swaps the dropzone for a compact preview (thumbnail for images, a
  // labelled file chip for PDFs) plus a Replace/Remove control.
  function showPreview(src, name, isImage) {
    fileName = name;
    const thumb = isImage
      ? `<img class="menu-card__thumb" src="${src}" alt="${name}" />`
      : `<span class="menu-card__file-icon">${ICONS.book}</span>`;
    dropzone.innerHTML = `
      <div class="menu-card__preview">
        ${thumb}
        <span class="menu-card__filename">${name}</span>
      </div>
      <button type="button" class="btn--tab-link" data-role="remove-file">Remove file</button>
    `;
    dropzone.querySelector('[data-role="remove-file"]').addEventListener("click", (event) => {
      event.stopPropagation();
      resetDropzone();
    });
  }

  function resetDropzone() {
    fileName = "";
    dropzone.innerHTML = placeholderHTML;
    dropzone.appendChild(fileInput);
    fileInput.value = "";
  }

  // Reads the chosen file locally and renders the right kind of preview
  function handleFile(file) {
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => showPreview(reader.result, file.name, true);
      reader.readAsDataURL(file);
    } else {
      showPreview("", file.name, false); // PDF: no thumbnail, just the name
    }
  }

  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("is-dragover");
  });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("is-dragover"));
  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragover");
    handleFile(event.dataTransfer.files[0]);
  });
  fileInput.addEventListener("change", () => handleFile(fileInput.files[0]));
  fileInput.addEventListener("click", (event) => event.stopPropagation());

  // Removing a card also drops it from the registry
  removeBtn.addEventListener("click", () => {
    clearScrapeTimers();
    const index = menuCards.findIndex((entry) => entry.id === id);
    if (index !== -1) menuCards.splice(index, 1);
    card.remove();
  });

  // Rebuilds this card's location <option>s, keeping the current choice if
  // that location still exists, then re-syncs the custom-select label.
  function setLocations(locations) {
    const current = locationSelect.value;
    locationSelect.innerHTML = locationOptionsHTML(locations, current);
    refreshCustomSelects();
  }

  const collapsible = makeCollapsible(card, {
    header: card.querySelector(".menu-card__header"),
    titleEl: card.querySelector(".menu-card__title"),
    body: card.querySelector(".menu-card__body"),
    ignore: "[data-role='remove-menu']",
    getSummary: () => {
      const opt = locationSelect.options[locationSelect.selectedIndex];
      const loc = locationSelect.value && opt ? opt.textContent : "Unlinked";
      let content;
      if (mode === "upload") {
        content = fileName || "No file";
      } else if (mode === "link") {
        if (scrapedEditor && scrapeConfirmed) content = `${countItems(scrapedEditor.getData())} items · from link`;
        else content = linkInput.value.trim() ? "Link pending" : "No link";
      } else {
        const n = countItems(manualEditor.getData());
        content = n ? `${n} item${n === 1 ? "" : "s"}` : "Empty";
      }
      return `${loc} · ${content}`;
    },
  });

  const entry = {
    id,
    element: card,
    setLocations,
    collapsible,
    getData: () => {
      const opt = locationSelect.options[locationSelect.selectedIndex];
      const base = {
        mode,
        fileName,
        linkUrl: linkInput.value.trim(),
        locationValue: locationSelect.value,
        locationLabel: locationSelect.value && opt ? opt.textContent : "",
        categories: [],
        manualText: "",
      };
      if (mode === "manual") {
        const data = manualEditor.getData();
        base.categories = data.categories;
        base.manualText = menuToText(data);
      } else if (mode === "link" && scrapedEditor && scrapeConfirmed) {
        const data = scrapedEditor.getData();
        base.categories = data.categories;
        base.manualText = menuToText(data);
        base.linkConfirmed = true;
      }
      return base;
    },
  };
  menuCards.push(entry);

  // Restore a saved menu (carry-over): re-select whichever mode was in use and
  // refill just that mode's field. File bytes aren't persisted, so an uploaded
  // menu restores as a file chip rather than an image thumbnail.
  if (prefill) {
    if (prefill.categories && prefill.categories.length) {
      manualEditor.setData({ categories: prefill.categories });
    }
    if (prefill.fileName) showPreview("", prefill.fileName, false);
    if (prefill.linkUrl) linkInput.value = prefill.linkUrl;
    // A previously-confirmed scrape comes back already reviewed and confirmed
    if (prefill.mode === "link" && prefill.linkConfirmed && prefill.categories && prefill.categories.length) {
      scrapedEditor = createMenuEditor(scrapedMount, { categories: prefill.categories });
      scrapeConfirmed = true;
      fetchBtn.innerHTML = `${ICONS.sparkle} Scan again`;
      confirmBtn.classList.add("is-confirmed");
      confirmBtn.innerHTML = `${ICONS.check} Menu confirmed`;
      linkResult.classList.remove("is-hidden");
    }
    selectMode(prefill.mode || (prefill.fileName ? "upload" : prefill.linkUrl ? "link" : "manual"));
    if (prefill.locationValue) locationSelect.value = prefill.locationValue;
  }

  // The <select> is created after the page's one-time initCustomSelects()
  // ran, so enhance just this new wrapper to match the rest of the UI.
  initCustomSelects(card);
  return entry;
}

// Returns the data for every current menu card, in display order.
export function getAllMenus() {
  return menuCards.map((entry) => entry.getData());
}

// Rebuilds the location dropdown in every card (call after locations change).
export function refreshMenuLocationOptions(locations) {
  menuCards.forEach((entry) => entry.setLocations(locations));
}

// Clears all menu cards (used by the wizard's full "Start over" reset).
export function resetMenus(containerEl) {
  menuCards.length = 0;
  menuCounter = 0;
  if (containerEl) containerEl.innerHTML = "";
}
