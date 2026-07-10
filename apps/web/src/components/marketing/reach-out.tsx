"use client";

import { useState } from "react";

import { deriveTenantTheme } from "@kembali/core";

/* The reach-out flow: qualify with three quick questions, answer with a
 * tailored pitch, then let the visitor play with a live card simulator
 * pre-seeded from their answers. The simulator derives its colours with the
 * same @kembali/core maths the customer app uses, so the preview matches
 * production. Contact is email (contact-to-invoice, no signup). */

const CONTACT_EMAIL = "hello@kembali.app";

type QuestionId = "business" | "outlets" | "goal";

interface Option {
  id: string;
  label: string;
}
type Answers = Partial<Record<QuestionId, Option>>;

interface Question {
  id: QuestionId;
  eyebrow: string;
  prompt: string;
  options: Option[];
}

const QUESTIONS: Question[] = [
  {
    id: "business",
    eyebrow: "1 of 3 · your business",
    prompt: "What kind of business do you run?",
    options: [
      { id: "cafe", label: "Café or coffee shop" },
      { id: "fnb", label: "Restaurant, bubble tea or dessert" },
      { id: "beauty", label: "Salon, barber or wellness" },
      { id: "other", label: "Gym, studio or something else" },
    ],
  },
  {
    id: "outlets",
    eyebrow: "2 of 3 · your outlets",
    prompt: "How many outlets do you have?",
    options: [
      { id: "one", label: "Just one" },
      { id: "few", label: "2 to 5" },
      { id: "many", label: "6 or more" },
      { id: "planning", label: "Not open yet, still planning" },
    ],
  },
  {
    id: "goal",
    eyebrow: "3 of 3 · your goal",
    prompt: "What matters most to you right now?",
    options: [
      { id: "paper", label: "Replace paper stamp cards" },
      { id: "retention", label: "See more familiar faces" },
      { id: "growth", label: "Grow through word of mouth" },
      { id: "insight", label: "Understand my regulars better" },
    ],
  },
];

const BUSINESS_PITCH: Record<string, string> = {
  cafe: "Your regulars get a digital card from a QR at the counter, and your barista stamps it with any phone camera in under 3 seconds. No queue, no fuss.",
  fnb: "Customers join from a table or counter QR in under 30 seconds, and staff stamp with any phone. Your counter stays fast, your regulars feel remembered.",
  beauty:
    "Salon visits are weeks apart, which is exactly how paper cards get lost. A digital card stays on your client's phone, and a friendly reminder brings quiet clients back.",
  other:
    "Kembali works anywhere customers visit repeatedly, from gyms to studios to workshops. Members keep their card on their phone and redeem rewards in person.",
};

const OUTLET_NOTE: Record<string, string> = {
  one: "Pricing is per outlet per month, and the trial is free. One outlet keeps it simple and affordable.",
  few: "Each branch gets its own QR kit and staff accounts. Stamps and rewards work across all of them.",
  many: "Cross-outlet stamping, per-branch reporting and staff permissions are planned with chains like yours in mind.",
  planning:
    "Opening day is a lovely time to start. Launch with digital loyalty and skip paper entirely. The trial is free while you set up.",
};

const GOAL_NOTE: Record<string, string> = {
  paper: "You could be live in an afternoon: set your stamp count and reward, print the QR kit, done. No app for customers, no hardware for staff.",
  retention:
    "Milestone rewards, birthday treats and warm win-back messages on WhatsApp are next on our roadmap. Every message is opt-in.",
  growth:
    "Referral rewards for both the sender and the friend are coming, and pilot merchants help shape how they work.",
  insight:
    "Simple reports show who keeps coming back and what they redeem, with deeper insights planned. Pilot merchants see them first.",
};

// A sensible starting brand colour per business type, so the pre-seeded
// simulator already feels like the visitor's shop.
const DEFAULT_COLOR: Record<string, string> = {
  cafe: "#5b3a29", // coffee brown
  fnb: "#b03060", // berry
  beauty: "#7a4ea3", // plum
  other: "#1f6f8b", // ocean
};

