// ==========================================================================
// Component: Auth Flow
// Orchestrates the two-step sign-in sequence: entry (email/phone) then
// verification. Owns the resend cooldown timer and destination copy.
// Shared by every login screen (Operator Console, Merchant Portal) pages
// opt into the extra entry-heading/footnote toggling simply by including
// those elements; this component works fine without them too.
// ==========================================================================

import { qs, setHidden } from "../utils/dom.js";
import { CONFIG } from "../config.js";

// Minimal, permissive format checks just enough to catch obvious typos
// before wasting a round trip; the backend remains the source of truth.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;
const US_PHONE_PATTERN = /^\d{10}$/; // 10-digit US numbers

export function initAuthFlow({ tabsController, otpController, onVerified, isContactVerified, dynamicSubmitLabel = false }) {
  const stepEmail = qs("#step-email");
  const stepPhone = qs("#step-phone");
  const stepVerify = qs("#step-verify");

  const inputEmail = qs("#input-email");
  const inputPhone = qs("#input-phone");
  const verifyDestination = qs("#verify-destination");
  const changeDestinationLink = qs("#change-destination");

  const resendButton = qs("#resend-code");
  const resendNote = qs("#resend-note");
  const otpGroup = qs(".otp-input");

  // The contact currently being signed in with, so a successful (or skipped)
  // verification can report exactly which channel + value was confirmed.
  let pendingChannel = null;
  let pendingValue = "";

  // Optional per-page elements present on Merchant Portal, absent on the
  // Operator Console. Every reference below is null-guarded.
  const entryHeading = qs("#entry-heading");
  const entryFootnote = qs("#entry-footnote");

  let cooldownTimerId = null;

  function setEntryChromeHidden(hidden) {
    if (entryHeading) setHidden(entryHeading, hidden);
    if (entryFootnote) setHidden(entryFootnote, hidden);
  }

  // Show or clear an inline validation error beneath a given field.
  // Toggles the shared .input-field--error / .field-group__error classes
  // rather than writing new DOM, so styling stays centralized in CSS.
  function setFieldError(inputEl, message) {
    const wrapper = inputEl.closest(".input-field");
    const errorEl = inputEl.closest(".field-group")?.querySelector(".field-group__error");
    if (wrapper) wrapper.classList.toggle("input-field--error", Boolean(message));
    if (errorEl) {
      errorEl.textContent = message || "";
      errorEl.classList.toggle("is-visible", Boolean(message));
    }
  }

  // Briefly shows a spinner on a submit button so the click always gets
  // visible feedback, even though this demo has no real network call yet.
  function runWithLoadingState(button, work, delayMs = 500) {
    button.disabled = true;
    button.classList.add("is-loading");
    setTimeout(() => {
      button.classList.remove("is-loading");
      button.disabled = false;
      work();
    }, delayMs);
  }

  // Move from either entry panel into the verification panel
  function showVerifyStep(destinationValue) {
    setHidden(stepEmail, true);
    setHidden(stepPhone, true);
    setHidden(stepVerify, false);
    setEntryChromeHidden(true);

    verifyDestination.textContent = destinationValue;
    changeDestinationLink.textContent =
      tabsController.getActiveChannel() === "email" ? "Change email" : "Change phone number";

    otpController.reset();
    startResendCooldown();
  }

  // Return to the entry panel matching the currently selected channel,
  // preserving whatever the user had already typed
  function showEntryStep() {
    setHidden(stepVerify, true);
    setEntryChromeHidden(false);
    tabsController.activateChannel(tabsController.getActiveChannel());
  }

  // Disable "Resend Code" for a fixed cooldown window, with a live countdown
  function startResendCooldown() {
    let secondsRemaining = CONFIG.resendCooldownSeconds;
    resendButton.disabled = true;
    updateResendNote(secondsRemaining);

    clearInterval(cooldownTimerId);
    cooldownTimerId = setInterval(() => {
      secondsRemaining -= 1;
      updateResendNote(secondsRemaining);

      if (secondsRemaining <= 0) {
        clearInterval(cooldownTimerId);
        resendButton.disabled = false;
        resendNote.textContent = "";
      }
    }, 1000);
  }

  function updateResendNote(secondsRemaining) {
    resendNote.classList.remove("is-error");
    resendNote.textContent = `You can request a new code in ${secondsRemaining}s`;
  }

  // Entry panel submissions validate format, then move into verification
  stepEmail.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = inputEmail.value.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setFieldError(inputEmail, "Enter a valid email address.");
      return;
    }
    setFieldError(inputEmail, null);
    pendingChannel = "email";
    pendingValue = value;
    const submitButton = stepEmail.querySelector(".btn--primary");
    // Skip the code step entirely if this contact was already verified
    if (isContactVerified && isContactVerified("email", value)) {
      runWithLoadingState(submitButton, () => completeVerification(null));
      return;
    }
    runWithLoadingState(submitButton, () => showVerifyStep(value || CONFIG.defaultEmail));
  });

  stepPhone.addEventListener("submit", (event) => {
    event.preventDefault();
    let value = inputPhone.value.trim();

    // Strip non-numeric characters for validation
    const numericOnly = value.replace(/[^\d]/g, "");

    // Check if it's a 10-digit US number
    if (US_PHONE_PATTERN.test(numericOnly)) {
      // Auto-prepend +1 for US numbers
      value = "+1" + numericOnly;
    } else if (!PHONE_PATTERN.test(value)) {
      setFieldError(inputPhone, "Enter a valid phone number.");
      return;
    }

    setFieldError(inputPhone, null);
    pendingChannel = "phone";
    pendingValue = value;
    const submitButton = stepPhone.querySelector(".btn--primary");
    // Skip the code step entirely if this contact was already verified
    if (isContactVerified && isContactVerified("phone", value)) {
      runWithLoadingState(submitButton, () => completeVerification(null));
      return;
    }
    runWithLoadingState(submitButton, () => showVerifyStep(value));
  });

  // Clear validation errors as soon as the user edits the field again
  inputEmail.addEventListener("input", () => setFieldError(inputEmail, null));
  inputPhone.addEventListener("input", () => setFieldError(inputPhone, null));

  // ---- Dynamic submit label (Merchant Portal) --------------------------
  // When a contact is already verified this session, the entry step skips the
  // code step entirely, so the button should say "Sign in" (not "Send OTP")
  // to set the right expectation. The label re-evaluates live as the user
  // edits the field or switches channel. Opt-in; the first landing page keeps
  // its static "Continue" copy. Each step's button carries a .btn__label span.
  function labelForChannel(channel, rawValue) {
    const verified = isContactVerified && isContactVerified(channel, rawValue);
    return verified ? "Sign in" : "Send OTP";
  }

  function refreshSubmitLabel() {
    if (!dynamicSubmitLabel) return;
    const emailLabel = stepEmail.querySelector(".btn__label");
    const phoneLabel = stepPhone.querySelector(".btn__label");
    if (emailLabel) emailLabel.textContent = labelForChannel("email", inputEmail.value.trim());
    if (phoneLabel) phoneLabel.textContent = labelForChannel("phone", inputPhone.value.trim());
  }

  if (dynamicSubmitLabel) {
    inputEmail.addEventListener("input", refreshSubmitLabel);
    inputPhone.addEventListener("input", refreshSubmitLabel);
    refreshSubmitLabel();
  }

  // "Change email/phone" backs out to the entry step to edit the value
  changeDestinationLink.addEventListener("click", showEntryStep);

  // Manual resend restarts the cooldown window
  resendButton.addEventListener("click", startResendCooldown);

  // Final verification submit. Each page passes its own onVerified callback
  // (the Operator Console hands off into the onboarding wizard; Merchant
  // Portal shows an inline confirmation panel, since it has no dashboard
  // built yet). Single completion path for both a passed OTP and a skipped
  // (already verified) contact. Reports which contact was confirmed to the page.
  function completeVerification(code) {
    clearInterval(cooldownTimerId);
    if (typeof onVerified === "function") {
      onVerified(code, { channel: pendingChannel, value: pendingValue });
    } else {
      console.log("Verifying code:", code);
    }
  }

  stepVerify.addEventListener("submit", (event) => {
    event.preventDefault();
    const code = otpController.getValue();

    if (code.length < CONFIG.otpLength) {
      resendNote.classList.add("is-error");
      resendNote.textContent = "Enter all 6 digits to continue.";
      if (otpGroup) {
        otpGroup.classList.remove("is-error");
        // Force reflow so the shake animation can replay on repeat errors
        void otpGroup.offsetWidth;
        otpGroup.classList.add("is-error");
      }
      return;
    }

    const verifyButton = stepVerify.querySelector(".btn--verify");
    runWithLoadingState(verifyButton, () => completeVerification(code), 700);
  });

  // Clear the OTP error shake once the user starts correcting the code
  if (otpGroup) {
    otpGroup.addEventListener("input", () => otpGroup.classList.remove("is-error"));
  }

  // Expose a refresh hook so the page can re-evaluate the submit label after
  // it switches channel tabs (which also swaps which entry panel is shown).
  return { refreshSubmitLabel };
}
