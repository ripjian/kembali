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
    eyebrow: "1 of 3 — your business",
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
    eyebrow: "2 of 3 — your outlets",
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
    eyebrow: "3 of 3 — your goal",
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
  cafe: "Your regulars would get a digital card from a QR at the counter, and your barista stamps it with any phone camera in under 3 seconds. No queue, no fuss.",
  fnb: "Customers join from a table or counter QR in under 30 seconds, and staff stamp with any phone. Your counter stays fast, your regulars feel remembered.",
  beauty: "Salon visits are weeks apart — exactly how paper cards get lost. A digital card stays on your client's phone, and a friendly reminder brings quiet clients back.",
  other: "Kembali works anywhere customers visit repeatedly — gyms, studios, workshops. Members keep their card on their phone and redeem rewards in person.",
};

const OUTLET_NOTE: Record<string, string> = {
  one: "Pricing is per outlet per month, and the trial is free. One outlet keeps it simple and affordable.",
  few: "Each branch gets its own QR kit and staff accounts. Stamps and rewards work across all of them.",
  many: "Cross-outlet stamping, per-branch reporting and staff permissions are planned with chains like yours in mind.",
  planning: "Opening day is a lovely time to start — launch with digital loyalty and skip paper entirely. The trial is free while you set up.",
};

const GOAL_NOTE: Record<string, string> = {
  paper: "You could be live in an afternoon: set your stamp count and reward, print the QR kit, done. No app for customers, no hardware for staff.",
  retention: "Milestone rewards, birthday treats and warm win-back messages on WhatsApp are next on our roadmap. Every message is opt-in.",
  growth: "Referral rewards for both the sender and the friend are coming — and pilot merchants help shape how they work.",
  insight: "Simple reports show who keeps coming back and what they redeem — with deeper insights planned. Pilot merchants see them first.",
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

  return (
    <div className="step-in panel-ring mx-auto w-full max-w-xl rounded-2xl border border-border bg-surface p-6 sm:p-8">
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
        <p>{BUSINESS_PITCH[answers.business?.id ?? "other"]}</p>
        <p>{OUTLET_NOTE[answers.outlets?.id ?? "one"]}</p>
        <p>{GOAL_NOTE[answers.goal?.id ?? "paper"]}</p>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <a
          href={buildMailto(answers)}
          className="press inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-on-primary shadow-[0_1px_2px_rgb(0_0_0/0.05)] hover:bg-primary-hover"
        >
          Email us your answers
        </a>
        <button
          type="button"
          onClick={restart}
          className="press inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-5 text-sm font-medium text-text hover:bg-surface-alt"
        >
          Start over
        </button>
      </div>

      <p className="mt-4 text-xs text-text-muted">
        Your answers are prefilled into the email. Nothing is sent or stored
        until you send it.
      </p>
    </div>
  );
}
