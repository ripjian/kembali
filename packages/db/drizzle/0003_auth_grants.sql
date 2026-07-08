-- Grants for the auth tables added in 0002 (kembali_app runtime role).
-- otp_codes and sessions are cleaned up (deleted) by the app; the two
-- append-only ledgers keep their restricted grants from 0001.

GRANT SELECT, INSERT, UPDATE, DELETE ON
  "otp_codes", "sessions", "platform_admins"
TO "kembali_app";
