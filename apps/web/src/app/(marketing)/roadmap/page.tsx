import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PillLink } from "@/components/marketing/pill";
import { Reveal } from "@/components/marketing/reveal";
import {
  AnalyticsIllustration,
  MessagesIllustration,
  PlatformIllustration,
  StampsIllustration,
  WalletIllustration,
} from "@/components/marketing/roadmap-illustrations";

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
  shipped: "Done",
  now: "Building now",
  next: "Up next",
  later: "Later",
  backlog: "Planned",
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
    body: "The groundwork is done: a secure multi-tenant platform, each merchant's data isolated at the database layer, and a stamp history that can't be edited.",
    points: ["Isolated data per merchant", "Tamper-proof stamp history", "Brand & theming engine"],
  },
  {
    status: "now",
    title: "The stamp card, done right",
    body: "The first release: customers get a card from a QR in under 30 seconds, staff stamp it with any phone, and your dashboard shows it working.",
    points: [
      "Customer card with live stamp animation",
      "3-second stamping with fraud-proof QR codes",
      "Merchant onboarding, programs & dashboard",
      "Per-outlet subscription with a free trial",
    ],
    illustration: <StampsIllustration />,
  },
  {
    status: "next",
    title: "Bring them back automatically",
    body: "Messages that keep customers returning, sent on WhatsApp — the channel your customers actually read. Every message is opt-in, as PDPA requires.",
    points: [
      "Welcome, birthday & milestone rewards",
      "Reward-expiry reminders & win-back offers",
      "Referral rewards for both sides",
      "Templates in English, Bahasa Melayu and Chinese",
    ],
    illustration: <MessagesIllustration />,
  },
  {
    status: "later",
    title: "Multi-outlet & analytics",
    body: "For when one shop becomes three: stamps that work across branches, per-branch reporting, and the numbers that prove loyalty pays.",
    points: [
      "Cross-outlet stamping & per-branch reports",
      "Repeat-visit rate, member share, redemptions",
      "Fraud alerts & custom domains",
    ],
    illustration: <AnalyticsIllustration />,
  },
  {
    status: "later",
    title: "Growth & platform",
    body: "Kembali opens up: an API for POS integrations, points and tiers beyond stamps, and weekly reports in plain English.",
    points: ["Public API & webhooks", "Points & tiers", "Weekly summary reports"],
    illustration: <PlatformIllustration />,
  },
  {
    status: "backlog",
    title: "Apple & Google Wallet passes",
    body: "Cards that live in the phone's own wallet and update the moment a stamp lands. The design is ready — we're shipping the core card first.",
    points: ["Apple Wallet pass with live updates", "Google Wallet loyalty cards", "Appears on the lock screen near your outlet"],
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
            What&apos;s done, what we&apos;re building now, and what comes
            next. Pilot merchants shape the order.
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
            Pilot merchants use Kembali free while we build — and their
            feedback decides what ships next.
          </p>
        </Reveal>
        <Reveal delay={180}>
          <PillLink href="/#reach-out">Become a pilot merchant ▸</PillLink>
        </Reveal>
      </section>
    </main>
  );
}
