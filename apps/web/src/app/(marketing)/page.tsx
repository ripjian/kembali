import { DemoCard } from "@/components/marketing/demo-card";
import { FeatureShowcase } from "@/components/marketing/feature-showcase";
import { LeadQualifier } from "@/components/marketing/lead-qualifier";
import { ActionLink, Tag } from "@/components/marketing/pill";
import { ReceiptCard } from "@/components/marketing/receipt-card";
import { Reveal } from "@/components/marketing/reveal";

const FEATURES = [
  {
    dot: "leaf" as const,
    title: "Simple reports, not homework",
    body: "Today's stamps, signups and redemptions, plus who keeps coming back. The numbers you check over morning coffee — deeper analytics comes later.",
    tag: "At launch",
  },
  {
    dot: "pandan" as const,
    title: "WhatsApp campaigns",
    body: "Birthday rewards, expiry reminders and friendly win-back offers on WhatsApp. Every message is opt-in, as PDPA requires.",
    tag: "Planned",
  },
  {
    dot: "coral" as const,
    title: "Referral rewards",
    body: "Customers share a personal link. When a friend joins, both of them get a treat.",
    tag: "Planned",
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero — thesis up top, product peeking past the fold below */}
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="dot-grid absolute inset-0" />
        <div className="relative mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 pt-16 text-center sm:pt-20">
          {/* floating feature pills — one accent each */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Tag dot="coral">Stamp cards</Tag>
            <Tag dot="pandan">Wallet passes</Tag>
            <Tag dot="leaf">Simple reports</Tag>
          </div>

          <h1 className="mt-8 max-w-3xl text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-text sm:text-5xl lg:text-6xl">
            Loyalty cards your customers never lose.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
            Kembali puts your stamp card on your customers&apos; phones. They
            join in 30 seconds from a QR at your counter — and every visit
            brings them closer to their next reward.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ActionLink href="/#reach-out">See how it fits your shop</ActionLink>
            <ActionLink href="/#showcase" variant="outline">
              Take a look inside
            </ActionLink>
          </div>

          <p className="scroll-cue mt-10 text-sm text-text-muted" aria-hidden>
            ↓
          </p>

          {/* Dashboard mockup, deliberately clipped by the fold — the rest
              is one scroll away */}
          <div className="relative mt-8 h-56 w-full max-w-4xl overflow-hidden sm:h-72">
            <div className="panel-ring absolute inset-x-0 top-0 flex h-[420px] overflow-hidden rounded-t-2xl border border-border bg-surface text-left">
              {/* sidebar */}
              <div aria-hidden className="hidden w-44 shrink-0 flex-col gap-1 border-r border-border bg-surface-alt p-4 sm:flex">
                <p className="mb-2 text-xs font-semibold text-text">Corner Coffee</p>
                {["Overview", "Customers", "Programs", "Outlets", "Campaigns"].map((item, i) => (
                  <span
                    key={item}
                    className={`rounded-lg px-2.5 py-1.5 text-xs ${
                      i === 0 ? "bg-surface font-medium text-text" : "text-text-secondary"
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </div>
              {/* content */}
              <div aria-hidden className="flex-1 p-4 sm:p-5">
                <p className="text-xs font-medium text-text-muted">Today at your counter</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ["Stamps", "128"],
                    ["Signups", "24"],
                    ["Redemptions", "9"],
                    ["Repeat visits", "41%"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-border bg-surface p-3">
                      <p className="font-mono text-lg text-text" data-stat>
                        {value}
                      </p>
                      <p className="mt-0.5 text-[11px] text-text-muted">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-col">
                  {["Aisyah — stamp 7 of 10", "Ming Wei — reward redeemed", "Priya — joined your program"].map(
                    (row, i) => (
                      <div
                        key={row}
                        className="flex items-center gap-2 border-b border-border py-2.5 text-xs text-text-secondary"
                      >
                        <span
                          className={`size-1.5 rounded-full ${i === 1 ? "bg-accent" : "bg-leaf"}`}
                        />
                        {row}
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* glass activity cards floating over the panel */}
            <div aria-hidden className="glass backdrop-blur-md absolute left-3 top-24 z-10 rounded-xl px-3.5 py-2.5 sm:left-10">
              <p className="text-xs font-medium text-text">+1 stamp collected</p>
              <p className="mt-0.5 text-[11px] text-text-muted">Aisyah is 3 away from a free coffee</p>
            </div>
            <div aria-hidden className="glass backdrop-blur-md absolute right-3 top-40 z-10 rounded-xl px-3.5 py-2.5 sm:right-10">
              <p className="font-mono text-sm text-text">↗ 41%</p>
              <p className="mt-0.5 text-[11px] text-text-muted">repeat visits this month</p>
            </div>
          </div>
        </div>
      </section>

      {/* Scroll showcase: sticky phone, scenes change per chapter */}
      <section id="showcase" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-16">
          <Reveal>
            <p className="text-sm font-medium text-text-muted">The product</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-medium leading-tight tracking-[-0.02em] text-text sm:text-4xl">
              What your customers see, from first scan to free coffee.
            </h2>
          </Reveal>
          <FeatureShowcase />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-b border-border bg-surface-alt">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-16">
          <Reveal>
            <p className="text-sm font-medium text-text-muted">How it works</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-medium leading-tight tracking-[-0.02em] text-text sm:text-4xl">
              Easy for customers. Even easier for your staff.
            </h2>
          </Reveal>

          {/* Two receipts — the café's own paper, itemized */}
          <div className="mt-10 grid items-start gap-8 lg:grid-cols-2">
            <div className="flex flex-col items-center gap-10">
              <Reveal delay={80} className="flex w-full justify-center">
                <ReceiptCard
                  title="For your customers"
                  tilt="-rotate-1"
                  lines={[
                    { item: "Scan the QR at the counter", value: "5 sec" },
                    { item: "Card appears on their phone", value: "instant" },
                    { item: "Collect a stamp each visit", value: "+1" },
                    { item: "Free coffee on visit ten", value: "earned" },
                  ]}
                  total="One happy regular"
                />
              </Reveal>

              <Reveal delay={160} className="flex w-full justify-center">
                <ReceiptCard
                  title="For your staff"
                  tilt="rotate-1"
                  lines={[
                    { item: "Open the camera", value: "any phone" },
                    { item: "Scan the customer's QR", value: "3 sec" },
                    { item: "Enter the amount, stamp", value: "done" },
                  ]}
                  total="No training needed"
                />
              </Reveal>
            </div>

            <Reveal delay={240} className="flex justify-center lg:sticky lg:top-24">
              <DemoCard />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-16">
          <Reveal>
            <p className="text-sm font-medium text-text-muted">And there&apos;s more coming</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-medium leading-tight tracking-[-0.02em] text-text sm:text-4xl">
              Everything a loyalty program needs, nothing that slows your
              counter down.
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={(i % 2) * 70}>
                <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <span className={`size-2.5 rounded-full ${
                      feature.dot === "coral" ? "bg-accent" : feature.dot === "leaf" ? "bg-leaf" : "bg-primary"
                    }`} />
                    <span className="rounded-full border border-border px-3 py-0.5 text-xs font-medium text-text-muted">
                      {feature.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-medium tracking-[-0.01em] text-text">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary sm:text-base">
                    {feature.body}
                  </p>
                </div>
              </Reveal>
            ))}

            {/* the one tinted card */}
            <Reveal delay={140}>
              <div className="flex h-full flex-col gap-3 rounded-2xl bg-primary p-6 sm:p-8">
                <span className="size-2.5 rounded-full bg-accent" />
                <h3 className="text-xl font-medium tracking-[-0.01em] text-on-primary">
                  Your brand, not ours
                </h3>
                <p className="text-sm leading-relaxed text-on-primary/80 sm:text-base">
                  Your logo, your colors, your domain. Customers see your
                  brand — Kembali stays quietly behind the scenes.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Interactive reach-out */}
      <section id="reach-out" className="scroll-mt-20 bg-surface-alt">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-16">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-text-muted">Let&apos;s talk</p>
            <h2 className="mt-2 text-3xl font-medium leading-tight tracking-[-0.02em] text-text sm:text-4xl">
              Curious how it would look in your shop?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-text-secondary">
              Answer three quick questions and we&apos;ll sketch it out for
              you — no signup, no pressure.
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
