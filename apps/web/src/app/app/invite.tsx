"use client";

import { useState } from "react";

/* Share a personal invite link: native share sheet where the phone has
 * one, clipboard everywhere else. The link itself is rendered server-side
 * so it works with JavaScript off. */

export function ShareInvite({ url, store }: { url: string; store: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const text = `Join me at ${store} and get a welcome treat on your first visit: ${url}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch {
        /* the person closed the sheet - fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the visible link below can be selected */
    }
  }
  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-tenant-primary text-sm font-semibold text-tenant-on-primary hover:bg-tenant-primary-hover"
      data-share-invite
    >
      {copied ? "Link copied" : "Share your invite link"}
    </button>
  );
}
