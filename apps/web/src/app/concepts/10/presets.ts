/* Pure data + pricing math for the conversational landing. No React, no
 * side effects, so both the server default render and the client enhancement
 * read from the same source. Pricing follows the real Founding plan: RM99 per
 * outlet per month, with the genuine "5 outlets or more get 20% off" rule. */

export interface ShopType {
  id: string;
  label: string; // as it reads in a chip
  audience: string; // "cafe regulars"
  card: string; // "Coffee Card"
  reward: string; // reward line on the example card
  visits: number; // stamps to the reward
}

export const SHOP_TYPES: ShopType[] = [
  { id: "cafe", label: "Cafe", audience: "cafe regulars", card: "Coffee Card", reward: "Free coffee on visit 10", visits: 10 },
  { id: "bubbletea", label: "Bubble tea", audience: "bubble tea regulars", card: "Bubble Tea Card", reward: "Free drink on visit 10", visits: 10 },
  { id: "salon", label: "Salon", audience: "salon clients", card: "Visit Card", reward: "Free treatment on visit 6", visits: 6 },
  { id: "bakery", label: "Bakery", audience: "bakery regulars", card: "Bakery Card", reward: "Free bake on visit 10", visits: 10 },
];

export interface Goal {
  id: string;
  label: string;
  phrase: string; // "keep coming back"
}

export const GOALS: Goal[] = [
  { id: "regulars", label: "Bring regulars back", phrase: "keep your regulars coming back" },
  { id: "referrals", label: "Grow by referrals", phrase: "grow by word of mouth" },
  { id: "rewards", label: "Reward every visit", phrase: "reward every visit" },
];

export interface OutletChoice {
  id: string;
  label: string;
  count: number;
}

export const OUTLETS: OutletChoice[] = [
  { id: "one", label: "1 outlet", count: 1 },
  { id: "three", label: "3 outlets", count: 3 },
  { id: "five", label: "5+ outlets", count: 5 },
];

export const RM_PER_OUTLET = 99; // Founding plan, per outlet per month
const MULTI_OUTLET_DISCOUNT = 0.2; // 5 outlets or more

/** Personalized monthly figure and the arithmetic shown plainly. */
export function priceFor(count: number): { total: number; math: string; note: string } {
  if (count >= 5) {
    const total = Math.round(RM_PER_OUTLET * count * (1 - MULTI_OUTLET_DISCOUNT));
    return {
      total,
      math: `${count} outlets, 20% off: RM${total} a month`,
      note: "Five outlets or more get 20% off.",
    };
  }
  const total = RM_PER_OUTLET * count;
  return {
    total,
    math: count === 1 ? `1 outlet: RM${total} a month` : `${count} outlets × RM${RM_PER_OUTLET} = RM${total} a month`,
    note: "Founding price, locked for 12 months.",
  };
}

export const DEFAULTS = { shop: "cafe", outlet: "one", goal: "regulars" } as const;
