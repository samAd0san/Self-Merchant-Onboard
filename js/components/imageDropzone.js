// ==========================================================================
// Component: Image Dropzone
// A click-or-drag upload area with a client-side preview (no backend
// this is a static project, so files are read locally via FileReader).
// Each instance also supports a "paste a URL instead" fallback that swaps
// the dropzone for a plain text input.
// ==========================================================================

import { qs, setHidden } from "../utils/dom.js";

// options: { dropzoneId, urlLinkId, urlInputId }
export function initImageDropzone({ dropzoneId, urlLinkId, urlInputId }) {
  const dropzone = qs(`#${dropzoneId}`);
  const urlLink = qs(`#${urlLinkId}`);
  const urlInput = qs(`#${urlInputId}`);
  if (!dropzone) return;

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/png,image/jpeg,image/webp,image/svg+xml,image/gif";
  fileInput.className = "is-hidden";
  dropzone.appendChild(fileInput);

  const placeholderHTML = dropzone.innerHTML;

  function showPreview(src, label) {
    dropzone.innerHTML = `
      <img src="${src}" alt="${label}" style="max-height:96px; max-width:100%; border-radius: var(--radius-sm); margin-bottom: var(--space-3);" />
      <p style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">${label}</p>
      <button type="button" class="btn--tab-link" data-role="remove-image" style="margin-top: var(--space-2);">Remove</button>
    `;
    dropzone.querySelector('[data-role="remove-image"]').addEventListener("click", (event) => {
      event.stopPropagation();
      resetDropzone();
    });
  }

  function resetDropzone() {
    dropzone.innerHTML = placeholderHTML;
    dropzone.appendChild(fileInput);
    fileInput.value = "";
    if (urlInput) {
      setHidden(urlInput, true);
      urlInput.value = "";
    }
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => showPreview(reader.result, file.name);
    reader.readAsDataURL(file);
  }

  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.style.borderColor = "var(--brand-magenta)";
  });
  dropzone.addEventListener("dragleave", () => {
    dropzone.style.borderColor = "";
  });
  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.style.borderColor = "";
    handleFile(event.dataTransfer.files[0]);
  });
  fileInput.addEventListener("change", () => handleFile(fileInput.files[0]));
  fileInput.addEventListener("click", (event) => event.stopPropagation());

  // "Or paste a URL instead" swaps in a plain input; a valid URL previews too
  if (urlLink && urlInput) {
    urlLink.addEventListener("click", () => {
      setHidden(urlInput, false);
      urlInput.focus();
    });
    urlInput.addEventListener("change", () => {
      if (urlInput.value.trim()) showPreview(urlInput.value.trim(), "Image from URL");
    });
  }
}
