// ==========================================================================
// Onboarding State (session persistence)
// The onboarding wizard normally keeps all state in memory, which is fine
// within a single page. But the wizard can be reached again AFTER leaving the
// page (e.g. Storefront -> "Back to launch"), and a fresh page load would
// otherwise lose the business, menus, and selected services already set up.
//
// This module persists just enough to carry that state across navigations,
// using sessionStorage so it lives for the browser session and clears on
// "Start over". File bytes aren't stored — only each menu's name and linked
// location — which is all that's needed to restore the linkage.
// ==========================================================================

const STORAGE_KEY = "parcera.onboarding.v1";

// Persists the carry-over slice of wizard state. Wrapped in try/catch so
// private-mode or quota errors never break the flow.
export function saveOnboardingState(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    /* storage unavailable — carry-over simply won't survive navigation */
  }
}

// Returns the saved state object, or null when nothing is stored / readable.
export function loadOnboardingState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

// Clears the saved state (used by the full "Start over" reset).
export function clearOnboardingState() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    /* nothing to clean up */
  }
}
