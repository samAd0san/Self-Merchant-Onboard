// ==========================================================================
// Component: Menu Editor
// A structured menu builder shared by the Restaurant Details step: it powers
// both the "Add manually" mode and the review view after a menu link is
// fetched. Items render as an editable card grid (photo + name + price +
// description), mirroring the menu-review cards in operator-ui / merchant-ui.
//
// Each editor exposes a small API:
//   { getData(), setData(data) }
// getData() returns { categories: [{ name, items: [{ name, price, photo, description }] }] }
// ==========================================================================

import { ICONS } from "../utils/icons.js";

// First two letters of an item's name, used as the image-band fallback monogram
function monogram(name) {
  return (name || "").trim().slice(0, 2).toUpperCase() || "··";
}

// Builds one item card. `prefill` optionally seeds name / price / photo / description.
function createItemCard(prefill = null) {
  const card = document.createElement("div");
  card.className = "menu-item-card";
  card.innerHTML = `
    <button type="button" class="menu-item-card__image" data-role="photo" aria-label="Add item photo">
      <span class="menu-item-card__monogram" data-role="monogram">··</span>
    </button>
    <button type="button" class="menu-item-card__remove" data-role="remove-item" aria-label="Remove item">${ICONS.close}</button>
    <div class="menu-item-card__body">
      <div class="menu-item-card__toprow">
        <input class="menu-item-card__name" type="text" placeholder="Item name" aria-label="Item name" />
        <div class="menu-item-card__price">
          <span class="menu-item-card__price-prefix">$</span>
          <input class="menu-item-card__price-input" type="text" inputmode="decimal" placeholder="0.00" aria-label="Item price" />
        </div>
      </div>
      <input class="menu-item-card__desc" type="text" placeholder="Add a short description" aria-label="Item description" />
    </div>
  `;

  const photoBtn = card.querySelector('[data-role="photo"]');
  const monogramEl = card.querySelector('[data-role="monogram"]');
  const nameInput = card.querySelector(".menu-item-card__name");
  const priceInput = card.querySelector(".menu-item-card__price-input");
  const descInput = card.querySelector(".menu-item-card__desc");

  // Photo is stored on the element as a data URL so getData can read it back
  card._photo = "";

  // Hidden file input drives the photo picker for this card
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/png,image/jpeg,image/webp";
  fileInput.className = "is-hidden";
  card.appendChild(fileInput);

  function renderPhoto() {
    if (card._photo) {
      photoBtn.classList.add("has-photo");
      photoBtn.innerHTML = `
        <img class="menu-item-card__thumb" src="${card._photo}" alt="" />
        <span class="menu-item-card__photo-clear" data-role="clear-photo" aria-label="Remove photo">${ICONS.close}</span>
      `;
      photoBtn.querySelector('[data-role="clear-photo"]').addEventListener("click", (event) => {
        event.stopPropagation();
        card._photo = "";
        fileInput.value = "";
        renderPhoto();
      });
    } else {
      photoBtn.classList.remove("has-photo");
      photoBtn.innerHTML = `<span class="menu-item-card__monogram" data-role="monogram">${monogram(nameInput.value)}</span>`;
    }
  }

  photoBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      card._photo = reader.result;
      renderPhoto();
    };
    reader.readAsDataURL(file);
  });

  // Keep the monogram fallback in sync with the name while no photo is set
  nameInput.addEventListener("input", () => {
    if (!card._photo) monogramEl.textContent = monogram(nameInput.value);
  });

  card.querySelector('[data-role="remove-item"]').addEventListener("click", () => {
    const grid = card.parentElement;
    card.remove();
    if (grid && grid._syncCount) grid._syncCount();
  });

  if (prefill) {
    nameInput.value = prefill.name || "";
    priceInput.value = prefill.price || "";
    descInput.value = prefill.description || "";
    monogramEl.textContent = monogram(nameInput.value);
    if (prefill.photo) {
      card._photo = prefill.photo;
      renderPhoto();
    }
  }

  return card;
}

