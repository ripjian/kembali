import { describe, expect, it } from "vitest";

import { computeCardProgress } from "./card-progress";

describe("computeCardProgress", () => {
  it("tracks a fresh card", () => {
    expect(computeCardProgress({ stampsCount: 0, stampsRequired: 9 })).toEqual({
      rewardsEarned: 0,
      stampsTowardNext: 0,
      stampsRemaining: 9,
      progress: 0,
      rewardOwed: false,
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

describe("computeCardProgress after the merchant edits the requirement", () => {
  it("keeps every stamp when the requirement goes up", () => {
    const p = computeCardProgress({ stampsCount: 7, stampsRequired: 12, rewardsEarned: 0 });
    expect(p.stampsTowardNext).toBe(7);
    expect(p.stampsRemaining).toBe(5);
    expect(p.rewardOwed).toBe(false);
  });
  it("owes a reward at the next stamp when the requirement drops below the count", () => {
    const p = computeCardProgress({ stampsCount: 7, stampsRequired: 5, rewardsEarned: 0 });
    expect(p.rewardOwed).toBe(true);
    expect(p.stampsTowardNext).toBe(4);
    expect(p.stampsRemaining).toBe(1);
  });
  it("measures from the stamps already spent on rewards", () => {
    const p = computeCardProgress({ stampsCount: 13, stampsRequired: 9, rewardsEarned: 1 });
    expect(p.stampsTowardNext).toBe(4);
    expect(p.rewardsEarned).toBe(1);
    const changed = computeCardProgress({ stampsCount: 13, stampsRequired: 6, rewardsEarned: 1 });
    expect(changed.rewardOwed).toBe(true);
  });
});
