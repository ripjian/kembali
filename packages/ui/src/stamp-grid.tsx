/* Stamp grid — coral = earned stamps (the "earn" color), border/muted =
 * empty slots. Leaf is reserved for progress bars, not stamps. */

export interface StampGridProps {
  earned: number;
  total: number;
  className?: string;
}

export function StampGrid({ earned, total, className }: StampGridProps) {
  const clamped = Math.max(0, Math.min(earned, total));
  return (
    <div
      className={["grid grid-cols-5 gap-3", className].filter(Boolean).join(" ")}
      role="img"
      aria-label={`${clamped} of ${total} stamps earned`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={
            i < clamped
              ? "size-10 rounded-full bg-accent"
              : "size-10 rounded-full border-2 border-dashed border-border bg-surface-alt"
          }
        />
      ))}
    </div>
  );
}
