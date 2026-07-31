import { describe, expect, it } from "vitest";

import {
  ADMIN_SESSION_POLICY,
  CUSTOMER_SESSION_POLICY,
  cookieMaxAge,
  evaluateSession,
  previousTokenCutoff,
  type SessionPolicy,
  type SessionState,
} from "./session";

const NOW = new Date("2026-07-31T10:00:00.000Z");

const POLICY: SessionPolicy = {
  absoluteSeconds: 3600,
  idleSeconds: 600,
  rotateAfterSeconds: 300,
  graceSeconds: 60,
  reuseWindowSeconds: 1800,
  touchAfterSeconds: 30,
};

function ago(seconds: number): Date {
  return new Date(NOW.getTime() - seconds * 1000);
}

function state(overrides: Partial<SessionState> = {}): SessionState {
  return {
    createdAt: ago(10),
    lastUsedAt: ago(10),
    rotatedAt: ago(10),
    presentedPrevious: false,
    previousValidUntil: null,
    tokenConfirmed: true,
    ...overrides,
  };
}

describe("evaluateSession", () => {
  it("keeps a fresh session live with nothing to do", () => {
    const verdict = evaluateSession(state(), POLICY, NOW);
    expect(verdict).toMatchObject({ status: "live", rotate: false, touch: false });
  });

  it("expires on the absolute clock even when the session is being used", () => {
    const verdict = evaluateSession(
      state({ createdAt: ago(3601), lastUsedAt: NOW, rotatedAt: NOW }),
      POLICY,
      NOW,
    );
    expect(verdict).toEqual({ status: "expired", reason: "absolute" });
  });

  it("expires on the idle clock well inside the absolute window", () => {
    const verdict = evaluateSession(
      state({ createdAt: ago(900), lastUsedAt: ago(601), rotatedAt: ago(900) }),
      POLICY,
      NOW,
    );
    expect(verdict).toEqual({ status: "expired", reason: "idle" });
  });

  it("reports absolute first when both clocks have run out", () => {
    const verdict = evaluateSession(
      state({ createdAt: ago(9999), lastUsedAt: ago(9999), rotatedAt: ago(9999) }),
      POLICY,
      NOW,
    );
    expect(verdict).toEqual({ status: "expired", reason: "absolute" });
  });

  it("stays live at the exact moment before each deadline", () => {
    expect(
      evaluateSession(
        state({ createdAt: ago(3599), lastUsedAt: NOW, rotatedAt: NOW }),
        POLICY,
        NOW,
      ).status,
    ).toBe("live");
    expect(
      evaluateSession(
        state({ createdAt: ago(600), lastUsedAt: ago(599), rotatedAt: ago(600) }),
        POLICY,
        NOW,
      ).status,
    ).toBe("live");
  });

  it("asks for rotation once the token is old enough", () => {
    const verdict = evaluateSession(state({ rotatedAt: ago(300) }), POLICY, NOW);
    expect(verdict).toMatchObject({ status: "live", rotate: true });
  });

  it("does not ask for rotation a second early", () => {
    const verdict = evaluateSession(state({ rotatedAt: ago(299) }), POLICY, NOW);
    expect(verdict).toMatchObject({ status: "live", rotate: false });
  });

  it("asks for an idle-clock write only once the clock is stale", () => {
    expect(evaluateSession(state({ lastUsedAt: ago(29) }), POLICY, NOW)).toMatchObject({
      touch: false,
    });
    expect(evaluateSession(state({ lastUsedAt: ago(30) }), POLICY, NOW)).toMatchObject({
      touch: true,
    });
  });

  it("reports the nearer of the two deadlines as remaining time", () => {
    const verdict = evaluateSession(
      state({ createdAt: ago(3000), lastUsedAt: ago(100) }),
      POLICY,
      NOW,
    );
    // 600s of absolute left, 500s of idle left.
    expect(verdict).toMatchObject({ status: "live", remainingSeconds: 500 });
  });

  describe("the previous token", () => {
    it("is accepted inside its grace period", () => {
      const verdict = evaluateSession(
        state({
          presentedPrevious: true,
          previousValidUntil: new Date(NOW.getTime() + 30_000),
          rotatedAt: ago(30),
        }),
        POLICY,
        NOW,
      );
      expect(verdict.status).toBe("live");
    });

    it("does not trigger another rotation while it is in grace", () => {
      // The swap just happened, so the freshly issued token is not due yet.
      const verdict = evaluateSession(
        state({
          presentedPrevious: true,
          previousValidUntil: new Date(NOW.getTime() + 30_000),
          rotatedAt: ago(30),
        }),
        POLICY,
        NOW,
      );
      expect(verdict).toMatchObject({ rotate: false });
    });

    it("is read as theft once the grace period has passed", () => {
      const verdict = evaluateSession(
        state({
          presentedPrevious: true,
          previousValidUntil: ago(1),
          rotatedAt: ago(61),
        }),
        POLICY,
        NOW,
      );
      expect(verdict).toEqual({ status: "stolen" });
    });

    it("is read as theft rather than allowed when no grace end was recorded", () => {
      const verdict = evaluateSession(
        state({ presentedPrevious: true, previousValidUntil: null }),
        POLICY,
        NOW,
      );
      expect(verdict).toEqual({ status: "stolen" });
    });

    it("is read as theft even on a session that is otherwise healthy", () => {
      // Theft outranks every other clock: a live session is exactly the one
      // worth revoking, because that is the session being ridden.
      const verdict = evaluateSession(
        state({
          createdAt: NOW,
          lastUsedAt: NOW,
          rotatedAt: NOW,
          presentedPrevious: true,
          previousValidUntil: ago(1),
        }),
        POLICY,
        NOW,
      );
      expect(verdict).toEqual({ status: "stolen" });
    });

    describe("when the replacement was never seen in use", () => {
      // The rotation reply did not reach the browser: a dropped connection, a
      // closed tab. The browser is still on the only token it ever got, and
      // signing it out would punish a flaky network rather than a thief.
      const stranded = {
        presentedPrevious: true,
        previousValidUntil: ago(1),
        rotatedAt: ago(61),
        tokenConfirmed: false,
      };

      it("is not treated as theft", () => {
        expect(evaluateSession(state(stranded), POLICY, NOW).status).toBe("live");
      });

      it("rotates again so the browser gets a token it can keep", () => {
        // Otherwise the same request repeats forever on a token that can
        // never be upgraded.
        expect(evaluateSession(state(stranded), POLICY, NOW)).toMatchObject({ rotate: true });
      });

      it("still dies on the absolute clock", () => {
        expect(
          evaluateSession(state({ ...stranded, createdAt: ago(3601) }), POLICY, NOW),
        ).toEqual({ status: "expired", reason: "absolute" });
      });

      it("becomes theft the moment the replacement is used", () => {
        expect(
          evaluateSession(state({ ...stranded, tokenConfirmed: true }), POLICY, NOW),
        ).toEqual({ status: "stolen" });
      });
    });
  });
});

