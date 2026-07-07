import { describe, expect, it } from "vitest";

import { computeCardProgress } from "./card-progress";

describe("computeCardProgress", () => {
  it("tracks a fresh card", () => {
    expect(computeCardProgress({ stampsCount: 0, stampsRequired: 9 })).toEqual({
      rewardsEarned: 0,
      stampsTowardNext: 0,
      stampsRemaining: 9,
      progress: 0,
    });
  });

  it("tracks mid-card progress", () => {
    const p = computeCardProgress({ stampsCount: 4, stampsRequired: 9 });
    expect(p.rewardsEarned).toBe(0);
    expect(p.stampsTowardNext).toBe(4);
    expect(p.stampsRemaining).toBe(5);
  });

  it("earns a reward exactly at the threshold", () => {
    const p = computeCardProgress({ stampsCount: 9, stampsRequired: 9 });
    expect(p.rewardsEarned).toBe(1);
    expect(p.stampsTowardNext).toBe(0);
  });

  it("supports looping cards past one reward", () => {
    const p = computeCardProgress({ stampsCount: 13, stampsRequired: 9 });
    expect(p.rewardsEarned).toBe(1);
    expect(p.stampsTowardNext).toBe(4);
  });

  it("rejects invalid input at the boundary", () => {
    expect(() =>
      computeCardProgress({ stampsCount: -1, stampsRequired: 9 }),
    ).toThrow();
    expect(() =>
      computeCardProgress({ stampsCount: 3, stampsRequired: 0 }),
    ).toThrow();
  });
});
