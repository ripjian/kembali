import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

/* Button vocabulary (brand/DESIGN-dub.md): one filled committed action per
 * surface (pandan plays the Deep Sapphire role), outlined 1px-ash buttons
 * as the workhorse, ghost for nav. Buttons are 8px radius; tags are pills. */

type ButtonVariant = "primary" | "outline" | "ghost";

const base =
  "press inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 " +
  "text-sm font-medium transition-colors";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary shadow-[0_1px_2px_rgb(0_0_0/0.05)] hover:bg-primary-hover",
  outline: "border border-border bg-surface text-text hover:bg-surface-alt",
  ghost: "text-text hover:bg-surface-alt",
};

export function ActionLink({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
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

/** Feature pill - the system's signature floating element: a small colored
 * dot (exactly one accent per pill) + quiet label, 9999px radius.
 * `style` is exposed for animation custom properties (e.g. `--i` delays). */
export function Tag({
  children,
  dot,
  className,
  style,
}: {
  children: ReactNode;
  /** accent dot color: coral = earned, leaf = progress, pandan = action */
  dot?: "coral" | "leaf" | "pandan";
  className?: string;
  style?: CSSProperties;
}) {
  const dotColor =
    dot === "coral" ? "bg-accent" : dot === "leaf" ? "bg-leaf" : dot === "pandan" ? "bg-primary" : null;
  return (
    <span
      style={style}
      className={[
        "inline-flex items-center gap-2 rounded-full border border-border",
        "bg-surface px-4 py-1.5 text-sm font-medium text-text",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {dotColor && <span className={`size-2 rounded-full ${dotColor}`} />}
      {children}
    </span>
  );
}