describe("cookieMaxAge", () => {
  it("covers what is left of the absolute window", () => {
    expect(cookieMaxAge({ createdAt: ago(3300) }, POLICY, NOW)).toBe(300);
  });

  it("is not cut down to the idle window", () => {
    // The idle clock is refreshed by page renders, which cannot rewrite the
    // cookie. A cookie cut to the idle window would expire in the browser
    // while the session was still alive on the server, signing someone out
    // in the middle of what they were doing.
    expect(cookieMaxAge({ createdAt: ago(10) }, POLICY, NOW)).toBe(3590);
    expect(cookieMaxAge({ createdAt: ago(10) }, POLICY, NOW)).toBeGreaterThan(
      POLICY.idleSeconds,
    );
  });

  it("floors at zero rather than going negative", () => {
    expect(cookieMaxAge({ createdAt: ago(99999) }, POLICY, NOW)).toBe(0);
  });
});

describe("previousTokenCutoff", () => {
  it("reaches back one reuse window", () => {
    expect(previousTokenCutoff(POLICY, NOW).toISOString()).toBe("2026-07-31T09:30:00.000Z");
  });
});

describe("shipped policies", () => {
  it("rotate far more often than they expire, which is the point", () => {
    for (const policy of [CUSTOMER_SESSION_POLICY, ADMIN_SESSION_POLICY]) {
      expect(policy.rotateAfterSeconds).toBeLessThan(policy.idleSeconds);
      expect(policy.idleSeconds).toBeLessThanOrEqual(policy.absoluteSeconds);
    }
  });

  it("keep grace far shorter than the rotation interval", () => {
    // A grace window approaching the rotation interval would mean two tokens
    // are usable most of the time, which defeats rotation.
    for (const policy of [CUSTOMER_SESSION_POLICY, ADMIN_SESSION_POLICY]) {
      expect(policy.graceSeconds * 10).toBeLessThan(policy.rotateAfterSeconds);
    }
  });

  it("keep the reuse window long enough to outlast a rotation interval", () => {
    // Otherwise a superseded token would age out of the table before the next
    // rotation, and a replay would read as an unknown token instead of theft.
    for (const policy of [CUSTOMER_SESSION_POLICY, ADMIN_SESSION_POLICY]) {
      expect(policy.reuseWindowSeconds).toBeGreaterThanOrEqual(policy.rotateAfterSeconds);
    }
  });

  it("hold admin sessions to tighter clocks than customer ones", () => {
    expect(ADMIN_SESSION_POLICY.absoluteSeconds).toBeLessThan(
      CUSTOMER_SESSION_POLICY.absoluteSeconds,
    );
    expect(ADMIN_SESSION_POLICY.idleSeconds).toBeLessThan(CUSTOMER_SESSION_POLICY.idleSeconds);
    expect(ADMIN_SESSION_POLICY.rotateAfterSeconds).toBeLessThan(
      CUSTOMER_SESSION_POLICY.rotateAfterSeconds,
    );
  });
});
