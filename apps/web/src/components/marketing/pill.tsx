import Link from "next/link";
import type { ReactNode } from "react";

/* Pill containers are the language of this system (DESIGN-Monad.md):
 * 100px radius, mono uppercase 14px labels. Pandan is the ONLY saturated
 * fill and marks the single primary action per screen. */

type PillVariant = "primary" | "dark" | "ghost";

const base =
  "press inline-flex h-12 items-center justify-center gap-2 rounded-full " +
  "px-8 font-mono text-sm uppercase tracking-tight whitespace-nowrap " +
  "transition-colors";

const variants: Record<PillVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  dark: "bg-text text-bg hover:opacity-90",
  ghost: "border border-text text-text hover:bg-surface-alt",
};

export function PillLink({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: PillVariant;
  className?: string;
  children: ReactNode;
}) {
  const classes = [base, variants[variant], className].filter(Boolean).join(" ");
  const external = href.startsWith("http") || href.startsWith("mailto:");
  if (external) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

/** Hairline pill tag — the node/badge language (14px mono uppercase). */
export function Tag({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border border-border",
        "bg-bg px-5 py-2.5 font-mono text-sm uppercase tracking-tight text-text",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
