// ==========================================================================
// Entry Point
// Bootstraps every component once the DOM is ready. Kept intentionally
// thin all real logic lives in the component modules.
// ==========================================================================

import { qs } from "./utils/dom.js";
import { initChannelTabs } from "./components/tabs.js";
import { initOtpInput } from "./components/otpInput.js";
import { initAuthFlow } from "./components/authFlow.js";
import { initPageTransitions } from "./utils/pageTransition.js";
import { isContactVerified, markContactVerified, setPrimaryChannel } from "./utils/verifiedContacts.js";

document.addEventListener("DOMContentLoaded", () => {
  initPageTransitions();
  const tabsController = initChannelTabs();

  // Auto-submit the verify form the instant all 6 digits are filled
  // the user never needs to click "Verify & Sign In" manually.
  const otpController = initOtpInput("#step-verify", {
    onComplete: () => qs("#step-verify").requestSubmit(),
  });

  initAuthFlow({
    tabsController,
    otpController,
    // Skip the code step if this contact was already verified this session
    isContactVerified,
    // Treat successful sign-in as the handoff into the onboarding wizard.
    onVerified: (code, contact) => {
      const channel = contact?.channel || tabsController.getActiveChannel();
      const value = contact?.value ||
        (channel === "email" ? qs("#input-email").value.trim() : qs("#input-phone").value.trim());
      // Remember this contact so it's never re-verified downstream, and record
      // the channel as the user's primary method so the dashboard sign-in
      // later opens on it by default.
      markContactVerified(channel, value);
      setPrimaryChannel(channel);
      const params = new URLSearchParams();
      params.set("channel", channel);
      params.set("contact", value);
      window.location.href = `onboarding.html?${params.toString()}`;
    },
  });

});
