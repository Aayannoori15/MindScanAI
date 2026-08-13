/*
 * Timestamps render in IST regardless of the viewer's machine clock.
 *
 * The API sends UTC with an explicit offset (…+00:00), so Date parses it
 * unambiguously; these helpers then pin the *display* zone to Asia/Kolkata so
 * a session reads the same for everyone rather than shifting per device.
 */
export const IST = "Asia/Kolkata";

export function formatISTTime(value) {
  return new Date(value).toLocaleTimeString("en-IN", {
    timeZone: IST,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatISTDate(value) {
  return new Date(value).toLocaleDateString("en-IN", {
    timeZone: IST,
    month: "short",
    day: "numeric",
  });
}

export function formatISTDateTime(value) {
  return new Date(value).toLocaleString("en-IN", {
    timeZone: IST,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Calendar day in IST — used to decide whether an axis needs date or time. */
export function istDayKey(value) {
  return new Date(value).toLocaleDateString("en-CA", { timeZone: IST });
}
