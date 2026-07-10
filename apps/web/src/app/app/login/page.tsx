import { LogoMark } from "@kembali/ui";

import { LoginForm } from "../login-form";

/* Demo customer sign-in (single-tenant). A merchant's real customers arrive
 * through the tenant-scoped /app/join/[slug] page instead. */

export default function CustomerLoginPage() {
  return (
    <LoginForm
      title="Your loyalty card"
      phoneSubtitle="Enter your phone number to open your card, or create one."
      logo={
        <>
          <LogoMark size={40} className="dark:hidden" />
          <LogoMark size={40} mono="sand" className="hidden dark:block" />
        </>
      }
    />
  );
}
