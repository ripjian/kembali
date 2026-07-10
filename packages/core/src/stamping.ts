/* Stamping rules v1 (SECURITY.md rule 5: velocity rules). Pure functions -
 * the caller fetches the card's recent events and passes timestamps in. */

export const MIN_SECONDS_BETWEEN_STAMPS = 60;
export const MAX_STAMPS_PER_CARD_PER_DAY = 10;

export type StampCheck =
  | { allowed: true }
  | { allowed: false; reason: "too_soon" | "daily_limit" };

export function checkStampVelocity(
  recentEventTimes: Date[],
  now: Date = new Date(),
): StampCheck {
  const last = recentEventTimes.reduce<Date | null>(
    (max, t) => (max === null || t > max ? t : max),
    null,
  );
  if (last && (now.getTime() - last.getTime()) / 1000 < MIN_SECONDS_BETWEEN_STAMPS) {
    return { allowed: false, reason: "too_soon" };
  }
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const today = recentEventTimes.filter((t) => t >= dayStart).length;
  if (today >= MAX_STAMPS_PER_CARD_PER_DAY) {
    return { allowed: false, reason: "daily_limit" };
  }
  return { allowed: true };
}

/** A reward is earned each time the count crosses a multiple of the
 * program requirement (cards loop - see computeCardProgress). */
export function earnsReward(newStampsCount: number, stampsRequired: number): boolean {
  return newStampsCount > 0 && newStampsCount % stampsRequired === 0;
}
