// ==========================================================================
// DOM Utilities
// Tiny helpers to keep component files free of query-selector boilerplate.
// ==========================================================================

// Shorthand for a single element lookup within an optional root
export function qs(selector, root = document) {
  return root.querySelector(selector);
}

// Shorthand for a list of elements, returned as a real array
export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

// Toggle the shared "hidden" utility class based on a boolean condition
export function setHidden(element, hidden) {
  element.classList.toggle("is-hidden", hidden);
}
