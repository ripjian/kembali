import "server-only";

import { cookies } from "next/headers";

/* Admin light/dark preference, persisted in a long-lived cookie so it
 * survives across sessions. "" (unset) means follow the system. */

export const THEME_COOKIE = "kb_theme";
export type AdminTheme = "light" | "dark" | "";

export async function readAdminTheme(): Promise<AdminTheme> {
  const v = (await cookies()).get(THEME_COOKIE)?.value;
  return v === "light" || v === "dark" ? v : "";
}
