// ==========================================================================
// Verified Contacts registry
// Remembers which email / phone have already passed verification, shared
// across the sign-in page and the dashboard sign-in for the session. Once a
// contact is verified at sign-in, the dashboard skips its own code step for
// that same contact; a different, unverified contact still gets one.
// Session-scoped so it clears with the browser session (and on "Start over").
// ==========================================================================

const STORAGE_KEY = "parcera.verified.v1";

// Normalizes a value so comparisons are format-insensitive: emails by case,
// phones by digits only.
function normalize(channel, value) {
  const v = (value || "").trim();
  if (channel === "email") return v.toLowerCase();
  if (channel === "phone") {
    let d = v.replace(/\D/g, "");
    if (d.length === 11 && d[0] === "1") d = d.slice(1); // drop US country code
    return d;
  }
  return v;
}

function read() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch (err) {
    return {};
  }
}

function write(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    /* storage unavailable — verification simply won't be remembered */
  }
}

// True when the given contact has already been verified this session.
export function isContactVerified(channel, value) {
  const norm = normalize(channel, value);
  if (!norm) return false;
  return read()[channel] === norm;
}

// Records a contact as verified (idempotent).
export function markContactVerified(channel, value) {
  const norm = normalize(channel, value);
  if (!norm) return;
  const state = read();
  state[channel] = norm;
  write(state);
}

// Remembers which channel the user signed in with at the very first landing
// page. The dashboard sign-in opens on this channel by default so a returning
// user lands on the method they already know works (falls back to phone).
const PRIMARY_KEY = "primaryChannel";

export function setPrimaryChannel(channel) {
  if (channel !== "email" && channel !== "phone") return;
  const state = read();
  state[PRIMARY_KEY] = channel;
  write(state);
}

export function getPrimaryChannel() {
  const c = read()[PRIMARY_KEY];
  return c === "email" || c === "phone" ? c : null;
}

// Clears the whole registry (used by the full "Start over" reset).
export function clearVerifiedContacts() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    /* nothing to clean up */
  }
}
