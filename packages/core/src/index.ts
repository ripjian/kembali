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
export { customerJoinPath, customerJoinUrl } from "./join";
export {
  OTP_PROVIDERS,
  isDeliverableOtpProvider,
  assertOtpDeliverable,
  showsDevOtpNotice,
} from "./otp";
export { needsRegistration } from "./registration";
export {
  evaluateThrottle,
  throttlePruneCutoff,
  widestSpanSeconds,
  formatRetryAfter,
  LOGIN_PAIR_POLICY,
  LOGIN_IDENTITY_POLICY,
  LOGIN_IP_POLICY,
  OTP_REQUEST_PHONE_POLICY,
  OTP_REQUEST_IP_POLICY,
  OTP_VERIFY_PAIR_POLICY,
  OTP_VERIFY_IP_POLICY,
  type ThrottlePolicy,
  type ThrottleVerdict,
} from "./throttle";
export {
  hashPassword,
  verifyPassword,
  hashAuthIdentifier,
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
