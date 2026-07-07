import { z } from "zod";

/** Domain logic lives here, not in route handlers (CLAUDE.md). */

const inputSchema = z.object({
  stampsCount: z.number().int().min(0),
  stampsRequired: z.number().int().min(1),
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
}

export function computeCardProgress(input: {
  stampsCount: number;
  stampsRequired: number;
}): CardProgress {
  const { stampsCount, stampsRequired } = inputSchema.parse(input);
  const rewardsEarned = Math.floor(stampsCount / stampsRequired);
  const stampsTowardNext = stampsCount % stampsRequired;
  return {
    rewardsEarned,
    stampsTowardNext,
    stampsRemaining: stampsRequired - stampsTowardNext,
    progress: stampsTowardNext / stampsRequired,
  };
}
