// ==========================================================================
// Component: Custom Select
// Native <select> popups can't be restyled with CSS the open list always
// falls back to plain OS/browser chrome. This progressively enhances every
// ".select-field" that wraps a <select> into a fully custom trigger +
// listbox, while keeping the original <select> in the DOM (hidden) as the
// source of truth so existing code that reads/sets/listens on `.value`
// keeps working untouched.
// ==========================================================================

import { qs, qsa } from "../utils/dom.js";

const enhancedTriggers = [];

function closeAllExcept(exceptWrapper) {
  enhancedTriggers.forEach(({ wrapper, close }) => {
    if (wrapper !== exceptWrapper) close();
  });
}

function enhanceOne(wrapper) {
  const nativeSelect = wrapper.querySelector("select");
  if (!nativeSelect || wrapper.dataset.enhanced === "true") return;
  wrapper.dataset.enhanced = "true";

  const existingChevron = wrapper.querySelector(".select-field__chevron");
  nativeSelect.classList.add("is-visually-hidden");

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "custom-select__trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");

  const label = document.createElement("span");
  label.className = "custom-select__label";
  trigger.appendChild(label);

  if (existingChevron) trigger.appendChild(existingChevron);

  const listbox = document.createElement("ul");
  listbox.className = "custom-select__listbox is-hidden";
  listbox.setAttribute("role", "listbox");

  function buildOptions() {
    listbox.innerHTML = "";
    Array.from(nativeSelect.options).forEach((opt) => {
      const li = document.createElement("li");
      li.className = "custom-select__option";
      li.setAttribute("role", "option");
      li.dataset.value = opt.value;
      li.textContent = opt.textContent;
      if (opt.value === nativeSelect.value) li.classList.add("is-selected");
      if (opt.disabled) li.classList.add("is-disabled");
      listbox.appendChild(li);
    });
  }

  function updateLabel() {
    const selected = nativeSelect.options[nativeSelect.selectedIndex];
    label.textContent = selected ? selected.textContent : "";
    label.classList.toggle("is-placeholder", !nativeSelect.value);
  }

  function open() {
    closeAllExcept(wrapper);
    buildOptions();
    listbox.classList.remove("is-hidden");
    trigger.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
  }

  function close() {
    listbox.classList.add("is-hidden");
    trigger.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  }

  trigger.addEventListener("click", () => {
    const isOpen = !listbox.classList.contains("is-hidden");
    isOpen ? close() : open();
  });

  listbox.addEventListener("click", (event) => {
    const li = event.target.closest(".custom-select__option");
    if (!li || li.classList.contains("is-disabled")) return;
    nativeSelect.value = li.dataset.value;
    nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    updateLabel();
    close();
    trigger.focus();
  });

  document.addEventListener("click", (event) => {
    if (!wrapper.contains(event.target)) close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  wrapper.appendChild(trigger);
  wrapper.appendChild(listbox);

  updateLabel();
  enhancedTriggers.push({ wrapper, close, refresh: updateLabel });
}

export function initCustomSelects(root = document) {
  qsa(".select-field", root).forEach(enhanceOne);
}

// Called after any code sets a native select's .value directly (bypassing
// the custom UI, e.g. the wizard's "Start over" reset) so the visible
// label stays in sync with the underlying value.
export function refreshCustomSelects() {
  enhancedTriggers.forEach(({ refresh }) => refresh());
}