function answerLabel(answers: Answers, q: QuestionId): string {
  return answers[q]?.label ?? "-";
}

function buildMailto(answers: Answers, shop: string, reward: string, color: string): string {
  const name = shop.trim() || answerLabel(answers, "business");
  const subject = `Kembali for ${name}`;
  const body = [
    "Hi Kembali,",
    "",
    "I went through the questions on your site:",
    `- Business: ${answerLabel(answers, "business")}`,
    `- Outlets: ${answerLabel(answers, "outlets")}`,
    `- Looking for: ${answerLabel(answers, "goal")}`,
    "",
    "And I sketched a card:",
    `- Shop name: ${shop.trim() || "(not set)"}`,
    `- Reward: ${reward.trim() || "a free coffee"}`,
    `- Brand color: ${color}`,
    "",
    "Keen to hear more. Here's how to reach me:",
    "",
  ].join("\n");
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function ReachOut() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const question = QUESTIONS[step];

  function choose(option: Option) {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: option }));
    setStep((s) => s + 1);
  }

  function restart() {
    setAnswers({});
    setStep(0);
  }

  const dots = (
    <div className="flex items-center gap-1.5" aria-hidden>
      {QUESTIONS.map((q, i) => (
        <span
          key={q.id}
          className={
            i < step
              ? "size-1.5 rounded-full bg-primary"
              : "size-1.5 rounded-full border border-text-muted"
          }
        />
      ))}
    </div>
  );

  if (question) {
    return (
      <div
        key={step}
        className="step-in panel-ring mx-auto w-full max-w-xl rounded-2xl border border-border bg-surface p-6 sm:p-8"
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-medium text-text-muted">{question.eyebrow}</p>
          {dots}
        </div>

        <h3 className="mt-3 text-xl font-medium tracking-[-0.01em] text-text sm:text-2xl">
          {question.prompt}
        </h3>

        <div className="mt-6 flex flex-col gap-2">
          {question.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => choose(option)}
              className="press flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3.5 text-left text-sm font-medium text-text transition-colors hover:border-smoke hover:bg-surface-alt"
            >
              <span>{option.label}</span>
              <span aria-hidden className="text-text-muted">
                →
              </span>
            </button>
          ))}
        </div>

        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="mt-5 text-xs font-medium text-text-muted hover:text-text"
          >
            ← Back
          </button>
        )}
      </div>
    );
  }

  const businessId = answers.business?.id ?? "cafe";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="step-in panel-ring rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap gap-1.5">
          {QUESTIONS.map((q) => (
            <span
              key={q.id}
              className="rounded-full border border-border bg-surface-alt px-3 py-1 text-xs font-medium text-text-secondary"
            >
              {answerLabel(answers, q.id)}
            </span>
          ))}
        </div>

        <h3 className="mt-5 text-xl font-medium tracking-[-0.01em] text-text sm:text-2xl">
          Kembali would fit right in.
        </h3>

        <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-text-secondary sm:text-base">
          <p>{BUSINESS_PITCH[businessId]}</p>
          <p>{OUTLET_NOTE[answers.outlets?.id ?? "one"]}</p>
          <p>{GOAL_NOTE[answers.goal?.id ?? "paper"]}</p>
        </div>

        <button
          type="button"
          onClick={restart}
          className="press mt-5 text-xs font-medium text-text-muted hover:text-text"
        >
          ← Start over
        </button>
      </div>

      {/* The live simulator, pre-seeded from the quiz */}
      <ShopSimulator
        answers={answers}
        defaultPrimary={DEFAULT_COLOR[businessId] ?? "#0f3d32"}
      />
    </div>
  );
}

const SWATCHES = [
  { name: "Pandan", value: "#0f3d32" },
  { name: "Coffee", value: "#5b3a29" },
  { name: "Berry", value: "#b03060" },
  { name: "Plum", value: "#7a4ea3" },
  { name: "Ocean", value: "#1f6f8b" },
  { name: "Coral", value: "#c8502f" },
];

