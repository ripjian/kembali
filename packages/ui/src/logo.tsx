import type { SVGProps } from "react";

/* Brand marks - geometry mirrors brand/logo-a-return-loop.svg and
 * brand/logo-d-wordmark.svg (BRAND.md §1). `mono` renders the approved
 * monochrome fallback: all deep-pandan, or all-sand via `mono="sand"`. */

const INK = "#0F3D32";
const CORAL = "#E0684B";
const SAND = "#F6F1E3";

type MonoVariant = "pandan" | "sand";

interface LogoProps extends SVGProps<SVGSVGElement> {
  mono?: MonoVariant;
  size?: number;
}

function logoColors(mono?: MonoVariant): { ink: string; dot: string } {
  if (mono === "pandan") return { ink: INK, dot: INK };
  if (mono === "sand") return { ink: SAND, dot: SAND };
  return { ink: INK, dot: CORAL };
}

/** Primary mark A - return loop with coral stamp dot. */
export function LogoMark({ mono, size = 40, ...props }: LogoProps) {
  const { ink, dot } = logoColors(mono);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 80"
      width={size}
      height={size}
      role="img"
      aria-label="Kembali return loop mark"
      {...props}
    >
      <path
        d="M64 40 A24 24 0 1 1 57 23"
        fill="none"
        stroke={ink}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <polygon points="62.7,28.7 60.5,19.5 53.5,26.5" fill={ink} />
      <circle cx={40} cy={40} r={8} fill={dot} />
    </svg>
  );
}

/** Wordmark D - final "i" in coral (the last stamp). Sans cut. */
export function LogoWordmark({ mono, size = 28, ...props }: LogoProps) {
  const { ink, dot } = logoColors(mono);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 44"
      height={size}
      role="img"
      aria-label="Kembali"
      {...props}
    >
      <text
        x={100}
        y={32}
        textAnchor="middle"
        fontFamily="'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif"
        fontSize={30}
        fontWeight={500}
        letterSpacing="-0.5"
        fill={ink}
      >
        kembal
        <tspan fill={dot}>i</tspan>
      </text>
    </svg>
  );
}

/** Lockup: mark left of wordmark, gap = stamp-dot diameter (BRAND.md §1). */
export function LogoLockup({ mono, size = 32, ...props }: LogoProps) {
  const { ink, dot } = logoColors(mono);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 260 80"
      height={size}
      role="img"
      aria-label="Kembali"
      {...props}
    >
      <path
        d="M64 40 A24 24 0 1 1 57 23"
        fill="none"
        stroke={ink}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <polygon points="62.7,28.7 60.5,19.5 53.5,26.5" fill={ink} />
      <circle cx={40} cy={40} r={8} fill={dot} />
      <text
        x={96}
        y={51}
        fontFamily="'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif"
        fontSize={34}
        fontWeight={500}
        letterSpacing="-0.5"
        fill={ink}
      >
        kembal
        <tspan fill={dot}>i</tspan>
      </text>
    </svg>
  );
}
