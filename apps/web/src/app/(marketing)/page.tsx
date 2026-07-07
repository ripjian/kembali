import { DemoCard } from "@/components/marketing/demo-card";
import { LeadQualifier } from "@/components/marketing/lead-qualifier";
import { PillLink, Tag } from "@/components/marketing/pill";
import { Reveal } from "@/components/marketing/reveal";

const CUSTOMER_FLOW = ["Scan the QR", "Card on phone", "Collect stamps", "Earn reward", "Come back ↺"];
const STAFF_FLOW = ["Open camera", "Scan their QR", "Stamp — done"];

const FEATURES = [
  {
    glyph: "◍",
    title: "A card they can't lose",
    body: "Lives on their phone as a web card — no app store, no download, no forgotten paper card in the other wallet.",
    tag: "MVP",
  },
  {
    glyph: "⌁",
    title: "3-second cashier scan",
    body: "Staff stamp with any phone camera. Rotating signed QR codes stop screenshots and buddy-stamping cold.",
    tag: "MVP",
  },
  {
    glyph: "▤",
    title: "Dashboard & CRM",
    body: "Today's stamps, signups and redemptions in real time, with every customer's visit history behind them.",
    tag: "MVP",
  },
  {
    glyph: "✆",
    title: "WhatsApp-first campaigns",
    body: "Birthday treats, coupon-expiry reminders and win-back nudges on the channel SEA actually reads. Opt-in, PDPA-first.",
    tag: "Next",
  },
  {
    glyph: "⇄",
    title: "Referrals both sides love",
    body: "Personal referral links that reward the sender and the friend — your regulars become your growth channel.",
    tag: "Next",
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero — pure typographic, per the reference */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-8 h-72 w-[36rem] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "linear-gradient(100deg, var(--accent), var(--leaf), var(--surface-alt))",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-[1432px] flex-col items-center gap-8 px-6 pb-20 pt-16 text-center sm:pt-24">
          <Tag>Digital stamp cards · Malaysia &amp; SEA</Tag>
          <h1 className="max-w-4xl font-serif text-5xl font-normal leading-[1.15] tracking-[-0.02em] text-text sm:text-6xl lg:text-[80px] lg:leading-[1.1]">
            Loyalty cards your customers never lose.
          </h1>
          <p className="max-w-2xl font-mono text-base leading-relaxed text-text-secondary sm:text-xl">
            Kembali puts your stamp card on your customer&apos;s phone. They
            join from a QR in under 30 seconds — no app to download, no
            hardware for your staff. Make them kembali.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <PillLink href="/#reach-out">Tell us about your business ▸</PillLink>
            <PillLink href="/roadmap" variant="ghost">
              See what&apos;s coming →
            </PillLink>
          </div>
        </div>
      </section>

      {/* Proof strip — pill nodes, the system's diagram language */}
      <section className="border-y border-border">
        <div className="mx-auto flex w-full max-w-[1432px] flex-wrap items-center justify-center gap-3 px-6 py-8">
          {["Join in < 30s", "Stamp in ≤ 3s", "0 app downloads", "0 extra hardware", "PDPA-ready"].map(
            (stat) => (
              <Tag key={stat}>{stat}</Tag>
            ),
          )}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto w-full max-w-[1432px] scroll-mt-24 px-6 py-20">
        <Reveal>
          <p className="font-mono text-sm uppercase tracking-tight text-text-muted">
            How it works
          </p>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl font-normal leading-tight tracking-tight text-text sm:text-5xl">
            Paper stamp cards, minus the paper. And the losing.
          </h2>
        </Reveal>

        <div className="mt-12 grid items-start gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <Reveal delay={80}>
              <div className="rounded-[40px] border border-border p-8 sm:p-10">
                <p className="font-mono text-xs uppercase tracking-tight text-text-muted">
                  For your customers
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {CUSTOMER_FLOW.map((step, i) => (
                    <span key={step} className="flex items-center gap-2">
                      <Tag>{step}</Tag>
                      {i < CUSTOMER_FLOW.length - 1 && (
                        <span aria-hidden className="font-mono text-text-muted">
                          →
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                <p className="mt-5 font-mono text-sm leading-relaxed text-text-secondary">
                  One scan at your counter and the card is theirs — phone
                  number, done. Every visit after that is a tap and a thank
                  you.
                </p>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="rounded-[40px] border border-border p-8 sm:p-10">
                <p className="font-mono text-xs uppercase tracking-tight text-text-muted">
                  For your staff
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {STAFF_FLOW.map((step, i) => (
                    <span key={step} className="flex items-center gap-2">
                      <Tag>{step}</Tag>
                      {i < STAFF_FLOW.length - 1 && (
                        <span aria-hidden className="font-mono text-text-muted">
                          →
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                <p className="mt-5 font-mono text-sm leading-relaxed text-text-secondary">
                  Any phone with a camera is the stamping machine. No POS
                  integration, no terminal, no training beyond &quot;point it
                  there&quot;.
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={240} className="flex justify-center lg:sticky lg:top-8">
            <DemoCard />
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border">
        <div className="mx-auto w-full max-w-[1432px] scroll-mt-24 px-6 py-20">
          <Reveal>
            <p className="font-mono text-sm uppercase tracking-tight text-text-muted">
              Features
            </p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl font-normal leading-tight tracking-tight text-text sm:text-5xl">
              Everything a loyalty program needs. Nothing your staff will hate.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={(i % 3) * 70}>
                <div className="flex h-full flex-col gap-4 rounded-[40px] border border-border p-10">
                  <div className="flex items-start justify-between">
                    <span aria-hidden className="font-mono text-xl text-text">
                      {feature.glyph}
                    </span>
                    <span className="rounded-full border border-border px-3 py-1 font-mono text-xs uppercase tracking-tight text-text-muted">
                      {feature.tag}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-normal tracking-tight text-text">
                    {feature.title}
                  </h3>
                  <p className="font-mono text-base leading-relaxed text-text-secondary">
                    {feature.body}
                  </p>
                </div>
              </Reveal>
            ))}

            {/* The one colored card that draws the eye */}
            <Reveal delay={140}>
              <div className="relative flex h-full flex-col gap-4 overflow-hidden rounded-[40px] bg-surface-alt p-10">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full opacity-40 blur-2xl"
                  style={{
                    background:
                      "linear-gradient(120deg, var(--accent), var(--leaf))",
                  }}
                />
                <span aria-hidden className="font-mono text-xl text-text">
                  ✦
                </span>
                <h3 className="font-serif text-2xl font-normal tracking-tight text-text">
                  Your brand, not ours
                </h3>
                <p className="font-mono text-base leading-relaxed text-text-secondary">
                  Your logo, your colors, your domain. Kembali is the engine
                  under the hood — your customers only ever see your café.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Interactive reach-out */}
      <section id="reach-out" className="border-t border-border">
        <div className="mx-auto w-full max-w-[1432px] scroll-mt-24 px-6 py-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-sm uppercase tracking-tight text-text-muted">
              Reach out
            </p>
            <h2 className="mt-3 font-serif text-3xl font-normal leading-tight tracking-tight text-text sm:text-5xl">
              Three questions, then we&apos;ll talk.
            </h2>
            <p className="mt-4 font-mono text-base leading-relaxed text-text-secondary">
              Tell us what you run and what you&apos;re after — we&apos;ll show
              you exactly how Kembali would work in your shop.
            </p>
          </Reveal>

          <Reveal delay={120} className="mt-10">
            <LeadQualifier />
          </Reveal>
        </div>
      </section>
    </main>
  );
}
