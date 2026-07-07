import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PillLink } from "../../components/pill";
import { Reveal } from "../../components/reveal";
import {
  AnalyticsIllustration,
  MessagesIllustration,
  PlatformIllustration,
  StampsIllustration,
  WalletIllustration,
} from "../../components/roadmap-illustrations";

export const metadata: Metadata = {
  title: "Roadmap — Kembali",
  description:
    "What we're building and when — the public, high-level Kembali roadmap.",
};

type Status = "shipped" | "now" | "next" | "later" | "backlog";

const STATUS_STYLE: Record<Status, string> = {
  shipped: "bg-primary text-on-primary",
  now: "bg-primary text-on-primary",
  next: "border border-text text-text",
  later: "border border-border text-text-secondary",
  backlog: "border border-dashed border-border text-text-muted",
};

const STATUS_LABEL: Record<Status, string> = {
  shipped: "Shipped",
  now: "Building now",
  next: "Up next",
  later: "Later",
  backlog: "Backlog",
};

interface Phase {
  status: Status;
  title: string;
  body: string;
  points: string[];
  illustration?: ReactNode;
}

const PHASES: Phase[] = [
  {
    status: "shipped",
    title: "Foundations",
    body: "The unglamorous part is done: secure multi-tenant platform, tenant data isolated at the database layer, tamper-proof stamp history.",
    points: ["Multi-tenant core with row-level isolation", "Append-only stamp ledger", "Brand & theming engine"],
  },
  {
    status: "now",
    title: "The stamp card, done right",
    body: "The MVP: a card your customers get from a QR in under 30 seconds, a scanner your staff run on any phone, and a dashboard that shows it working.",
    points: [
      "Customer card with live stamp animation",
      "3-second cashier scan with anti-fraud QR",
      "Merchant onboarding, programs & dashboard",
      "Per-outlet subscription, free trial",
    ],
    illustration: <StampsIllustration />,
  },
  {
    status: "next",
    title: "The retention engine",
    body: "Loyalty that talks back — on WhatsApp, the channel Malaysia actually reads. Every message opt-in, per channel, PDPA-first.",
    points: [
      "Welcome, birthday & milestone rewards",
      "Coupon-expiry reminders & win-back nudges",
      "Referrals that reward both sides",
      "Bahasa Melayu + English (+中文 templates)",
    ],
    illustration: <MessagesIllustration />,
  },
  {
    status: "later",
    title: "Multi-outlet & analytics",
    body: "For the moment one shop becomes three: cross-outlet stamping, per-branch reporting, and the numbers merchants actually buy loyalty for.",
    points: [
      "Cross-outlet stamping & per-branch stats",
      "Repeat-visit rate, member share, redemptions",
      "Fraud dashboard & custom domains",
    ],
    illustration: <AnalyticsIllustration />,
  },
  {
    status: "later",
    title: "Growth & platform",
    body: "Kembali opens up: an API for POS integrations, points and tiers beyond stamps, and AI reports in plain English.",
    points: ["Public API + webhooks", "Points & tiers mode", "AI weekly reports"],
    illustration: <PlatformIllustration />,
  },
  {
    status: "backlog",
    title: "Apple & Google Wallet passes",
    body: "Cards that live in the phone's own wallet, updating the second a stamp lands. Designed and waiting — we're proving the core loyalty loop first, then pulling this forward.",
    points: ["Apple Wallet pass + live updates", "Google Wallet loyalty cards", "Lock-screen relevance near your outlet"],
    illustration: <WalletIllustration />,
  },
];

export default function RoadmapPage() {
  return (
    <main className="mx-auto w-full max-w-[1432px] px-6 pb-24">
      <section className="flex flex-col items-center gap-6 py-16 text-center sm:py-24">
        <Reveal>
          <p className="font-mono text-sm uppercase tracking-tight text-text-muted">
            Public roadmap
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="max-w-3xl font-serif text-4xl font-normal leading-[1.15] tracking-[-0.02em] text-text sm:text-6xl">
            Where Kembali is going.
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="max-w-2xl font-mono text-base leading-relaxed text-text-secondary sm:text-lg">
            High level and honest — what&apos;s shipped, what we&apos;re
            building now, and what&apos;s earning its place. Pilot merchants
            shape the order.
          </p>
        </Reveal>
      </section>

      <div className="flex flex-col gap-8">
        {PHASES.map((phase, i) => (
          <Reveal key={phase.title} delay={60}>
            <article
              className={`grid gap-8 rounded-[40px] border p-8 sm:p-10 lg:grid-cols-2 lg:items-center ${
                phase.status === "backlog"
                  ? "border-dashed border-border"
                  : "border-border"
              }`}
            >
              <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-tight ${STATUS_STYLE[phase.status]}`}
                  >
                    {STATUS_LABEL[phase.status]}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-tight text-text-muted tabular-nums">
                    {String(i).padStart(2, "0")}
                  </span>
                </div>
                <h2 className="mt-4 font-serif text-3xl font-normal leading-tight tracking-tight text-text sm:text-[40px]">
                  {phase.title}
                </h2>
                <p className="mt-4 font-mono text-base leading-relaxed text-text-secondary">
                  {phase.body}
                </p>
                <ul className="mt-5 flex flex-col gap-2">
                  {phase.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-baseline gap-3 font-mono text-sm text-text-secondary"
                    >
                      <span aria-hidden className="text-leaf">
                        ●
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              {phase.illustration && (
                <div className={i % 2 === 1 ? "lg:order-1" : undefined}>
                  {phase.illustration}
                </div>
              )}
            </article>
          </Reveal>
        ))}
      </div>

      <section className="mt-20 flex flex-col items-center gap-6 rounded-[40px] bg-surface-alt px-8 py-16 text-center">
        <Reveal>
          <h2 className="max-w-2xl font-serif text-3xl font-normal leading-tight tracking-tight text-text sm:text-5xl">
            Want to shape what ships first?
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="max-w-xl font-mono text-base leading-relaxed text-text-secondary">
            Pilot merchants get Kembali free while we build — and their
            counter is where the roadmap gets decided.
          </p>
        </Reveal>
        <Reveal delay={180}>
          <PillLink href="/#reach-out">Become a pilot merchant ▸</PillLink>
        </Reveal>
      </section>
    </main>
  );
}
