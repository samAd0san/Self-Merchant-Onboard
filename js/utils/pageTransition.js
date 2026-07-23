// ==========================================================================
// Page Transitions
// Gives every page a soft fade in on load, and a smooth fade out before any
// same-site navigation, so moving between screens never feels abrupt. Also
// adds a brief pressed state to buttons and links for tactile feedback.
// ==========================================================================

// How long the fade out runs before the browser actually navigates. Kept
// short so it feels responsive rather than sluggish.
const FADE_MS = 260;

// Marks a click target as internal (same-origin, real destination) so we can
// animate out before letting the browser follow it.
function isInternalNavigation(anchor) {
  if (!anchor || !anchor.href) return false;
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  // Ignore pure in-page anchors (#section) and javascript: links
  if (url.pathname === window.location.pathname && url.hash) return false;
  return true;
}

export function initPageTransitions() {
  const body = document.body;

  // Fade in once styles and DOM are ready
  requestAnimationFrame(() => body.classList.add("is-page-ready"));

  // Intercept internal link clicks to fade out first, then navigate
  document.addEventListener("click", (event) => {
    const anchor = event.target.closest("a");
    if (!anchor || !isInternalNavigation(anchor)) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey) return; // let power-users open tabs

    event.preventDefault();
    const destination = anchor.href;
    anchor.classList.add("is-pressed");
    body.classList.add("is-page-leaving");
    window.setTimeout(() => {
      window.location.href = destination;
    }, FADE_MS);
  });

  // Restore the fade in if the page is shown again from the bfcache
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      body.classList.remove("is-page-leaving");
      body.classList.add("is-page-ready");
    }
  });
}