// Builds one category block, seeded with `prefill.items` (or a single empty
// item card so the category never looks empty).
function createCategory(prefill = null) {
  const cat = document.createElement("div");
  cat.className = "menu-cat";
  cat.innerHTML = `
    <div class="menu-cat__head">
      <input class="menu-cat__name" type="text" placeholder="Category name (e.g. Bagels)" aria-label="Category name" />
      <span class="menu-cat__count" data-role="count">0 items</span>
      <button type="button" class="menu-cat__remove" data-role="remove-cat" aria-label="Remove category">${ICONS.close}</button>
    </div>
    <div class="menu-cat__grid" data-role="items"></div>
  `;

  const nameInput = cat.querySelector(".menu-cat__name");
  const grid = cat.querySelector('[data-role="items"]');
  const countEl = cat.querySelector('[data-role="count"]');

  // Dashed "Add item" tile that always sits at the end of the grid
  const addTile = document.createElement("button");
  addTile.type = "button";
  addTile.className = "menu-cat__add-tile";
  addTile.dataset.role = "add-item";
  addTile.innerHTML = `${ICONS.plus}<span>Add item</span>`;

  function syncCount() {
    const n = grid.querySelectorAll(".menu-item-card").length;
    countEl.textContent = `${n} item${n === 1 ? "" : "s"}`;
  }
  grid._syncCount = syncCount;

  function addItem(itemPrefill) {
    grid.insertBefore(createItemCard(itemPrefill), addTile);
    syncCount();
  }

  addTile.addEventListener("click", () => addItem());
  cat.querySelector('[data-role="remove-cat"]').addEventListener("click", () => cat.remove());

  const items = (prefill && prefill.items && prefill.items.length) ? prefill.items : [null];
  items.forEach((it) => grid.insertBefore(createItemCard(it), null));
  grid.appendChild(addTile);
  syncCount();
  if (prefill && prefill.name) nameInput.value = prefill.name;

  return cat;
}

// Mounts an editor into `mountEl`. `initial` optionally seeds categories.
export function createMenuEditor(mountEl, initial = null) {
  mountEl.classList.add("menu-editor");
  mountEl.innerHTML = `
    <div class="menu-editor__categories" data-role="categories"></div>
    <button type="button" class="menu-editor__add-cat" data-role="add-cat">${ICONS.plus} Add category</button>
  `;

  const catsWrap = mountEl.querySelector('[data-role="categories"]');

  mountEl.querySelector('[data-role="add-cat"]').addEventListener("click", () => {
    catsWrap.appendChild(createCategory());
  });

  function setData(data) {
    catsWrap.innerHTML = "";
    const cats = (data && data.categories && data.categories.length) ? data.categories : [null];
    cats.forEach((c) => catsWrap.appendChild(createCategory(c)));
  }

  function getData() {
    const categories = [];
    catsWrap.querySelectorAll(".menu-cat").forEach((catEl) => {
      const name = catEl.querySelector(".menu-cat__name").value.trim();
      const items = [];
      catEl.querySelectorAll(".menu-item-card").forEach((itemEl) => {
        const itemName = itemEl.querySelector(".menu-item-card__name").value.trim();
        const price = itemEl.querySelector(".menu-item-card__price-input").value.trim();
        const description = itemEl.querySelector(".menu-item-card__desc").value.trim();
        if (!itemName && !price && !description && !itemEl._photo) return; // skip blank cards
        items.push({ name: itemName, price, description, photo: itemEl._photo || "" });
      });
      if (name || items.length) categories.push({ name, items });
    });
    return { categories };
  }

  // Seed with provided data, or a single empty category to start
  setData(initial);

  return { getData, setData };
}

// Renders a structured menu as plain text, used for the review summary and as
// the value the AI would ingest. Kept terse: "Category\n  Item — $price".
export function menuToText(data) {
  if (!data || !data.categories) return "";
  const lines = [];
  data.categories.forEach((cat) => {
    if (cat.name) lines.push(cat.name);
    cat.items.forEach((it) => {
      const price = it.price ? ` — $${it.price}` : "";
      lines.push(`  ${it.name}${price}`);
    });
  });
  return lines.join("\n").trim();
}
