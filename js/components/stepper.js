// ==========================================================================
// Component: Wizard Stepper
// Renders the row of progress badges (completed / active / upcoming) for
// the onboarding wizard, based on the step definitions and current index.
// ==========================================================================

import { ICONS } from "../utils/icons.js";

// The full onboarding sequence. Each step maps to a .wizard-step section
// in onboarding.html by matching `id` against its data-step-id.
export const WIZARD_STEPS = [
  { id: "business", icon: "building", label: "Business Details" },
  { id: "knowledge", icon: "book", label: "Knowledge Base" },
  { id: "integration", icon: "storefront", label: "Service Setup" },
  { id: "voice-greeting", icon: "mic", label: "Parcera AI Setup" },
  { id: "payments", icon: "creditCard", label: "Payment Method" },
  { id: "launch", icon: "rocket", label: "Launch" },
];

export function renderStepper(container, currentIndex, options = {}) {
  const { completed = new Set(), onNavigate = null, maxReachable = currentIndex } = options;
  container.innerHTML = "";

  WIZARD_STEPS.forEach((step, index) => {
    if (index > 0) {
      const connector = document.createElement("span");
      connector.className = "wizard-stepper__connector";
      container.appendChild(connector);
    }

    // State rules:
    //  - active  : the step currently being viewed (grey fill, blue outline)
    //  - complete: a *visited & completed* step the user has since left (solid blue)
    //  - upcoming : not yet completed / not yet reached (grey)
    // The step's own icon is always kept - completion never swaps in a
    // checkmark; instead the whole badge simply turns solid blue.
    let state;
    if (index === currentIndex) state = "active";
    else if (completed.has(step.id)) state = "complete";
    else state = "upcoming";

    const badge = document.createElement("button");
    badge.type = "button";
    badge.className = `wizard-stepper__badge wizard-stepper__badge--${state}`;
    badge.title = step.label;
    badge.dataset.stepIndex = String(index);
    badge.innerHTML = ICONS[step.icon]; // always the step's own icon

    // Any already-reached step (or completed one) is clickable so the user
    // can jump straight back to edit it.
    const reachable = index <= maxReachable || completed.has(step.id);
    if (reachable && typeof onNavigate === "function") {
      badge.addEventListener("click", () => onNavigate(index));
    } else {
      badge.classList.add("is-locked");
    }

    container.appendChild(badge);
  });
}
