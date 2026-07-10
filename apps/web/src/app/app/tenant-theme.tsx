import type { ReactNode } from "react";

import {
  type TenantColors,
  tenantScopeClass,
  tenantThemeCss,
} from "@/lib/tenant-theme";

/* Wraps a customer-facing subtree in a merchant's brand theme. Emits a
 * scoped <style> overriding the --tenant-* slots (packages/ui) for this
 * tenant only; the CSP allows inline styles (style-src 'unsafe-inline'). A
 * merchant on the Kembali default (null colours) renders children untouched. */
export function TenantTheme({
  tenantId,
  colors,
  children,
}: {
  tenantId: string;
  colors: TenantColors | null;
  children: ReactNode;
}) {
  if (!colors) return <>{children}</>;
  const scope = tenantScopeClass(tenantId);
  const css = tenantThemeCss(scope, colors);
  return (
    <div className={scope}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </div>
  );
}
