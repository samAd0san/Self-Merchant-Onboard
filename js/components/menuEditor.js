// ==========================================================================
// Component: Menu Editor
// A compact structured menu builder shared by the Knowledge Base step: it
// powers both the "Type it in" mode and the confirmation view after a menu
// link is scraped. The user adds categories, adds items inside each category,
// and each item carries a name, a price, and an optional photo. The whole
// thing is intentionally dense — one row per item — so a full menu stays short
// on screen.
//
// Each editor is self-contained and exposes a small API:
//   { getData(), setData(data) }
// getData() returns { categories: [{ name, items: [{ name, price, photo }] }] }
// where `photo` is a data URL (or "").
// ==========================================================================

import { ICONS } from "../utils/icons.js";

// Builds one item row. `prefill` optionally seeds name / price / photo.
function createItemRow(prefill = null) {
  const row = document.createElement("div");
  row.className = "menu-item";
  row.innerHTML = `
    <button type="button" class="menu-item__photo" data-role="photo" aria-label="Add item photo">
      <span class="menu-item__photo-icon">${ICONS.image}</span>
    </button>
    <input class="menu-item__name" type="text" placeholder="Item name" aria-label="Item name" />
    <div class="menu-item__price">
      <span class="menu-item__price-prefix">$</span>
      <input class="menu-item__price-input" type="text" inputmode="decimal" placeholder="0.00" aria-label="Item price" />
    </div>
    <button type="button" class="menu-item__remove" data-role="remove-item" aria-label="Remove item">${ICONS.close}</button>
  `;

  const photoBtn = row.querySelector('[data-role="photo"]');
  const nameInput = row.querySelector(".menu-item__name");
  const priceInput = row.querySelector(".menu-item__price-input");

  // Photo is stored on the element as a data URL so getData can read it back
  row._photo = "";

  // Hidden file input drives the photo picker for this row
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/png,image/jpeg,image/webp";
  fileInput.className = "is-hidden";
  row.appendChild(fileInput);

  function renderPhoto() {
    if (row._photo) {
      photoBtn.classList.add("has-photo");
      photoBtn.innerHTML = `
        <img class="menu-item__thumb" src="${row._photo}" alt="" />
        <span class="menu-item__photo-clear" data-role="clear-photo" aria-label="Remove photo">${ICONS.close}</span>
      `;
      photoBtn.querySelector('[data-role="clear-photo"]').addEventListener("click", (event) => {
        event.stopPropagation();
        row._photo = "";
        fileInput.value = "";
        renderPhoto();
      });
    } else {
      photoBtn.classList.remove("has-photo");
      photoBtn.innerHTML = `<span class="menu-item__photo-icon">${ICONS.image}</span>`;
    }
  }

  photoBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      row._photo = reader.result;
      renderPhoto();
    };
    reader.readAsDataURL(file);
  });

  row.querySelector('[data-role="remove-item"]').addEventListener("click", () => row.remove());

  if (prefill) {
    nameInput.value = prefill.name || "";
    priceInput.value = prefill.price || "";
    if (prefill.photo) {
      row._photo = prefill.photo;
      renderPhoto();
    }
  }

  return row;
}

// Builds one category block, seeded with `prefill.items` (or a single empty
// item row so the category never looks empty).
function createCategory(prefill = null) {
  const cat = document.createElement("div");
  cat.className = "menu-cat";
  cat.innerHTML = `
    <div class="menu-cat__head">
      <input class="menu-cat__name" type="text" placeholder="Category name (e.g. Starters)" aria-label="Category name" />
      <button type="button" class="menu-cat__remove" data-role="remove-cat" aria-label="Remove category">${ICONS.close}</button>
    </div>
    <div class="menu-cat__items" data-role="items"></div>
    <button type="button" class="menu-cat__add-item" data-role="add-item">${ICONS.plus} Add item</button>
  `;

  const nameInput = cat.querySelector(".menu-cat__name");
  const itemsWrap = cat.querySelector('[data-role="items"]');

  cat.querySelector('[data-role="add-item"]').addEventListener("click", () => {
    itemsWrap.appendChild(createItemRow());
  });
  cat.querySelector('[data-role="remove-cat"]').addEventListener("click", () => cat.remove());

  const items = (prefill && prefill.items && prefill.items.length) ? prefill.items : [null];
  items.forEach((it) => itemsWrap.appendChild(createItemRow(it)));
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
      catEl.querySelectorAll(".menu-item").forEach((itemEl) => {
        const itemName = itemEl.querySelector(".menu-item__name").value.trim();
        const price = itemEl.querySelector(".menu-item__price-input").value.trim();
        if (!itemName && !price && !itemEl._photo) return; // skip blank rows
        items.push({ name: itemName, price, photo: itemEl._photo || "" });
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
