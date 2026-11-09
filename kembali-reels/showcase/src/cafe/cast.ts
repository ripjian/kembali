// Who walks where, and when. Frames are tied to the Desire beat grid in Cafe.tsx.
import { plan, type AgentSpec, type Cell } from "./plan";

const bt = (k: number) => Math.round(5.52 + 17.295 * k);

export const POSTER: Cell = [15, 7];
export const CASHIER: Cell = [8, 6];
const EXIT: Cell = [-12, 15];

export const JOIN = bt(6);
export const STAMP1 = bt(11);
export const QUEUE = [bt(13), bt(14), bt(15)];
export const FULL = bt(16);
export const REDEEM = bt(20);

export const SEAT_NEW: [number, number] = [544, 336];
export const SEAT_REG: [number, number] = [194, 336];

export const AGENTS: AgentSpec[] = [
  { id: "newbie", spawn: [-3, 15], t0: 0, legs: [{ to: POSTER, after: 0 }, { to: CASHIER, after: bt(9) }, { to: [19, 11], after: bt(12) }], sit: { stool: SEAT_NEW } },
  { id: "q1", spawn: [-12, 15], t0: 72, legs: [{ to: [8, 7], after: 72 }, { to: CASHIER, after: bt(12) + 2 }, { to: EXIT, after: QUEUE[0] + 6 }], exit: true },
  { id: "q2", spawn: [-12, 16], t0: 84, legs: [{ to: [8, 8], after: 84 }, { to: [8, 7], after: bt(12) + 6 }, { to: CASHIER, after: QUEUE[0] + 8 }, { to: EXIT, after: QUEUE[1] + 6 }], exit: true },
  { id: "q3", spawn: [-12, 15], t0: 100, legs: [{ to: [8, 9], after: 100 }, { to: [8, 8], after: bt(12) + 10 }, { to: [8, 7], after: QUEUE[0] + 10 }, { to: CASHIER, after: QUEUE[1] + 8 }, { to: EXIT, after: QUEUE[2] + 6 }], exit: true },
  { id: "regular", spawn: [-12, 16], t0: 150, legs: [{ to: [8, 8], after: 150 }, { to: [8, 7], after: QUEUE[1] + 10 }, { to: CASHIER, after: QUEUE[2] + 8 }, { to: [7, 11], after: REDEEM + 6 }], sit: { stool: SEAT_REG } },
];

export const TRACKS = plan(AGENTS);
