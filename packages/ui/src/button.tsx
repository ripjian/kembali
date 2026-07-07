import type { ButtonHTMLAttributes } from "react";

/* Pandan = actions (BRAND.md §2 usage rules). There is intentionally no
 * coral button variant — coral is for earned things, never actions. */

type ButtonVariant = "primary" | "outline";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 " +
  "text-sm font-semibold transition-colors focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-primary " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  outline: "border border-primary text-primary hover:bg-primary hover:text-on-primary",
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const classes = [base, variants[variant], className].filter(Boolean).join(" ");
  return <button className={classes} {...props} />;
}
