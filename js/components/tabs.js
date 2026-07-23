// ==========================================================================
// Component: Channel Tabs
// Handles switching between the Email and Phone entry panels.
// ==========================================================================

import { qs, qsa, setHidden } from "../utils/dom.js";

const STEP_PANELS_BY_CHANNEL = {
  email: "step-email",
  phone: "step-phone",
};

// Wires up tab click handlers and returns the currently active channel getter
export function initChannelTabs({ onChannelChange } = {}) {
  const tabs = qsa(".channel-tab");
  let activeChannel = "phone";

  function activateChannel(channel) {
    activeChannel = channel;

    // Toggle the visual active state on the tab buttons themselves
    tabs.forEach((tab) => {
      const isActive = tab.dataset.channel === channel;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });

    // Show only the entry panel that matches the selected channel
    Object.entries(STEP_PANELS_BY_CHANNEL).forEach(([panelChannel, panelId]) => {
      setHidden(qs(`#${panelId}`), panelChannel !== channel);
    });

    if (typeof onChannelChange === "function") {
      onChannelChange(channel);
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateChannel(tab.dataset.channel));
  });

  return {
    getActiveChannel: () => activeChannel,
    activateChannel,
  };
}
