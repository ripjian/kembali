import { NextResponse } from "next/server";

import { keepSessionAlive } from "@/lib/auth";

/** Rotation point for the surfaces that mostly render pages. Pages cannot
 * write cookies, so the signed-in layouts call this once on load and the
 * session token gets replaced on schedule instead of only when someone
 * submits a form. Nothing is returned: the work is the Set-Cookie header.
 *
 * POST, and safe without a CSRF token: the session cookies are sameSite=lax,
 * so a cross-site POST arrives with no session at all and does nothing. */
export async function POST() {
  await keepSessionAlive();
  return new NextResponse(null, { status: 204 });
}
