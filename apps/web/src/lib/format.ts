/** RM 12.50 - MYR display for sen amounts. */
export function formatRM(amountCents: number): string {
  return `RM ${(amountCents / 100).toFixed(2)}`;
}

/* Displayed in Malaysian time regardless of where the server runs (a UTC
 * host would otherwise show every stamp eight hours early). */
const TZ = "Asia/Kuala_Lumpur";

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-MY", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(d: Date): string {
  return d.toLocaleString("en-MY", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
