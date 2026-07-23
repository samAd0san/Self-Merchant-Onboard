// ==========================================================================
// Page Entry: Storefront Customization
// The storefront-branding controls, moved out of the onboarding wizard into
// a dedicated post-launch page: identity fields, logo/hero dropzones, color
// pickers, weekly hours, and the public-storefront toggle + slug preview.
// ==========================================================================

import { qs, qsa, setHidden } from "../utils/dom.js";
import { ICONS } from "../utils/icons.js";
import { initImageDropzone } from "../components/imageDropzone.js";
import { initCustomSelects } from "../components/customSelect.js";
import { initPageTransitions } from "../utils/pageTransition.js";
import { validators as V, formatters as F, attachValidation } from "../utils/validation.js";

// ---- Static icon injection -------------------------------------------------
function injectStaticIcons() {
  const iconMap = {
    "icon-back": "chevronLeft",
    "icon-back-launch": "rocket",
    "icon-storefront-identity": "image",
    "icon-align-left": "alignLeft",
    "icon-align-right": "alignRight",
    "icon-dropzone-logo": "image",
    "icon-dropzone-hero": "image",
    "icon-link-logo": "link",
    "icon-link-hero": "link",
    "icon-colors": "palette",
    "icon-public-storefront": "bag",
    "icon-storefront-slug": "globe",
    "icon-storefront-preview-link": "link",
    "icon-save": "check",
    "icon-saved-check": "check",
  };
  Object.entries(iconMap).forEach(([id, key]) => {
    const el = qs(`#${id}`);
    if (el) el.innerHTML = ICONS[key];
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initPageTransitions();
  injectStaticIcons();
  initCustomSelects();

  // Hero text alignment toggle
  const alignButtons = qsa("#btn-align-left, #btn-align-right");
  alignButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      alignButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
    });
  });

  // Logo / Hero image dropzones (client-side preview only, no backend)
  initImageDropzone({ dropzoneId: "dropzone-logo", urlLinkId: "link-logo-url", urlInputId: "input-logo-url" });
  initImageDropzone({ dropzoneId: "dropzone-hero", urlLinkId: "link-hero-url", urlInputId: "input-hero-url" });

  // Primary / Accent color pickers swatch and hex field stay in sync
  function linkColorField(swatchId, hexId) {
    const swatch = qs(`#${swatchId}`);
    const hex = qs(`#${hexId}`);
    if (!swatch || !hex) return null;
    swatch.addEventListener("input", () => (hex.value = swatch.value.toUpperCase()));
    // Validate the hex field (red on bad format); sync the swatch when valid
    return attachValidation(hex, {
      validate: V.hex,
      format: F.hex,
      message: "Use a 6-digit hex like #0305C6.",
      onChange: () => { if (V.hex(hex.value)) swatch.value = hex.value; },
    });
  }
  const colorValidators = [
    linkColorField("input-primary-color-swatch", "input-primary-color-hex"),
    linkColorField("input-accent-color-swatch", "input-accent-color-hex"),
  ];

  // Public storefront toggle + live slug preview
  const storefrontSlugInput = qs("#input-storefront-slug");
  const storefrontPreviewSlug = qs("#storefront-preview-slug");

  function slugify(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  storefrontSlugInput.addEventListener("input", () => {
    const clean = slugify(storefrontSlugInput.value);
    storefrontPreviewSlug.textContent = clean || "your-business";
  });

  // Default the slug from the display name until the user edits the slug
  const displayNameInput = qs("#input-display-name");
  let slugManuallyEdited = false;
  storefrontSlugInput.addEventListener("input", () => (slugManuallyEdited = true));
  displayNameInput.addEventListener("input", () => {
    if (slugManuallyEdited) return;
    const clean = slugify(displayNameInput.value);
    storefrontSlugInput.value = clean;
    storefrontPreviewSlug.textContent = clean || "your-business";
  });

  // Field validators: slug (auto-cleaned), and the optional logo/hero URLs
  const slugValidator = attachValidation(storefrontSlugInput, { validate: V.slug, format: F.slug, message: "Letters, numbers, and dashes only." });
  const urlValidators = [
    attachValidation(qs("#input-logo-url"), { validate: V.url, message: "Enter a valid https:// URL." }),
    attachValidation(qs("#input-hero-url"), { validate: V.url, message: "Enter a valid https:// URL." }),
  ];
  const allValidators = [...colorValidators, slugValidator, ...urlValidators].filter(Boolean);

  // Save action shows a brief confirmation toast (no backend yet). Any field
  // with an invalid format blocks the save and reveals its error.
  const saveButton = qs("#btn-save-storefront");
  const savedToast = qs("#storefront-saved");
  saveButton.addEventListener("click", () => {
    const invalid = allValidators.filter((v) => !v.isValid());
    if (invalid.length) {
      invalid.forEach((v) => v.showError());
      return;
    }
    setHidden(savedToast, false);
    savedToast.classList.remove("is-leaving");
    // Auto-dismiss after a few seconds
    clearTimeout(saveButton._t);
    saveButton._t = setTimeout(() => setHidden(savedToast, true), 2600);
  });
});
