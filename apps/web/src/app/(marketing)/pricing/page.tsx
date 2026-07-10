import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ActionLink } from "@/components/marketing/pill";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Pricing · Kembali",
  description:
    "Simple pricing, per outlet, per month. Start as a founding merchant at RM99 with a 30-day free pilot. No card needed. We invoice you after the trial.",
};

/* Pricing page (PRICING.md §8). Light-locked marketing surface, DESIGN-dub
 * style. Points and rewards are live, so they sit in the included lists;
 * only the genuinely unshipped features are greyed "Coming soon". No
 * self-serve payment anywhere - contact-to-invoice, no card. */

function Check() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="mt-0.5 size-4 shrink-0 text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

function Included({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-text-secondary">
      <Check />
      <span>{children}</span>
    </li>
  );
}

function ComingSoon({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-text-muted">
      <span aria-hidden className="mt-0.5 shrink-0 text-sm leading-4">
        ✨
      </span>
      <span>
        {children}{" "}
        <span className="whitespace-nowrap text-xs font-medium text-text-muted">
          · Coming soon
        </span>
      </span>
    </li>
  );
}

interface Plan {
  id: string;
  name: string;
  price: string;
  badge: string;
  featured?: boolean;
  blurb: string;
  cta: { label: string; href: string; variant: "primary" | "outline" };
  included: string[];
  comingSoon?: string[];
  footNote?: string;
}

const PLANS: Plan[] = [
  {
    id: "founding",
    name: "Founding merchant",
    price: "RM99",
    badge: "Available now",
    featured: true,
    blurb:
      "For the first 20 shops. Everything Kembali makes, as it ships, with no plan change, ever.",
    cta: {
      label: "Become a founding merchant",
      href: "/#reach-out",
      variant: "primary",
    },
    included: [
      "Digital stamp card on your customers' phones",
      "QR scan to stamp, on any phone",
      "Points and rewards, ready to redeem",
      "Customer profiles and team roles",
      "Reports and free data export",
    ],
    footNote:
      "30-day free pilot, then RM99 locked for 12 months. New features arrive at no extra cost: wallet cards, WhatsApp, referrals.",
  },
  {
    id: "starter",
    name: "Starter",
    price: "RM149",
    badge: "At launch",
    blurb: "Everything a growing shop needs to run a loyalty program.",
    cta: {
      label: "Join as a founding merchant instead",
      href: "#founding",
      variant: "outline",
    },
    included: [
      "Digital stamp card and QR scan to stamp",
      "Points and rewards, ready to redeem",
      "Customer profiles and team roles",
      "Reports and free data export",
    ],
    comingSoon: ["Apple and Google Wallet cards"],
  },
  {
    id: "growth",
    name: "Growth",
    price: "RM279",
    badge: "At launch",
    blurb: "For shops ready to bring customers back and grow by word of mouth.",
    cta: {
      label: "Join as a founding merchant instead",
      href: "#founding",
      variant: "outline",
    },
    included: ["Everything in Starter"],
    comingSoon: [
      "Apple and Google Wallet cards",
      "WhatsApp reminders and campaigns",
      "VIP and staff member tags",
      "Referral rewards",
      "Your own domain",
      "RM30 monthly message credits included",
    ],
  },
];

const FAQ = [
  {
    q: "Do my customers download an app?",
    a: "No. Their card opens right in the phone browser from a QR at your counter. Nothing to install, nothing to forget.",
  },
  {
    q: "Do I need new hardware?",
    a: "No. Your staff scan the customer's code with any phone camera. No terminals, no readers, no setup fee.",
  },
  {
    q: "What happens to my data if I leave?",
    a: "It stays yours. Export every customer and visit to a CSV file anytime. Free, on every plan, forever.",
  },
  {
    q: "How do I pay?",
    a: "We invoice you after your free pilot, by bank transfer or DuitNow. No card needed to start.",
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      id={plan.id}
      className={`flex scroll-mt-24 flex-col rounded-2xl border bg-surface p-6 sm:p-8 ${
        plan.featured ? "border-accent shadow-[0_1px_2px_rgb(0_0_0/0.05)]" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium tracking-[-0.01em] text-text">
          {plan.name}
        </h2>
        <span
          className={`rounded-full px-3 py-0.5 text-xs font-medium ${
            plan.featured
              ? "bg-primary text-on-primary"
              : "border border-border text-text-muted"
          }`}
        >
          {plan.badge}
        </span>
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-4xl font-medium tracking-[-0.02em] text-text">
          {plan.price}
        </span>
        <span className="text-sm text-text-muted">/ outlet / month</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        {plan.blurb}
      </p>

      <div className="mt-6">
        <ActionLink
          href={plan.cta.href}
          variant={plan.cta.variant}
          className="w-full"
        >
          {plan.cta.label}
        </ActionLink>
      </div>

      <ul className="mt-6 flex flex-col gap-2.5">
        {plan.included.map((item) => (
          <Included key={item}>{item}</Included>
        ))}
        {plan.comingSoon?.map((item) => (
          <ComingSoon key={item}>{item}</ComingSoon>
        ))}
      </ul>

      {plan.footNote && (
        <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-text-muted">
          {plan.footNote}
        </p>
      )}
    </div>
  );
}

export default function PricingPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 pb-20">
      <section className="flex flex-col items-center gap-5 py-14 text-center sm:py-20">
        <Reveal>
          <p className="text-sm font-medium text-text-muted">Pricing</p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="max-w-3xl text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-text sm:text-5xl">
            Simple pricing, one price per outlet.
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
            Start free for 30 days. No card to sign up. We invoice you after
            the pilot. Every plan keeps free data export, forever.
          </p>
        </Reveal>
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-3">
        {PLANS.map((plan, i) => (
          <Reveal key={plan.id} delay={(i % 3) * 80} className="h-full">
            <PlanCard plan={plan} />
          </Reveal>
        ))}
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Reveal>
          <div className="flex h-full flex-col gap-1.5 rounded-2xl border border-border bg-surface-alt p-6">
            <p className="text-sm font-medium text-text">Yearly billing</p>
            <p className="text-sm leading-relaxed text-text-secondary">
              Pay for ten months and get twelve. Same price per outlet, two
              months on us.
            </p>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div className="flex h-full flex-col gap-1.5 rounded-2xl border border-border bg-surface-alt p-6">
            <p className="text-sm font-medium text-text">Multiple outlets</p>
            <p className="text-sm leading-relaxed text-text-secondary">
              Five outlets or more get 20% off. For a bigger chain, talk to us
              and we&apos;ll sort out a plan that fits.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mt-16">
        <Reveal>
          <h2 className="text-2xl font-medium leading-tight tracking-[-0.02em] text-text sm:text-3xl">
            Good to know
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={(i % 2) * 80}>
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-medium text-text">{item.q}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {item.a}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-16 flex flex-col items-center gap-5 rounded-2xl border border-border bg-surface-alt px-8 py-14 text-center">
        <Reveal>
          <h2 className="max-w-2xl text-2xl font-medium leading-tight tracking-[-0.02em] text-text sm:text-4xl">
            Start with your first 20 customers.
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="max-w-xl text-base leading-relaxed text-text-secondary">
            Join the founding merchants shaping Kembali. Thirty days free, then
            RM99 a month locked for a year.
          </p>
        </Reveal>
        <Reveal delay={180}>
          <ActionLink href="/#reach-out">Become a founding merchant</ActionLink>
        </Reveal>
      </section>
    </main>
  );
}
