// ==========================================================================
// Validation utilities
// A small, reusable set of format validators, input formatters, and a helper
// that wires an <input> to show a red error state + inline message when the
// value doesn't match its expected format. Used to enforce "each field only
// accepts the stated format, and turns red otherwise" consistently across
// the wizard, auth, and storefront pages.
// ==========================================================================

// ---- Validators: return true when the value is acceptable ----------------
// Empty values are treated as valid here; "required" is enforced separately
// so an untouched optional field never shows red.
export const validators = {
  required: (v) => v.trim().length > 0,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  phone: (v) => {
    const d = v.replace(/\D/g, "");
    return d.length === 10 || (d.length === 11 && d[0] === "1");
  },
  ein: (v) => /^\d{2}-?\d{7}$/.test(v.trim()),
  ssn: (v) => /^\d{3}-?\d{2}-?\d{4}$/.test(v.trim()),
  url: (v) => /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(v.trim()),
  cardNumber: (v) => /^\d{13,19}$/.test(v.replace(/\s/g, "")),
  cardExp: (v) => {
    const m = v.replace(/\s/g, "").match(/^(\d{2})\/(\d{2})$/);
    if (!m) return false;
    const mm = Number(m[1]);
    return mm >= 1 && mm <= 12;
  },
  cvc: (v) => /^\d{3,4}$/.test(v.trim()),
  zip: (v) => /^\d{5}(-\d{4})?$/.test(v.trim()),
  routing: (v) => /^\d{9}$/.test(v.trim()),
  account: (v) => /^\d{4,17}$/.test(v.trim()),
  slug: (v) => /^[a-z0-9-]+$/.test(v.trim()),
  hex: (v) => /^#?[0-9a-fA-F]{6}$/.test(v.trim()),
  dob: (v) => {
    const m = v.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return false;
    const mm = Number(m[1]);
    const dd = Number(m[2]);
    const yyyy = Number(m[3]);
    if (mm < 1 || mm > 12) return false;
    if (dd < 1 || dd > new Date(yyyy, mm, 0).getDate()) return false;
    return yyyy > 1900 && yyyy <= new Date().getFullYear();
  },
};

// ---- Formatters: constrain/shape the value as the user types --------------
export const formatters = {
  digits: (v) => v.replace(/\D/g, ""),
  phone: (v) => {
    let d = v.replace(/\D/g, "");
    // Drop a leading US country code (+1 / 1) rather than let it get mistaken
    // for the start of the area code - no country code is ever required here.
    if (d.length === 11 && d[0] === "1") d = d.slice(1);
    d = d.slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  },
  routing: (v) => v.replace(/\D/g, "").slice(0, 9),
  account: (v) => v.replace(/\D/g, "").slice(0, 17),
  dob: (v) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
    if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
    return d;
  },
  ein: (v) => {
    const d = v.replace(/\D/g, "").slice(0, 9);
    return d.length > 2 ? `${d.slice(0, 2)}-${d.slice(2)}` : d;
  },
  ssn: (v) => {
    const d = v.replace(/\D/g, "").slice(0, 9);
    if (d.length > 5) return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
    if (d.length > 3) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return d;
  },
  zip: (v) => {
    const d = v.replace(/\D/g, "").slice(0, 9);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  },
  cardNumber: (v) => v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim(),
  cardExp: (v) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
  },
  slug: (v) => v.toLowerCase().replace(/[^a-z0-9-]/g, ""),
  hex: (v) => {
    let x = v.replace(/[^#0-9a-fA-F]/g, "");
    if (x && x[0] !== "#") x = `#${x.replace(/#/g, "")}`;
    return x.slice(0, 7);
  },
};

// Finds the control's wrapper and its inline error element, creating the
// error element positioned sensibly for the field's layout: inside a
// .field-group (below its controls) when present, otherwise as a sibling
// directly beneath the field block (handles color pickers and grid cells).
function resolveTargets(control) {
  const wrap = control.closest(".input-field") || control.closest(".color-field") || control.closest(".select-field") || control;
  const group = control.closest(".field-group");
  if (group) {
    let msg = group.querySelector(".field-group__error");
    if (!msg) {
      msg = document.createElement("p");
      msg.className = "field-group__error";
      group.appendChild(msg);
    }
    return { wrap, msg };
  }
  const block = control.closest(".color-field") || wrap;
  let msg = block.nextElementSibling && block.nextElementSibling.classList.contains("field-group__error")
    ? block.nextElementSibling
    : null;
  if (!msg) {
    msg = document.createElement("p");
    msg.className = "field-group__error";
    block.insertAdjacentElement("afterend", msg);
  }
  return { wrap, msg };
}

// Wires live validation to a control. Returns { isValid, showError } so the
// caller can also gate a Continue/Save button and force-reveal errors.
export function attachValidation(control, options = {}) {
  const { validate, format, required = false, message = "Please check this field", onChange } = options;
  const { wrap, msg } = resolveTargets(control);

  // `required` may be a plain boolean, or a function re-evaluated on every
  // check for a requirement that depends on another field (e.g. a DBA field
  // that's only required once a DBA Name has been entered).
  function isRequired() {
    return typeof required === "function" ? required() : required;
  }

  function isValid() {
    const v = control.value;
    if (!v.trim()) return !isRequired();  // empty only fails when required
    return validate ? validate(v) : true;
  }

  function paint(reveal) {
    const bad = reveal && !isValid();
    wrap.classList.toggle("input-field--error", bad);
    msg.textContent = bad ? message : "";
    msg.classList.toggle("is-visible", bad);
  }

  control.addEventListener("input", () => {
    if (format) control.value = format(control.value);
    // Clear an existing error the moment the value becomes valid again
    if (isValid()) {
      wrap.classList.remove("input-field--error");
      msg.classList.remove("is-visible");
    }
    if (onChange) onChange();
  });

  control.addEventListener("blur", () => paint(true));

  // A custom-select-enhanced dropdown (see customSelect.js) hides the real
  // <select> and swaps in a visible trigger button as the actual interactive
  // surface - the hidden control never receives real focus/blur from a mouse
  // user, so the reveal-on-blur above would never fire. Mirror it onto the
  // trigger too, and re-check on "change" (all customSelect.js dispatches,
  // never "input") so picking a value clears the error without waiting for
  // a later blur.
  const trigger = control.closest(".select-field")?.querySelector(".custom-select__trigger");
  if (trigger) {
    trigger.addEventListener("blur", () => paint(true));
    control.addEventListener("change", () => {
      if (isValid()) {
        wrap.classList.remove("input-field--error");
        msg.classList.remove("is-visible");
      }
      if (onChange) onChange();
    });
  }

  return { isValid, showError: () => paint(true) };
}
