/* Auth throttling policy (SECURITY.md rule 6, ASVS V2.2.1 / V11.1).
 *
 * Pure decisions over a list of failure timestamps, so the thresholds are
 * unit-tested without a database and the same policy can guard a password
 * form, an OTP request, or an OTP verify. Counting and storage live in
 * `apps/web/src/lib/auth-throttle.ts`.
 *
 * Two axes are always checked together: the identity being targeted (email
 * or phone) and the source address. Identity limits stop one account being
 * ground down; address limits stop one host spraying many accounts. */

export interface ThrottlePolicy {
  /**
   * Attempts allowed inside `windowSeconds`. The next one is refused.
   *
   * Callers record an attempt *before* asking for a verdict (that ordering is
   * what makes a cap hold against parallel requests), so the count passed to
   * `evaluateThrottle` always includes the attempt being judged. A policy of 5
   * therefore means five tries land and the sixth is refused.
   */
  maxFailures: number;
  /** How far back attempts are counted. */
  windowSeconds: number;
  /** Lock duration, measured from the most recent attempt. */
  lockoutSeconds: number;
}

/* Three keys, deliberately:
 *
 *  pair     = (identity, source address). The fast, tight limit. Locking on
 *             this pair means an attacker grinding someone else's email locks
 *             only their own address against that account, so the real owner
 *             can still sign in from their own device. A bare identity lock
 *             hands any stranger a denial-of-service on any known account.
 *  identity = the account alone. A deliberately high backstop for a genuinely
 *             distributed attack, not an everyday limit.
 *  ip       = the address alone. Catches one host spraying many accounts.
 */

/** Password login for one account from one address. Five tries then a
 * 15-minute cool-off: survivable for a typo, useless for guessing. */
export const LOGIN_PAIR_POLICY: ThrottlePolicy = {
  maxFailures: 5,
  windowSeconds: 15 * 60,
  lockoutSeconds: 15 * 60,
};

/** Backstop for one account across every address. High on purpose: a third
 * party should not be able to lock a merchant owner out casually, so this
 * only trips on an attack distributed over many addresses. */
export const LOGIN_IDENTITY_POLICY: ThrottlePolicy = {
  maxFailures: 50,
  windowSeconds: 60 * 60,
  lockoutSeconds: 15 * 60,
};

/** Password login per address, across accounts. Above the pair limit so a
 * shared office address is not punished for one colleague's bad memory. */
export const LOGIN_IP_POLICY: ThrottlePolicy = {
  maxFailures: 20,
  windowSeconds: 15 * 60,
  lockoutSeconds: 15 * 60,
};

/** OTP sends to one phone. Stops a stranger bombing someone with messages,
 * and each send costs real money (PRICING.md §9.1: about RM0.06). The
 * existing three-live-codes rule already covers rapid retries. */
export const OTP_REQUEST_PHONE_POLICY: ThrottlePolicy = {
  maxFailures: 5,
  windowSeconds: 60 * 60,
  lockoutSeconds: 15 * 60,
};

/**
 * OTP sends per address per hour: a spend cap, not a queue policeman.
 *
 * Set high because the primary join flow is a counter QR on shop wifi, so a
 * busy cafe legitimately signs up dozens of customers an hour from one
 * address, and carrier NAT puts many strangers behind one address too. This
 * exists to stop a script, and the per-phone limit does the abuse work.
 */
export const OTP_REQUEST_IP_POLICY: ThrottlePolicy = {
  maxFailures: 60,
  windowSeconds: 60 * 60,
  lockoutSeconds: 30 * 60,
};

/** Wrong-code submissions for one phone from one address. The per-code
 * attempt cap already stops one code being brute-forced. */
export const OTP_VERIFY_PAIR_POLICY: ThrottlePolicy = {
  maxFailures: 10,
  windowSeconds: 60 * 60,
  lockoutSeconds: 15 * 60,
};

/** Wrong-code submissions per address: stops a host cycling codes across
 * many phones. Same shop-wifi reasoning as the send cap. */
export const OTP_VERIFY_IP_POLICY: ThrottlePolicy = {
  maxFailures: 60,
  windowSeconds: 60 * 60,
  lockoutSeconds: 30 * 60,
};

/** Longest span any policy for a kind can depend on, so pruning never
 * deletes rows another limit still needs. */
export function widestSpanSeconds(policies: readonly ThrottlePolicy[]): number {
  return policies.reduce(
    (max, p) => Math.max(max, p.windowSeconds, p.lockoutSeconds),
    0,
  );
}

export interface ThrottleVerdict {
  locked: boolean;
  /** Seconds until the caller may retry; 0 when not locked. Suitable for a
   * Retry-After header. Always at least 1 while locked, so a client never
   * reads "retry in 0 seconds" and hammers immediately. */
  retryAfterSeconds: number;
  /** Failures counted inside the window, for the message and for tests. */
  failures: number;
}

const UNLOCKED: ThrottleVerdict = { locked: false, retryAfterSeconds: 0, failures: 0 };

/**
 * Decide whether a subject is locked out right now.
 *
 * `failureTimes` are the timestamps of recorded attempts, order irrelevant,
 * and include the attempt being judged (see `maxFailures`). A success should
 * clear the record rather than be passed in, so one good login resets the
 * counter.
 */
export function evaluateThrottle(
  failureTimes: readonly Date[],
  policy: ThrottlePolicy,
  now: Date,
): ThrottleVerdict {
  if (failureTimes.length === 0) return UNLOCKED;

  const windowStart = now.getTime() - policy.windowSeconds * 1000;
  let failures = 0;
  let latest = 0;
  for (const at of failureTimes) {
    const ms = at.getTime();
    if (ms < windowStart) continue;
    failures += 1;
    if (ms > latest) latest = ms;
  }

  // Strictly greater: the count includes the attempt being judged, so a
  // policy of 5 lets the fifth through and refuses the sixth.
  if (failures <= policy.maxFailures) return { locked: false, retryAfterSeconds: 0, failures };

  // The lock runs from the most recent failure, so a burst at the start of a
  // long window does not hold the subject for the whole window.
  const unlockAt = latest + policy.lockoutSeconds * 1000;
  const remainingMs = unlockAt - now.getTime();
  if (remainingMs <= 0) return { locked: false, retryAfterSeconds: 0, failures };

  return {
    locked: true,
    retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
    failures,
  };
}

/**
 * Rows older than this can be deleted: past every policy's span they cannot
 * affect any verdict.
 *
 * Takes the whole set for a kind, not one policy: pruning with the shortest
 * span would silently unlock accounts that a longer limit still holds.
 */
export function throttlePruneCutoff(
  policies: readonly ThrottlePolicy[],
  now: Date,
): Date {
  return new Date(now.getTime() - widestSpanSeconds(policies) * 1000);
}

/** Human wait time for an error message: "a few seconds" beats "0 minutes",
 * and rounding up never promises the retry sooner than it is allowed. */
export function formatRetryAfter(seconds: number): string {
  if (seconds <= 45) return "a few seconds";
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}
