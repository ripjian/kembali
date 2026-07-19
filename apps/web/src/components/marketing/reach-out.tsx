"use client";

import { useState } from "react";

import { DemoCard } from "./demo-card";

/* Qualify with three quick questions, answer with a pitch written for the
 * shop that just answered, then hand over a card they can sketch and play
 * with. The email arrives already carrying their answers, so the first
 * reply can be about their shop instead of the basics. */

const CONTACT_EMAIL = "hello@kembali.app";

type QuestionId = "business" | "outlets" | "goal";
interface Option { id: string; label: string }
type Answers = Partial<Record<QuestionId, Option>>;
interface Question { id: QuestionId; eyebrow: string; prompt: string; options: Option[] }

const QUESTIONS: Question[] = [
  {
    id: "business",
    eyebrow: "Question 1 of 3",
    prompt: "What kind of shop do you run?",
    options: [
      { id: "cafe", label: "Cafe or coffee shop" },
      { id: "fnb", label: "Restaurant, bubble tea or dessert" },
      { id: "beauty", label: "Salon, barber or wellness" },
      { id: "other", label: "Gym, studio or something else" },
    ],
  },
  {
    id: "outlets",
    eyebrow: "Question 2 of 3",
    prompt: "How many outlets?",
    options: [
      { id: "one", label: "Just one" },
      { id: "few", label: "2 to 5" },
      { id: "many", label: "6 or more" },
      { id: "planning", label: "Not open yet, still planning" },
    ],
  },
  {
    id: "goal",
    eyebrow: "Question 3 of 3",
    prompt: "What would you like loyalty to do?",
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
  one: "Pricing is per outlet per month, and the pilot is free. One outlet keeps it simple and affordable.",
  few: "Each branch gets its own QR kit and staff accounts. Stamps and rewards work across all of them.",
  many: "Cross-outlet stamping, per-branch reporting and staff permissions are planned with chains like yours in mind.",
  planning:
    "Opening day is a lovely time to start. Launch with digital loyalty and skip paper entirely. The pilot is free while you set up.",
};

const GOAL_NOTE: Record<string, string> = {
  paper:
    "You could be live in an afternoon: set your stamp count and reward, print the QR kit, done. No app for customers, no hardware for staff.",
  retention:
    "Milestone rewards, birthday treats and warm win-back messages on WhatsApp are next on our roadmap. Every message is opt-in.",
  growth:
    "Referral rewards for both the sender and the friend are planned, and pilot merchants help shape how they work.",
  insight:
    "Simple reports show who keeps coming back and what they redeem, with deeper numbers planned. Pilot merchants see them first.",
};

/** A sensible starting colour per shop type, so the card the visitor
 *  sketches already feels a little like theirs. */
const DEFAULT_COLOR: Record<string, string> = {
  cafe: "#5b3a29",
  fnb: "#b03060",
  beauty: "#7a4ea3",
  other: "#1f6f8b",
};

const answerLabel = (answers: Answers, q: QuestionId) => answers[q]?.label ?? "-";

function buildMailto(answers: Answers, shop: string, reward: string, color: string) {
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
    `- Brand colour: ${color}`,
    "",
    "Keen to hear more. Here is how to reach me:",
    "",
  ].join("\n");
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function ReachOut() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [shop, setShop] = useState("");
  const [reward, setReward] = useState("");
  const [color, setColor] = useState("#101613");

  const question = QUESTIONS[step];

  const dots = (
    <div className="ro-dots" aria-hidden>
      {QUESTIONS.map((q, i) => (
        <span key={q.id} className={`ro-dot${i < step ? " on" : ""}`} />
      ))}
    </div>
  );

  if (question) {
    return (
      <div className="ro-card" key={step}>
        <div className="ro-head">
          <p className="ro-eyebrow mono">{question.eyebrow}</p>
          {dots}
        </div>
        <h3 className="ro-prompt">{question.prompt}</h3>
        <div className="ro-options">
          {question.options.map((o) => (
            <button
              key={o.id}
              type="button"
              className="ro-option"
              onClick={() => {
                setAnswers((prev) => ({ ...prev, [question.id]: o }));
                if (question.id === "business") setColor(DEFAULT_COLOR[o.id] ?? "#101613");
                setStep((s) => s + 1);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
        {step > 0 && (
          <button type="button" className="ro-back mono" onClick={() => setStep((s) => s - 1)}>
            Go back
          </button>
        )}
      </div>
    );
  }

  const businessId = answers.business?.id ?? "cafe";
  const outletsId = answers.outlets?.id ?? "one";
  const goalId = answers.goal?.id ?? "paper";

  return (
    <div className="ro-card ro-result">
      <div className="ro-head">
        <p className="ro-eyebrow mono">Your shop, on Kembali</p>
        <button
          type="button"
          className="ro-back mono"
          onClick={() => { setAnswers({}); setStep(0); }}
        >
          Start over
        </button>
      </div>

      <div className="ro-pitch">
        <p>{BUSINESS_PITCH[businessId]}</p>
        <p>{OUTLET_NOTE[outletsId]}</p>
        <p>{GOAL_NOTE[goalId]}</p>
      </div>

      <div className="ro-sketch">
        <div className="ro-fields">
          <p className="col-label mono">Sketch your card</p>
          <label className="ro-field">
            <span>Shop name</span>
            <input
              type="text"
              value={shop}
              placeholder="Corner Coffee"
              maxLength={28}
              onChange={(e) => setShop(e.target.value)}
            />
          </label>
          <label className="ro-field">
            <span>The tenth visit earns</span>
            <input
              type="text"
              value={reward}
              placeholder="a free coffee"
              maxLength={32}
              onChange={(e) => setReward(e.target.value)}
            />
          </label>
          <label className="ro-field ro-field-color">
            <span>Your colour</span>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </label>
        </div>

        <DemoCard
          shop={shop || "Corner Coffee"}
          reward={reward || "a free coffee"}
          accent={color}
          initial={8}
        />
      </div>

      <a className="btn btn-solid ro-send" href={buildMailto(answers, shop, reward, color)}>
        Send this to us
      </a>
      <p className="ro-note mono">
        Opens your email app with the answers filled in · {CONTACT_EMAIL}
      </p>
    </div>
  );
}
