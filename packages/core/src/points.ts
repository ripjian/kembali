/* Points math (ROADMAP §7 Phase 2). All amounts are integer sen; rates are
 * points per RM1. Results are integers — we always round down so a merchant
 * never gives away a point they didn't configure. */

export function pointsForAmount(amountCents: number, pointsPerRm: number): number {
  if (!Number.isFinite(amountCents) || !Number.isFinite(pointsPerRm)) return 0;
  if (amountCents <= 0 || pointsPerRm <= 0) return 0;
  return Math.floor((amountCents * pointsPerRm) / 100);
}

/** Balance is always Σ deltas — the DB enforces the same via the
 * points_balance projection trigger; this is the in-process twin. */
export function sumPointDeltas(deltas: readonly number[]): number {
  return deltas.reduce((total, d) => total + d, 0);
}
