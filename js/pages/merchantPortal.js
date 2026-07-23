// ==========================================================================
// Page Entry: Merchant Portal
// Wires up the same shared components as the Operator Console (tabs, OTP
// input, auth flow), so the sign-in behavior stays consistent across both
// login screens. Has no destination dashboard yet, so a verified sign-in
// just shows an inline confirmation panel.
// ==========================================================================

import { qs, setHidden } from "../utils/dom.js";
import { initChannelTabs } from "../components/tabs.js";
import { initOtpInput } from "../components/otpInput.js";
import { initAuthFlow } from "../components/authFlow.js";
import { initPageTransitions } from "../utils/pageTransition.js";
import { loadOnboardingState } from "../utils/onboardingState.js";
import { isContactVerified, markContactVerified, getPrimaryChannel } from "../utils/verifiedContacts.js";

document.addEventListener("DOMContentLoaded", () => {
  initPageTransitions();

  // Keep the sub-heading copy in step with the selected channel. Phone is
  // the default sign-in method for the dashboard, so the page opens on it.
  // Set later by initAuthFlow; referenced from the channel-change handler,
  // which fires both on user clicks and on the initial activateChannel below.
  let authApi = null;

  const subheading = qs(".auth-card__subheading");
  function onChannelChange(channel) {
    if (subheading) {
      subheading.textContent =
        channel === "email"
          ? "Enter your email address to receive a verification code"
          : "Enter your phone number to receive a verification code";
    }
    // Re-evaluate "Sign in" vs "Send OTP" for the newly shown channel
    if (authApi) authApi.refreshSubmitLabel();
  }

  const tabsController = initChannelTabs({ onChannelChange });

  // Prefill BOTH the email and phone that were entered during onboarding, so
  // whichever channel the user picks is already filled in. The query string
  // still decides which channel tab opens first.
  const emailField = qs("#input-email");
  const phoneField = qs("#input-phone");
  const saved = loadOnboardingState();
  const business = (saved && saved.business) || {};
  if (business.ownerEmail && emailField && !emailField.value) emailField.value = business.ownerEmail;
  if (business.ownerPhone && phoneField && !phoneField.value) phoneField.value = business.ownerPhone;

  const params = new URLSearchParams(window.location.search);
  const channel = params.get("channel");
  const contact = (params.get("contact") || "").trim();
  if (channel === "email" || channel === "phone") {
    tabsController.activateChannel(channel);
    if (contact) {
      const field = qs(channel === "email" ? "#input-email" : "#input-phone");
      if (field) field.value = contact;
    }
  } else {
    // No hand-off params (e.g. a plain reload): open on whichever channel the
    // user signed in with originally, defaulting to phone.
    tabsController.activateChannel(getPrimaryChannel() || "phone");
  }

  const verifyForm = qs("#step-verify");
  const verifySuccess = qs("#verify-success");

  // Auto-submit the verify form the instant all 6 digits are filled,
  // the user never needs to click "Verify & Sign In" manually.
  const otpController = initOtpInput("#step-verify", {
    onComplete: () => verifyForm.requestSubmit(),
  });

  authApi = initAuthFlow({
    tabsController,
    otpController,
    // A contact already verified during onboarding signs in without a code
    isContactVerified,
    // Swap the button label to "Sign in" for an already-verified contact
    dynamicSubmitLabel: true,
    onVerified: (code, contactInfo) => {
      // Remember (or re-confirm) this contact as verified
      if (contactInfo) markContactVerified(contactInfo.channel, contactInfo.value);
      setHidden(verifyForm, true);
      setHidden(verifySuccess, false);
    },
  });
});
