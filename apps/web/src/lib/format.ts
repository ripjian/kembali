/** RM 12.50 — MYR display for sen amounts. */
export function formatRM(amountCents: number): string {
  return `RM ${(amountCents / 100).toFixed(2)}`;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(d: Date): string {
  return d.toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
