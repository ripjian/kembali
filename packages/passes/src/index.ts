/**
 * Apple Wallet / Google Wallet pass generation & update service.
 *
 * BACKLOG (ROADMAP §6/§7, 2026-07-07): passkit-generator + APNs for Apple,
 * Wallet REST API + signed JWT links for Google. Placeholder types only -
 * no wallet logic until the backlog item is pulled. Signing certs /
 * service-account keys come from the secrets manager at runtime, never this
 * repo (ROADMAP §5).
 */

export type WalletPlatform = "apple" | "google";

export interface PassDescriptor {
  platform: WalletPlatform;
  serial: string;
  cardId: string;
  tenantId: string;
}
