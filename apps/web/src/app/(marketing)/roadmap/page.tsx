import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ActionLink } from "@/components/marketing/pill";
import { Reveal } from "@/components/marketing/reveal";
import {
  FoundationsIllustration,
  MessagesIllustration,
  PlatformIllustration,
  ReferralIllustration,
  StampsIllustration,
  WalletIllustration,
} from "@/components/marketing/roadmap-illustrations";

export const metadata: Metadata = {
  title: "Roadmap — Kembali",
  description:
    "What we're building and when — the public, high-level Kembali roadmap.",
};

type Status = "shipped" | "now" | "next" | "later";

const STATUS_STYLE: Record<Status, string> = {
  shipped: "bg-primary text-on-primary",
  now: "bg-primary text-on-primary",
  next: "border border-smoke text-text",
  later: "border border-border text-text-secondary",
};

const STATUS_LABEL: Record<Status, string> = {
  shipped: "Done",
  now: "Building now",
  next: "Up next",
  later: "Later",
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
    illustration: <FoundationsIllustration />,
  },
  {
    status: "now",
    title: "The stamp card, done right",
    body: "The first release: customers get a card from a QR in under 30 seconds, staff stamp it with any phone, and simple reports show it working.",
    points: [
      "Customer card with live stamp animation",
      "3-second stamping with fraud-proof QR codes",
      "Merchant onboarding & program setup",
      "Simple reports: stamps, signups, repeat visits",
      "Per-outlet subscription with a free trial",
    ],
    illustration: <StampsIllustration />,
  },
  {
    status: "next",
    title: "Apple & Google Wallet passes",
    body: "Cards that live in the phone's own wallet and update the moment a stamp lands — right next to their boarding passes.",
    points: [
      "Apple Wallet pass with live updates",
      "Google Wallet loyalty cards",
      "Appears on the lock screen near your outlet",
    ],
    illustration: <WalletIllustration />,
  },
  {
    status: "later",
    title: "Bring them back on WhatsApp",
    body: "Warm messages that invite customers back, sent on the channel they actually read. Every message is opt-in, as PDPA requires.",
    points: [
      "Welcome, birthday & milestone rewards",
      "Reward-expiry reminders & win-back offers",
      "Templates in English, Bahasa Melayu and Chinese",
    ],
    illustration: <MessagesIllustration />,
  },
  {
    status: "later",
    title: "Referral rewards",
    body: "Your regulars bring their friends. Everyone shares a personal link — when a friend joins and visits, both sides get a treat.",
    points: [
      "Personal referral links & QR codes",
      "Rewards for the sender and the friend",
      "Referral numbers in your reports",
    ],
    illustration: <ReferralIllustration />,
  },
  {
    status: "later",
    title: "Connect your POS & deeper reports",
    body: "Kembali opens up: an API and webhooks for POS integrations, plus the deeper numbers for growing chains — across every branch.",
    points: [
      "Public API & webhooks, POS integrations",
      "Repeat-visit rate, member share, redemptions",
      "Cross-outlet stamping & per-branch reports",
    ],
    illustration: <PlatformIllustration />,
  },
];

export default function RoadmapPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 pb-20">
      <section className="flex flex-col items-center gap-5 py-14 text-center sm:py-20">
        <Reveal>
          <p className="text-sm font-medium text-text-muted">Public roadmap</p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="max-w-3xl text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-text sm:text-5xl">
            Where Kembali is going.
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
            What&apos;s done, what we&apos;re building now, and what comes
            next. Pilot merchants shape the order.
          </p>
        </Reveal>
      </section>

      <div className="flex flex-col gap-6">
        {PHASES.map((phase, i) => (
          <Reveal key={phase.title} delay={60}>
            <article className="grid gap-8 rounded-2xl border border-border bg-surface p-6 sm:p-8 lg:grid-cols-2 lg:items-center">
              <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[phase.status]}`}
                  >
                    {STATUS_LABEL[phase.status]}
                  </span>
                  <span className="font-mono text-xs text-text-muted tabular-nums">
                    {String(i).padStart(2, "0")}
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-medium leading-tight tracking-[-0.02em] text-text sm:text-3xl">
                  {phase.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">
                  {phase.body}
                </p>
                <ul className="mt-4 flex flex-col gap-1.5">
                  {phase.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-baseline gap-2.5 text-sm text-text-secondary"
                    >
                      <span aria-hidden className="size-1.5 shrink-0 translate-y-[-2px] rounded-full bg-leaf" />
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

      <section className="mt-16 flex flex-col items-center gap-5 rounded-2xl border border-border bg-surface-alt px-8 py-14 text-center">
        <Reveal>
          <h2 className="max-w-2xl text-2xl font-medium leading-tight tracking-[-0.02em] text-text sm:text-4xl">
            Want a say in what ships first?
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="max-w-xl text-base leading-relaxed text-text-secondary">
            Pilot merchants use Kembali free while we build — and their
            feedback decides what comes next.
          </p>
        </Reveal>
        <Reveal delay={180}>
          <ActionLink href="/#reach-out">Become a pilot merchant</ActionLink>
        </Reveal>
      </section>
    </main>
  );
}
