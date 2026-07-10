/* The customer join URL is tenant-scoped by slug: a merchant's printed QR
 * always lands on that merchant's join page, never another's. Pure builders
 * so the QR kit and the routing tests share one source of truth. */

export function customerJoinPath(slug: string): string {
  return `/app/join/${slug}`;
}

export function customerJoinUrl(baseUrl: string, slug: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${customerJoinPath(slug)}`;
}
