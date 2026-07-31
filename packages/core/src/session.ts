/* Session lifetime policy (SECURITY.md rule 6, ASVS V3.3 / V3.7).
 *
 * Pure decisions over a session's timestamps, so the rules are unit-tested
 * without a database or a cookie jar. Storage and cookie writing live in
 * `apps/web/src/lib/auth.ts`.
 *
 * Three clocks run at once, and a session has to satisfy all of them:
 *
 *  absolute — from creation, never extended. The outer bound on how long one
 *             sign-in can last no matter how active the person is.
 *  idle     — from last use. Kills a session nobody came back to, which is the
 *             common shape of a lost phone or a walked-away-from counter.
 *  rotation — the cookie value itself is replaced periodically. The session
 *             survives; the token does not. This is the control that matters
 *             for a copied cookie: a stolen value stops working at the next
 *             rotation instead of lasting the whole absolute window, and the
 *             replay is *detectable* rather than merely useless.
 *
 * Rotation only works if the replaced token stays acceptable for a short
 * grace period. A browser fires several requests at once, and the ones
 * already in flight when the swap happens still carry the old value; without
 * grace they would each look like a theft.
 */

export interface SessionPolicy {
  /** Ceiling measured from creation. Never extended by activity. */
  absoluteSeconds: number;
  /** How long a session may sit unused before it dies. */
  idleSeconds: number;
  /** How often the cookie token is replaced. */
  rotateAfterSeconds: number;
  /**
   * How long the replaced token keeps working after a rotation. Covers
   * requests that were already in flight, nothing more. Long enough to
   * outlast a slow page load, far too short to be worth stealing.
   */
  graceSeconds: number;
  /**
   * How long a replaced token stays on file after its grace ends. Inside this
   * window a replay is recognised as the old token and read as theft; past it
   * the row is gone and the same replay is merely an unknown token. Both fail
   * the request. The difference is that the first one also kills the session
   * the thief copied it from, which is what tells the real person something
   * happened.
   */
  reuseWindowSeconds: number;
  /**
   * Minimum gap between writes to the idle clock. Without it every request
   * would write a row; with it the clock is coarse and the idle limit is
   * effectively `idleSeconds` give or take this much.
   */
  touchAfterSeconds: number;
}

/** What the caller knows about the session row and the token presented. */
export interface SessionState {
  createdAt: Date;
  lastUsedAt: Date;
  /** When the current token was issued (creation counts as a rotation). */
  rotatedAt: Date;
  /**
   * True when the token presented was the *previous* one, not the current
   * one. Only reachable while the previous hash is still on file.
   */
  presentedPrevious: boolean;
  /** End of the grace period for the previous token; null when none. */
  previousValidUntil: Date | null;
  /**
   * Whether the current token has ever been seen in use. This is what
   * separates a theft from a dropped response: if nobody has ever presented
   * the new token, the rotation reply never reached the browser, and the
   * browser still holding the old one is the same browser as before.
   */
  tokenConfirmed: boolean;
}

export type SessionVerdict =
  | { status: "expired"; reason: "absolute" | "idle" }
  /** A superseded token came back after its grace ended, and its replacement
   * is in use elsewhere. Two parties hold tokens for one session, so revoke
   * it: the thief loses access and the real person is told by being asked to
   * sign in again. */
  | { status: "stolen" }
  | {
      status: "live";
      /** The token is due to be replaced. */
      rotate: boolean;
      /** The idle clock is stale enough to be worth a write. */
      touch: boolean;
      /** Seconds until the session dies of old age or of idleness. */
      remainingSeconds: number;
    };

function seconds(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / 1000;
}

