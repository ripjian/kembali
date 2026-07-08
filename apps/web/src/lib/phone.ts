import { z } from "zod";

/** Normalize Malaysian-first phone input: "012-345 6701" → "+60123456701". */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  const bare = digits.replace(/^\+/, "");
  if (!/^\d{8,15}$/.test(bare)) return null;
  if (digits.startsWith("+")) return `+${bare}`;
  if (bare.startsWith("0")) return `+60${bare.slice(1)}`;
  if (bare.startsWith("60")) return `+${bare}`;
  return `+${bare}`;
}

export const phoneInputSchema = z
  .string()
  .min(8, "Enter your phone number")
  .max(20);
