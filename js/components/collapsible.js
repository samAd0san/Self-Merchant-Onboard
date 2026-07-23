// ==========================================================================
// Component: Collapsible
// Turns a "card with a header" into an accordion: a chevron is added beside
// the title, the body collapses, and a compact one-line summary takes its
// place when collapsed. Used across the wizard's repeatable blocks (location,
// transfer rule, menu, FAQ) and the Review summary groups so a long step
// reads as a short, scannable list that expands on demand.
//
// It doesn't restructure the whole header: it wraps just the chevron + title
// into a lead cluster (so space-between headers keep their action button on
// the right), and inserts the summary line between the header and the body.
//
//   makeCollapsible(card, { header, titleEl, body, getSummary, ignore, collapsed })
//     -> { collapse() }
// The card also manages its own expand/collapse via clicks on the header or
// the collapsed summary line; `collapse()` is exposed only for callers that
// need to fold a card programmatically (e.g. collapsing siblings when a new
// one is added). `getSummary()` returns HTML for the collapsed summary line.
// `ignore` is a selector for header controls (remove/edit) that must NOT
// toggle the card when clicked.
// ==========================================================================

import { ICONS } from "../utils/icons.js";

export function makeCollapsible(card, { header, titleEl, body, getSummary, ignore, collapsed = false }) {
  // Group the chevron + existing title into a left cluster so the header's
  // right-aligned action (Remove / Edit) stays put under space-between.
  const lead = document.createElement("span");
  lead.className = "collapsible__lead";
  header.insertBefore(lead, header.firstChild);

  const chevron = document.createElement("span");
  chevron.className = "collapsible__chevron";
  chevron.innerHTML = ICONS.chevronDown;
  lead.appendChild(chevron);
  if (titleEl) lead.appendChild(titleEl); // moves the title into the cluster

  header.classList.add("collapsible__header");
  header.setAttribute("role", "button");
  header.setAttribute("tabindex", "0");

  // Summary line lives between the header and the body; only shown collapsed
  const summary = document.createElement("div");
  summary.className = "collapsible__summary is-hidden";
  body.parentNode.insertBefore(summary, body);

  let state = collapsed;

  function apply() {
    card.classList.toggle("is-collapsed", state);
    body.classList.toggle("is-hidden", state);
    summary.classList.toggle("is-hidden", !state);
    if (state && typeof getSummary === "function") summary.innerHTML = getSummary();
    header.setAttribute("aria-expanded", String(!state));
  }

  function setState(next) {
    state = next;
    apply();
  }

  header.addEventListener("click", (event) => {
    // Let action controls in the header (Remove / Edit) do their own thing
    if (ignore && event.target.closest(ignore)) return;
    setState(!state);
  });

  // Keyboard: Enter / Space toggles, matching the button role
  header.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (ignore && event.target.closest(ignore)) return;
    event.preventDefault();
    setState(!state);
  });

  // Clicking the collapsed summary expands the card back open
  summary.addEventListener("click", () => setState(false));

  apply();

  return {
    collapse: () => setState(true),
  };
}
