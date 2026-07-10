export { computeCardProgress, type CardProgress } from "./card-progress";
export {
  parseHex,
  normalizeHex,
  relativeLuminance,
  contrastRatio,
  onColor,
  ensureReadable,
  type Rgb,
} from "./contrast";
export {
  deriveTenantTheme,
  contrastCheck,
  AA_TEXT,
  AA_UI,
  type TenantTheme,
} from "./theme";
export {
  hashPassword,
  verifyPassword,
  createSessionToken,
  hashSessionToken,
  signQrToken,
  verifyQrToken,
  generateOtpCode,
  hashOtpCode,
  isOtpBypass,
  OTP_DEV_BYPASS_CODE,
  OTP_TTL_MINUTES,
  OTP_MAX_ATTEMPTS,
  QR_TOKEN_TTL_SECONDS,
  type QrPayload,
  type QrVerifyResult,
} from "./auth";
export {
  checkStampVelocity,
  earnsReward,
  MIN_SECONDS_BETWEEN_STAMPS,
  MAX_STAMPS_PER_CARD_PER_DAY,
  type StampCheck,
} from "./stamping";
export { pointsForAmount, sumPointDeltas } from "./points";
export { planAllowsReportDownload, REPORT_DOWNLOAD_PLANS } from "./plans";
export {
  generateRedemptionCode,
  isRedemptionCode,
  normalizeRedemptionCode,
  redemptionExpiry,
  REDEMPTION_TTL_MINUTES,
} from "./redemptions";
export {
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  DEFAULT_ROLE_PERMISSIONS,
  resolveRolePermissions,
  type PermissionKey,
  type StaffRoleKey,
  type RolePermissionMatrix,
} from "./permissions";