export function evaluateSession(
  state: SessionState,
  policy: SessionPolicy,
  now: Date,
): SessionVerdict {
  if (state.presentedPrevious) {
    const graceEnds = state.previousValidUntil;
    // No recorded grace end means the row was written before this policy
    // existed; refuse rather than guess in the direction of the attacker.
    const past = !graceEnds || now.getTime() > graceEnds.getTime();
    // Past grace is only theft if someone is actually using the replacement.
    // If nobody ever has, the rotation reply was lost - a dropped connection,
    // a closed tab - and this is the same browser, still on the only token it
    // ever received. Signing it out would punish a flaky network, and for a
    // customer that means an OTP round trip to get back in. There is also
    // nothing to detect: with the replacement unused, a thief and the real
    // holder present the identical token and cannot be told apart.
    if (past && state.tokenConfirmed) return { status: "stolen" };
  }

  const absoluteLeft = policy.absoluteSeconds - seconds(state.createdAt, now);
  if (absoluteLeft <= 0) return { status: "expired", reason: "absolute" };

  const idleLeft = policy.idleSeconds - seconds(state.lastUsedAt, now);
  if (idleLeft <= 0) return { status: "expired", reason: "idle" };

  // A browser still on the superseded token after grace never received its
  // replacement, so rotate again to hand it one it can keep. Without this the
  // same request would come back every time and the session would be stuck on
  // a token the browser can never upgrade.
  const stranded =
    state.presentedPrevious &&
    (!state.previousValidUntil || now.getTime() > state.previousValidUntil.getTime());

  return {
    status: "live",
    // A request arriving on the previous token inside grace is by definition
    // moments after a rotation, so `rotate` is false there without a case.
    rotate: stranded || seconds(state.rotatedAt, now) >= policy.rotateAfterSeconds,
    touch: seconds(state.lastUsedAt, now) >= policy.touchAfterSeconds,
    remainingSeconds: Math.floor(Math.min(absoluteLeft, idleLeft)),
  };
}

/**
 * How long the browser should keep the cookie: the whole absolute window, and
 * deliberately not the idle window.
 *
 * The idle clock is refreshed by activity the browser cannot see, including
 * page renders, which never rewrite the cookie because Next only allows that
 * in an action or a route handler. A cookie cut to the idle window would
 * therefore expire on the browser while the session was still very much alive
 * on the server, signing someone out mid-task. The reverse - a cookie
 * outliving its session - costs nothing: the server checks both clocks and
 * clears the cookie on the way out.
 */
export function cookieMaxAge(
  state: Pick<SessionState, "createdAt">,
  policy: SessionPolicy,
  now: Date,
): number {
  return Math.max(0, Math.floor(policy.absoluteSeconds - seconds(state.createdAt, now)));
}

/**
 * When a superseded token stops being on file. Kept past the grace period on
 * purpose: that gap is the only place a replay can be told apart from an
 * unknown token.
 */
export function previousTokenCutoff(policy: SessionPolicy, now: Date): Date {
  return new Date(now.getTime() - policy.reuseWindowSeconds * 1000);
}

/** Customers carry a loyalty card, not a bank account. The absolute window is
 * generous because the cost of a forced re-verify is a lost visit, and the
 * daily rotation is what actually bounds a copied cookie. */
export const CUSTOMER_SESSION_POLICY: SessionPolicy = {
  absoluteSeconds: 30 * 24 * 3600,
  idleSeconds: 14 * 24 * 3600,
  rotateAfterSeconds: 24 * 3600,
  graceSeconds: 120,
  reuseWindowSeconds: 24 * 3600,
  touchAfterSeconds: 5 * 60,
};

/** Staff and platform sessions hold other people's data, so every clock is
 * tighter. Four idle hours is longer than any gap in a working shift and
 * shorter than a counter left unattended overnight. */
export const ADMIN_SESSION_POLICY: SessionPolicy = {
  absoluteSeconds: 12 * 3600,
  idleSeconds: 4 * 3600,
  rotateAfterSeconds: 3600,
  graceSeconds: 120,
  reuseWindowSeconds: 12 * 3600,
  touchAfterSeconds: 5 * 60,
};
