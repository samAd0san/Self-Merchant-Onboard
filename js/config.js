// ==========================================================================
// Config
// Centralised constants so behaviour tweaks don't require hunting through
// component files.
// ==========================================================================

export const CONFIG = {
  // Length of the one-time verification code
  otpLength: 6,

  // Seconds the user must wait before "Resend Code" becomes active again
  resendCooldownSeconds: 30,

  // Demo fallback shown as the verify-step destination when no email was entered
  defaultEmail: "samad@parcera.ai",
};
