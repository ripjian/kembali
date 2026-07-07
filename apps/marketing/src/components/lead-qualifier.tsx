"use client";

import { useState } from "react";

/* The interactive reach-out section: three multiple-choice questions narrow
 * down the business and what they need, then we answer with a tailored
 * pitch and a prefilled email. v1 contact channel is email — swap in
 * WhatsApp + a real inbox integration when they exist. */

const CONTACT_EMAIL = "hello@kembali.app";

type QuestionId = "business" | "outlets" | "goal";

interface Option {
  id: string;
  label: string;
}

interface Question {
  id: QuestionId;
  eyebrow: string;
  prompt: string;
  options: Option[];
}

const QUESTIONS: Question[] = [
  {
    id: "business",
    eyebrow: "01 / 03 — Your business",
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
    eyebrow: "02 / 03 — Your outlets",
    prompt: "How many outlets do you have?",
    options: [
      { id: "one", label: "Just one" },
      { id: "few", label: "2 to 5" },
      { id: "many", label: "6 or more" },
      { id: "planning", label: "Not open yet — still planning" },
    ],
  },
  {
    id: "goal",
    eyebrow: "03 / 03 — Your goal",
    prompt: "What matters most to you right now?",
    options: [
      { id: "paper", label: "Replace paper stamp cards" },
      { id: "retention", label: "Bring customers back more often" },
      { id: "growth", label: "Grow with referrals & campaigns" },
      { id: "insight", label: "See loyalty numbers across outlets" },
    ],
  },
];

const BUSINESS_PITCH: Record<string, string> = {
  cafe: "Cafés are where stamp cards were born. Kembali turns yours digital — every regular gets a card on their phone from a QR at the counter, and your barista stamps it with any phone camera in under 3 seconds.",
  fnb: "For F&B, speed at the counter is everything. Your customers join from a table or counter QR in under 30 seconds, and staff stamp with any phone — no hardware, no queue built up.",
  beauty: "For salons and wellness, visits are weeks apart — exactly when paper cards get lost. A card on their phone survives every handbag change, and win-back nudges bring quiet clients back.",
  other: "Kembali works anywhere visits repeat — gyms, studios, workshops. If your customers come back, they deserve a card that can't be lost and rewards that redeem themselves.",
};

const OUTLET_NOTE: Record<string, string> = {
  one: "Pricing is per outlet per month with a free trial — one outlet keeps it simple and cheap.",
  few: "Each branch gets its own QR kit and staff accounts; stamps and rewards work across all of them.",
  many: "Multi-outlet reporting, per-branch staff permissions and cross-outlet stamping are exactly what our analytics phase is built for.",
  planning: "Starting fresh is the best time — launch day one with digital loyalty and skip paper entirely. The free trial means you pay nothing until doors open.",
};

const GOAL_NOTE: Record<string, string> = {
  paper: "You'd be live in an afternoon: set your stamp count and reward, print the QR kit, done — no app for customers, no hardware for staff.",
  retention: "Milestone rewards, birthday treats and \"we miss you\" nudges (WhatsApp-first, opt-in) are the retention engine we're building right after the core card.",
  growth: "Referral links that reward both sides plus campaign tools are on the roadmap right behind the MVP — you'd shape them as a pilot merchant.",
  insight: "Repeat-visit rate, member share of sales and per-branch numbers land in our analytics phase — pilots get them first.",
};

function answerLabel(answers: Answers, q: QuestionId): string {
  return answers[q]?.label ?? "—";
}

type Answers = Partial<Record<QuestionId, Option>>;

function buildMailto(answers: Answers): string {
  const subject = `Kembali pilot — ${answerLabel(answers, "business")}`;
  const body = [
    "Hi Kembali,",
    "",
    "I went through the questions on your site:",
    `- Business: ${answerLabel(answers, "business")}`,
    `- Outlets: ${answerLabel(answers, "outlets")}`,
    `- Looking for: ${answerLabel(answers, "goal")}`,
    "",
    "Keen to hear more — here's how to reach me:",
    "",
  ].join("\n");
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function LeadQualifier() {
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

  /* Progress dots — filled = answered */
  const dots = (
    <div className="flex items-center gap-2" aria-hidden>
      {QUESTIONS.map((q, i) => (
        <span
          key={q.id}
          className={
            i < step
              ? "size-2 rounded-full bg-primary"
              : "size-2 rounded-full border border-text-muted"
          }
        />
      ))}
    </div>
  );

  if (question) {
    return (
      <div
        key={step}
        className="step-in mx-auto w-full max-w-2xl rounded-[40px] border border-border bg-surface p-8 sm:p-10"
      >
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-xs uppercase tracking-tight text-text-muted">
            {question.eyebrow}
          </p>
          {dots}
        </div>

        <h3 className="mt-4 font-serif text-2xl font-normal tracking-tight text-text sm:text-[32px] sm:leading-tight">
          {question.prompt}
        </h3>

        <div className="mt-8 flex flex-col gap-3">
          {question.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => choose(option)}
              className="press flex w-full items-center justify-between gap-4 rounded-full border border-border bg-bg px-6 py-4 text-left font-mono text-sm text-text transition-colors hover:border-primary hover:bg-surface-alt"
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
            className="mt-6 font-mono text-xs uppercase tracking-tight text-text-muted hover:text-text"
          >
            ← Back
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="step-in mx-auto w-full max-w-2xl rounded-[40px] border border-border bg-surface-alt p-8 sm:p-10">
      <div className="flex flex-wrap gap-2">
        {QUESTIONS.map((q) => (
          <span
            key={q.id}
            className="rounded-full border border-border bg-bg px-4 py-1.5 font-mono text-xs uppercase tracking-tight text-text-secondary"
          >
            {answerLabel(answers, q.id)}
          </span>
        ))}
      </div>

      <h3 className="mt-6 font-serif text-2xl font-normal tracking-tight text-text sm:text-[32px] sm:leading-tight">
        Here&apos;s how Kembali fits you.
      </h3>

      <div className="mt-4 flex flex-col gap-3 font-mono text-sm leading-relaxed text-text-secondary sm:text-base">
        <p>{BUSINESS_PITCH[answers.business?.id ?? "other"]}</p>
        <p>{OUTLET_NOTE[answers.outlets?.id ?? "one"]}</p>
        <p>{GOAL_NOTE[answers.goal?.id ?? "paper"]}</p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href={buildMailto(answers)}
          className="press inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 font-mono text-sm uppercase tracking-tight text-on-primary hover:bg-primary-hover"
        >
          Email us — we reply fast ▸
        </a>
        <button
          type="button"
          onClick={restart}
          className="press inline-flex h-12 items-center justify-center rounded-full border border-text px-8 font-mono text-sm uppercase tracking-tight text-text hover:bg-bg"
        >
          Start over ↺
        </button>
      </div>

      <p className="mt-4 font-mono text-xs text-text-muted">
        Your answers are prefilled into the email — nothing is sent or stored
        until you hit send.
      </p>
    </div>
  );
}