const FILLED = 4;
const TOTAL = 10;
const CARD_SURFACE = "#ffffff";

function ShopSimulator({
  answers,
  defaultPrimary,
}: {
  answers: Answers;
  defaultPrimary: string;
}) {
  const [shop, setShop] = useState("");
  const [reward, setReward] = useState("");
  const [color, setColor] = useState(defaultPrimary);

  const shopName = shop.trim() || "Your shop";
  const rewardName = reward.trim() || "a free coffee";
  // Same derivation as the customer app: on-colours stay legible on any pick.
  const theme = deriveTenantTheme(color, color, CARD_SURFACE);

  const swatches = SWATCHES.some((s) => s.value === defaultPrimary)
    ? SWATCHES
    : [{ name: "Suggested", value: defaultPrimary }, ...SWATCHES];

  return (
    <div className="step-in panel-ring grid gap-8 rounded-2xl border border-border bg-surface p-6 sm:p-8 lg:grid-cols-2 lg:items-center">
      <div className="flex flex-col gap-5">
        <p className="text-sm font-medium text-text">
          Now make it yours. It updates as you type.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-secondary">Shop name</span>
          <input
            type="text"
            value={shop}
            maxLength={28}
            onChange={(e) => setShop(e.target.value)}
            placeholder="Corner Coffee"
            className="h-11 rounded-lg border border-smoke bg-surface px-3.5 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-secondary">
            Reward for a full card
          </span>
          <input
            type="text"
            value={reward}
            maxLength={32}
            onChange={(e) => setReward(e.target.value)}
            placeholder="A free coffee"
            className="h-11 rounded-lg border border-smoke bg-surface px-3.5 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-text-secondary">Brand color</span>
          <div className="flex flex-wrap items-center gap-2">
            {swatches.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setColor(s.value)}
                aria-label={s.name}
                aria-pressed={color === s.value}
                style={{ backgroundColor: s.value }}
                className={`press size-8 rounded-full transition-transform ${
                  color === s.value
                    ? "ring-2 ring-text ring-offset-2 ring-offset-surface"
                    : ""
                }`}
              />
            ))}
            <label className="press grid size-8 cursor-pointer place-items-center rounded-full border border-dashed border-smoke text-xs text-text-muted">
              +
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        <a
          href={buildMailto(answers, shop, reward, color)}
          className="press inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-on-primary shadow-[0_1px_2px_rgb(0_0_0/0.05)] hover:bg-primary-hover"
        >
          Send it to us
        </a>
        <p className="text-xs text-text-muted">
          Your answers and this card are prefilled into the email. Nothing is
          sent or stored until you send it.
        </p>
      </div>

      {/* Live card, coloured with the same maths the customer app uses */}
      <div className="flex justify-center">
        <div className="w-full max-w-xs overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ backgroundColor: theme.primary }}
          >
            <span
              className="grid size-9 place-items-center rounded-lg text-sm font-semibold"
              style={{ backgroundColor: "rgb(255 255 255 / 0.2)", color: theme.onPrimary }}
            >
              {shopName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: theme.onPrimary }}>
                {shopName}
              </p>
              <p className="text-[11px]" style={{ color: theme.onPrimary, opacity: 0.75 }}>
                Loyalty card
              </p>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-semibold text-text">Stamp card</p>
              <p className="font-mono text-[11px] text-text-muted tabular-nums">
                {FILLED}/{TOTAL}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {Array.from({ length: TOTAL }, (_, i) => (
                <span
                  key={i}
                  style={i < FILLED ? { backgroundColor: theme.primary } : undefined}
                  className={
                    i < FILLED
                      ? "aspect-square w-full rounded-full"
                      : "aspect-square w-full rounded-full border-2 border-dashed border-border"
                  }
                />
              ))}
            </div>
            <p className="mt-4 text-xs" style={{ color: theme.primaryText }}>
              Collect {TOTAL} stamps to get {rewardName.toLowerCase()}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
