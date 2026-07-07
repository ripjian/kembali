/**
 * Apple Wallet / Google Wallet pass generation & update service.
 *
 * Phase 1 (ROADMAP §6): passkit-generator + APNs for Apple, Wallet REST API
 * + signed JWT links for Google. Placeholder types only in Phase 0 — no
 * wallet logic yet. Signing certs / service-account keys come from the
 * secrets manager at runtime, never this repo (ROADMAP §5).
 */

export type WalletPlatform = "apple" | "google";

export interface PassDescriptor {
  platform: WalletPlatform;
  serial: string;
  cardId: string;
  tenantId: string;
}
