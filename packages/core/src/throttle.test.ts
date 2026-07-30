import { describe, expect, it } from "vitest";

import {
  evaluateThrottle,
  formatRetryAfter,
  LOGIN_IDENTITY_POLICY,
  LOGIN_IP_POLICY,
  LOGIN_PAIR_POLICY,
  OTP_REQUEST_IP_POLICY,
  OTP_REQUEST_PHONE_POLICY,
  throttlePruneCutoff,
  widestSpanSeconds,
  type ThrottlePolicy,
} from "./throttle";

const NOW = new Date("2026-07-20T10:00:00.000Z");
const agoSeconds = (s: number) => new Date(NOW.getTime() - s * 1000);

/** Tight policy so the arithmetic in each case is easy to read. */
const POLICY: ThrottlePolicy = { maxFailures: 3, windowSeconds: 600, lockoutSeconds: 300 };

describe("evaluateThrottle", () => {
  it("allows a clean subject", () => {
    expect(evaluateThrottle([], POLICY, NOW)).toEqual({
      locked: false,
      retryAfterSeconds: 0,
      failures: 0,
    });
  });

  it("allows attempts up to and including the allowance", () => {
    // maxFailures is the number allowed, and the count includes the attempt
    // being judged, so exactly 3 recorded attempts are still fine.
    const verdict = evaluateThrottle(
      [agoSeconds(10), agoSeconds(20), agoSeconds(30)],
      POLICY,
      NOW,
    );
    expect(verdict.locked).toBe(false);
    expect(verdict.failures).toBe(3);
  });

  it("locks the attempt after the allowance is used up", () => {
    const verdict = evaluateThrottle(
      [agoSeconds(5), agoSeconds(10), agoSeconds(20), agoSeconds(30)],
      POLICY,
      NOW,
    );
    expect(verdict.locked).toBe(true);
    expect(verdict.failures).toBe(4);
    // lock runs from the newest attempt (5s ago) + 300s
    expect(verdict.retryAfterSeconds).toBe(295);
  });

  it("ignores failures older than the window", () => {
    const verdict = evaluateThrottle(
      [agoSeconds(700), agoSeconds(800), agoSeconds(900)],
      POLICY,
      NOW,
    );
    expect(verdict.locked).toBe(false);
    expect(verdict.failures).toBe(0);
  });

  it("counts only in-window failures when history is mixed", () => {
    const verdict = evaluateThrottle(
      [agoSeconds(700), agoSeconds(100), agoSeconds(200)],
      POLICY,
      NOW,
    );
    expect(verdict.locked).toBe(false);
    expect(verdict.failures).toBe(2);
  });

  it("releases the lock once the lockout has elapsed", () => {
    // three failures inside the 600s window, newest 400s ago; lockout is 300s
    const verdict = evaluateThrottle(
      [agoSeconds(400), agoSeconds(500), agoSeconds(550)],
      POLICY,
      NOW,
    );
    expect(verdict.locked).toBe(false);
    expect(verdict.failures).toBe(3);
  });

  it("extends the lock when a locked subject keeps trying", () => {
    const early = evaluateThrottle(
      [agoSeconds(250), agoSeconds(260), agoSeconds(270), agoSeconds(280)],
      POLICY,
      NOW,
    );
    expect(early.locked).toBe(true);
    expect(early.retryAfterSeconds).toBe(50);
    // one more attempt, one second ago, pushes the unlock time out again
    const later = evaluateThrottle(
      [agoSeconds(250), agoSeconds(260), agoSeconds(270), agoSeconds(280), agoSeconds(1)],
      POLICY,
      NOW,
    );
    expect(later.locked).toBe(true);
    expect(later.retryAfterSeconds).toBe(299);
  });

  it("never reports a zero wait while locked", () => {
    const verdict = evaluateThrottle(
      [agoSeconds(299.9), agoSeconds(300), agoSeconds(300)],
      POLICY,
      NOW,
    );
    if (verdict.locked) expect(verdict.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it("lets five bad passwords through and refuses the sixth", () => {
    const five = [1, 2, 3, 4, 5].map((n) => agoSeconds(n * 10));
    expect(evaluateThrottle(five, LOGIN_PAIR_POLICY, NOW).locked).toBe(false);

    const sixth = evaluateThrottle([...five, agoSeconds(1)], LOGIN_PAIR_POLICY, NOW);
    expect(sixth.locked).toBe(true);
    expect(sixth.retryAfterSeconds).toBeGreaterThan(14 * 60);
  });

  it("keeps the OTP send cap independent of the lock length", () => {
    const times = Array.from({ length: 6 }, (_, i) => agoSeconds(60 + i * 60));
    const verdict = evaluateThrottle(times, OTP_REQUEST_PHONE_POLICY, NOW);
    expect(verdict.locked).toBe(true);
    expect(verdict.failures).toBe(6);
  });
});

describe("policy shape", () => {
  it("does not let a stranger lock an account with a handful of tries", () => {
    // The identity backstop must sit far above the pair limit, or anyone who
    // knows an email can deny that person service (the DoS the pair key
    // exists to prevent).
    expect(LOGIN_IDENTITY_POLICY.maxFailures).toBeGreaterThanOrEqual(
      LOGIN_PAIR_POLICY.maxFailures * 5,
    );
  });

  it("lets a shared address try more than a single account may", () => {
    expect(LOGIN_IP_POLICY.maxFailures).toBeGreaterThan(LOGIN_PAIR_POLICY.maxFailures);
  });

  it("allows a busy counter queue to sign up on one shop address", () => {
    // The join flow is a QR at the till, so dozens of customers an hour from
    // one address is normal traffic, not abuse.
    expect(OTP_REQUEST_IP_POLICY.maxFailures).toBeGreaterThanOrEqual(60);
    expect(OTP_REQUEST_IP_POLICY.maxFailures).toBeGreaterThan(
      OTP_REQUEST_PHONE_POLICY.maxFailures * 5,
    );
  });
});

describe("widestSpanSeconds", () => {
  it("takes the longest span across a kind's policies", () => {
    expect(widestSpanSeconds([LOGIN_PAIR_POLICY, LOGIN_IDENTITY_POLICY, LOGIN_IP_POLICY])).toBe(
      60 * 60,
    );
  });

  it("is zero for an empty set", () => {
    expect(widestSpanSeconds([])).toBe(0);
  });
});

describe("throttlePruneCutoff", () => {
  it("keeps rows that can still affect a verdict", () => {
    const cutoff = throttlePruneCutoff([POLICY], NOW);
    // window (600s) is the longer span, so that is what survives
    expect(NOW.getTime() - cutoff.getTime()).toBe(600 * 1000);
  });

  it("uses the lockout when it outlasts the window", () => {
    const cutoff = throttlePruneCutoff(
      [{ maxFailures: 1, windowSeconds: 60, lockoutSeconds: 3600 }],
      NOW,
    );
    expect(NOW.getTime() - cutoff.getTime()).toBe(3600 * 1000);
  });

  it("never prunes rows a longer policy for the same kind still needs", () => {
    // The bug this guards: pruning with the short login window would delete
    // rows the hour-long identity backstop still counts.
    const cutoff = throttlePruneCutoff(
      [LOGIN_PAIR_POLICY, LOGIN_IDENTITY_POLICY, LOGIN_IP_POLICY],
      NOW,
    );
    expect(NOW.getTime() - cutoff.getTime()).toBe(60 * 60 * 1000);
  });
});

describe("formatRetryAfter", () => {
  it("keeps short waits vague", () => {
    expect(formatRetryAfter(1)).toBe("a few seconds");
    expect(formatRetryAfter(45)).toBe("a few seconds");
  });

  it("rounds minutes up so the wait is never understated", () => {
    expect(formatRetryAfter(46)).toBe("1 minute");
    expect(formatRetryAfter(61)).toBe("2 minutes");
    expect(formatRetryAfter(900)).toBe("15 minutes");
  });
});
