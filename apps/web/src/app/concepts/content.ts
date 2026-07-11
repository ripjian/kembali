/* Shared, canonical Kembali marketing facts for the design-exploration
 * concepts (/concepts/1..5). One source so five very different layouts stay
 * factually identical. Copy follows BRAND.md §5 + SOP 3 + stop-slop:
 * English only, sentence case, no em dashes, no AI-tell vocabulary, concrete
 * numbers over vague claims. "Kembali" is the brand name only, never a word.
 *
 * This module has no route (it is not a page/layout/route file). It is
 * imported by the concept pages, which each style these facts differently. */

export const HERO = {
  eyebrow: "Digital loyalty for local shops",
  title: "Loyalty cards your customers never lose",
  sub: "Kembali puts your stamp card on your customers' phones. They join in 30 seconds from a QR at your counter, and every visit brings them closer to their next reward.",
  primaryCta: "Become a founding merchant",
  secondaryCta: "See how it works",
} as const;

/** Four fast facts. Coral = earned, so the reward line carries the coral role. */
export const FAST_FACTS = [
  { value: "30 sec", label: "to join, from a QR" },
  { value: "3 sec", label: "to stamp, on any phone" },
  { value: "No app", label: "for your customers" },
  { value: "No hardware", label: "for your shop" },
] as const;

export const CUSTOMER_STEPS = [
  { step: "Scan the QR at the counter", detail: "5 sec" },
  { step: "Card appears on their phone", detail: "instant" },
  { step: "Collect a stamp each visit", detail: "+1" },
  { step: "Free coffee on visit ten", detail: "earned" },
] as const;

export const STAFF_STEPS = [
  { step: "Open the camera", detail: "any phone" },
  { step: "Scan the customer's QR", detail: "3 sec" },
  { step: "Enter the amount, stamp", detail: "done" },
] as const;

/** The one proof moment. Real seed shop, real dashboard numbers. */
export const PROOF = {
  shop: "Corner Coffee",
  caption: "Today at your counter",
  stats: [
    { label: "Stamps", value: "128" },
    { label: "Signups", value: "24" },
    { label: "Redemptions", value: "9" },
    { label: "Repeat visits", value: "41%" },
  ],
  activity: [
    { who: "Aisyah", what: "stamp 7 of 10", kind: "progress" as const },
    { who: "Ming Wei", what: "reward redeemed", kind: "reward" as const },
    { who: "Priya", what: "joined your program", kind: "progress" as const },
  ],
} as const;

export const FEATURES = [
  {
    role: "earn" as const,
    title: "Points and rewards",
    body: "Every ringgit spent earns points. Customers redeem them for rewards you choose, with a single-use code at your counter.",
    tag: "At launch",
  },
  {
    role: "progress" as const,
    title: "Simple reports, not homework",
    body: "Today's stamps, signups and redemptions, plus who keeps coming back. Simple numbers to check over morning coffee.",
    tag: "At launch",
  },
  {
    role: "act" as const,
    title: "Your brand, not ours",
    body: "Your logo and your colors on every card. Customers see your brand. Kembali stays quietly in the background.",
    tag: "At launch",
  },
  {
    role: "act" as const,
    title: "WhatsApp campaigns",
    body: "Birthday rewards, expiry reminders and friendly win-back offers. Every message is opt-in, as PDPA requires.",
    tag: "Planned",
  },
] as const;

export const PRICING = {
  teaser: "One price per outlet, per month. Start free for 30 days, no card needed. We invoice you after the pilot.",
  plans: [
    {
      id: "founding",
      name: "Founding merchant",
      price: "RM99",
      unit: "/ outlet / month",
      badge: "Available now",
      featured: true,
      blurb: "For the first 20 shops. Every feature as it ships, price locked for 12 months.",
    },
    {
      id: "starter",
      name: "Starter",
      price: "RM149",
      unit: "/ outlet / month",
      badge: "At launch",
      featured: false,
      blurb: "Everything a growing shop needs to run a loyalty program.",
    },
    {
      id: "growth",
      name: "Growth",
      price: "RM279",
      unit: "/ outlet / month",
      badge: "At launch",
      featured: false,
      blurb: "For shops ready to bring customers back and grow by word of mouth.",
    },
  ],
} as const;

export const CTA = {
  title: "Start with your first 20 customers",
  body: "Join the founding merchants shaping Kembali. Thirty days free, then RM99 a month locked for a year. No card to start.",
  button: "Become a founding merchant",
  reassurance: "Free data export on every plan, forever.",
} as const;

/** One-line style label per concept, used on the /concepts index. */
export const CONCEPTS = [
  { n: 1, path: "/concepts/1", name: "Kopitiam skeuomorphism", label: "A paper stamp card on a marble tabletop, pressed by a rubber stamp." },
  { n: 2, path: "/concepts/2", name: "Dark glassmorphism", label: "Deep pandan night, frosted glass, coral glow, a wallet pass in layers." },
  { n: 3, path: "/concepts/3", name: "Motion scrollytelling", label: "The scan-to-reward journey plays out as you scroll." },
  { n: 4, path: "/concepts/4", name: "Neo-brutalist poster", label: "Massive type, hard borders, flat coral and pandan blocks." },
  { n: 5, path: "/concepts/5", name: "Editorial zine", label: "Serif-led newspaper layout with halftone and generous whitespace." },
] as const;
