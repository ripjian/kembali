import { z } from "zod";

/** Domain logic lives here, not in route handlers (CLAUDE.md). */

const inputSchema = z.object({
  stampsCount: z.number().int().min(0),
  stampsRequired: z.number().int().min(1),
  /** Rewards this card has already earned (rows in `rewards`). When given,
   * progress is measured from the stamps those rewards consumed, so a
   * merchant changing "stamps required" never wipes a member's progress:
   * lowering it below a member's count owes them a reward at their next
   * stamp; raising it keeps every stamp they have. Omitted = the classic
   * fixed-size loop (floor(count / required)). */
  rewardsEarned: z.number().int().min(0).optional(),
});

export interface CardProgress {
  /** Full rewards earned so far (a card can loop: 9 required, 13 stamps → 1). */
  rewardsEarned: number;
  /** Stamps on the current, in-progress loop. */
  stampsTowardNext: number;
  /** Stamps still needed to earn the next reward. */
  stampsRemaining: number;
  /** 0..1 fill for the progress bar (leaf color, per BRAND.md). */
  progress: number;
  /** True when the card already holds enough stamps for the next reward
   * (the requirement was lowered); the very next stamp grants it. */
  rewardOwed: boolean;
}

export function computeCardProgress(input: {
  stampsCount: number;
  stampsRequired: number;
  rewardsEarned?: number;
}): CardProgress {
  const { stampsCount, stampsRequired, rewardsEarned: given } = inputSchema.parse(input);
  const rewardsEarned = given ?? Math.floor(stampsCount / stampsRequired);
  const raw = Math.max(0, stampsCount - rewardsEarned * stampsRequired);
  const rewardOwed = raw >= stampsRequired;
  const stampsTowardNext = rewardOwed ? stampsRequired - 1 : raw;
  return {
    rewardsEarned,
    stampsTowardNext,
    stampsRemaining: stampsRequired - stampsTowardNext,
    progress: stampsTowardNext / stampsRequired,
    rewardOwed,
  };
}
