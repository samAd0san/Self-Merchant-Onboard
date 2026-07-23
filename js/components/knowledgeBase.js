// ==========================================================================
// Component: FAQ List
// Renders repeatable question/answer blocks for the Knowledge Base step.
// Each FAQ can be removed; the first one is kept so there's always a
// starting point. The module keeps its own registry so the wizard can read
// every entry back in one call.
// ==========================================================================

import { ICONS } from "../utils/icons.js";
import { makeCollapsible } from "./collapsible.js";

let faqCounter = 0;
const faqs = []; // { id, element, getData, collapsible }

// Small HTML escape for text dropped into a summary line via innerHTML
function esc(text) {
  return String(text).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

// Creates and appends one FAQ block to the container
export function addFaq(containerEl, { removable = true, prefill = null } = {}) {
  faqCounter += 1;
  const id = faqCounter;
  const number = containerEl.querySelectorAll(".faq-block").length + 1;

  // Adding a new FAQ folds the existing ones to their summary so the list
  // stays short and the focus is on the one just added.
  faqs.forEach((entry) => entry.collapsible && entry.collapsible.collapse());

  const block = document.createElement("div");
  block.className = "faq-block";
  block.dataset.faqId = String(id);

  block.innerHTML = `
    <div class="faq-block__header">
      <span class="faq-block__title">FAQ ${number}</span>
      <button type="button" class="faq-block__remove ${removable ? "" : "is-hidden"}" data-role="remove-faq" aria-label="Remove FAQ">
        ${ICONS.close}
      </button>
    </div>
    <div class="faq-block__body">
      <div class="field-group" style="margin-top: 0;">
        <label class="field-group__label">Question</label>
        <div class="input-field">
          <input class="input-field__control faq-block__question" style="padding-left: var(--space-4);" type="text" placeholder="e.g., Do you take walk-ins?" />
        </div>
      </div>
      <div class="field-group">
        <label class="field-group__label">Answer</label>
        <div class="input-field">
          <textarea class="input-field__control faq-block__answer" style="padding-left: var(--space-4); resize: vertical; min-height: 64px;" placeholder="Type the answer your Parcera AI should give"></textarea>
        </div>
      </div>
    </div>
  `;

  containerEl.appendChild(block);

  const questionInput = block.querySelector(".faq-block__question");
  const collapsible = makeCollapsible(block, {
    header: block.querySelector(".faq-block__header"),
    titleEl: block.querySelector(".faq-block__title"),
    body: block.querySelector(".faq-block__body"),
    ignore: "[data-role='remove-faq']",
    collapsed: true,
    getSummary: () => {
      const q = questionInput.value.trim();
      return q ? esc(q) : "<em>New question</em>";
    },
  });

  block.querySelector("[data-role='remove-faq']").addEventListener("click", () => {
    const index = faqs.findIndex((entry) => entry.id === id);
    if (index !== -1) faqs.splice(index, 1);
    block.remove();
    renumber(containerEl);
  });

  const entry = {
    id,
    element: block,
    collapsible,
    getData: () => ({
      question: questionInput.value.trim(),
      answer: block.querySelector(".faq-block__answer").value.trim(),
    }),
  };
  faqs.push(entry);

  // Restore a saved question/answer (carry-over across onboardings)
  if (prefill) {
    if (prefill.question) block.querySelector(".faq-block__question").value = prefill.question;
    if (prefill.answer) block.querySelector(".faq-block__answer").value = prefill.answer;
  }

  return entry;
}

// Keeps the visible "FAQ N" labels sequential after a removal
function renumber(containerEl) {
  containerEl.querySelectorAll(".faq-block .faq-block__title").forEach((el, i) => {
    el.textContent = `FAQ ${i + 1}`;
  });
}

// Returns all non-empty FAQ entries
export function getAllFaqs() {
  return faqs.map((entry) => entry.getData()).filter((f) => f.question || f.answer);
}

// Clears all FAQ blocks (used by the wizard reset)
export function resetFaqs(containerEl) {
  faqs.length = 0;
  faqCounter = 0;
  if (containerEl) containerEl.innerHTML = "";
}
