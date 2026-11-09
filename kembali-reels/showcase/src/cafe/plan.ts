// Walk planner for the café reel. The floor is a grid of 30-unit tiles; customers
// move tile to tile (4-way, like the floor pattern), one tile per STEP frames.
// Cooperative space-time A*: each leg is planned against every reservation made so
// far, and an agent only "arrives" if it can stand on the goal until it leaves.
// Pure module (no Remotion imports) so it can be checked from the command line.

export const STEP = 4; // frames per tile
export const CELL = 30;
const TMAX = 175; // time steps (700 frames)

export type Cell = [number, number];
export const cellXY = ([cx, cy]: Cell): [number, number] => [cx * CELL + CELL / 2, cy * CELL + CELL / 2];

// furniture footprints (world units)
export const TABLES: [number, number][] = [
  [150, 330],
  [330, 440],
  [500, 330],
];
const BLOCKS: [number, number, number, number][] = [
  ...TABLES.map(([x, y]) => [x - 72, y - 64, x + 72, y + 64] as [number, number, number, number]),
  [560, 460, 620, 520], // plant
];

export const blocked = ([cx, cy]: Cell) => {
  if (cy < 0 || cy > 18 || cx > 19 || cx < -12) return true;
  if (cx < 0) return !(cy === 15 || cy === 16); // porch and doorway
  const [x, y] = cellXY([cx, cy]);
  if (y < 172) return true; // counter and staff zone
  // hidden behind the partition (x 620–640, y 0–260): the sight line toward the
  // viewer (+x, +y) hits the wall when x - y >= 360; keep a tile of margin
  if (y < 290 && x - y >= 330) return true;
  return BLOCKS.some(([x0, y0, x1, y1]) => x > x0 && x < x1 && y > y0 && y < y1);
};

export type Leg = { to: Cell; after: number; hold?: number }; // depart no earlier than `after` (frame); stand until the next leg
export type AgentSpec = { id: string; spawn: Cell; t0: number; legs: Leg[]; exit?: boolean; sit?: { stool: [number, number] } };
export type Track = { id: string; cells: Cell[]; t0: number; tEnd: number; exit: boolean; sit?: { stool: [number, number]; at: number } };

const key = (c: Cell) => `${c[0]},${c[1]}`;

export const plan = (agents: AgentSpec[], isBlocked: (c: Cell) => boolean = blocked): Track[] => {
  const occ: Map<string, string>[] = Array.from({ length: TMAX + 2 }, () => new Map());
  const where: Map<string, Cell>[] = Array.from({ length: TMAX + 2 }, () => new Map());
  const reserve = (c: Cell, t: number, id: string) => {
    if (t >= 0 && t <= TMAX + 1) {
      occ[t].set(key(c), id);
      where[t].set(id, c);
    }
  };
  // people passing must stay a shoulder apart mid-step, not just on tile centres
  const tooClose = (from: Cell, to: Cell, t: number, id: string) => {
    const mx = (from[0] + to[0]) / 2;
    const my = (from[1] + to[1]) / 2;
    for (const [o, a] of where[t]) {
      if (o === id) continue;
      const b = where[t + 1]?.get(o) ?? a;
      const d = Math.hypot(mx - (a[0] + b[0]) / 2, my - (a[1] + b[1]) / 2);
      if (d < 0.95) return true;
    }
    return false;
  };
  const freeAt = (c: Cell, t: number, id: string) => {
    if (t > TMAX + 1) return true;
    const o = occ[t].get(key(c));
    return o === undefined || o === id;
  };

  // per agent: list of cells, one per time step from t0
  const tracks = new Map<string, { cells: Cell[]; t0: number }>();
  agents.forEach((a) => {
    const t0 = Math.round(a.t0 / STEP);
    tracks.set(a.id, { cells: [a.spawn], t0 });
    reserve(a.spawn, t0, a.id);
  });

  // flatten legs and plan them in departure order
  const jobs = agents.flatMap((a) => a.legs.map((l, i) => ({ a, l, i }))).sort((p, q) => p.l.after - q.l.after);
  for (const { a, l, i } of jobs) {
    const tr = tracks.get(a.id)!;
    const now = tr.t0 + tr.cells.length - 1;
    const cur = tr.cells[tr.cells.length - 1];
    const depart = Math.max(now, Math.ceil(l.after / STEP));
    // wait in place until departure
    for (let t = now + 1; t <= depart; t++) {
      tr.cells.push(cur);
      reserve(cur, t, a.id);
    }
    const next = a.legs[i + 1];
    const last = i === a.legs.length - 1;
    const holdUntil = next ? Math.ceil(next.after / STEP) : last && a.exit ? 0 : depart + 3;

    // A* over (cell, t)
    type N = { c: Cell; t: number; g: number; f: number; p?: N };
    const h = (c: Cell) => Math.abs(c[0] - l.to[0]) + Math.abs(c[1] - l.to[1]);
    const open: N[] = [{ c: cur, t: depart, g: 0, f: h(cur) }];
    const seen = new Set<string>();
    let found: N | undefined;
    while (open.length) {
      open.sort((p, q) => p.f - q.f || q.g - p.g);
      const n = open.shift()!;
      const sk = `${key(n.c)}@${n.t}`;
      if (seen.has(sk)) continue;
      seen.add(sk);
      if (n.c[0] === l.to[0] && n.c[1] === l.to[1]) {
        let ok = true;
        for (let t = n.t; t <= holdUntil; t++) if (!freeAt(n.c, t, a.id)) ok = false;
        if (ok) {
          found = n;
          break;
        }
      }
      if (n.t >= TMAX) continue;
      const moves: Cell[] = [n.c, [n.c[0] + 1, n.c[1]], [n.c[0] - 1, n.c[1]], [n.c[0], n.c[1] + 1], [n.c[0], n.c[1] - 1]];
      for (const m of moves) {
        if (isBlocked(m)) continue;
        if (!freeAt(m, n.t + 1, a.id)) continue;
        // no swapping through each other
        const o1 = occ[n.t].get(key(m));
        const o2 = occ[n.t + 1]?.get(key(n.c));
        if (o1 && o1 !== a.id && o1 === o2) continue;
        if (tooClose(n.c, m, n.t, a.id)) continue;
        open.push({ c: m, t: n.t + 1, g: n.g + 1, f: n.g + 1 + h(m), p: n });
      }
    }
    if (!found) throw new Error(`no path for ${a.id} leg ${i}`);
    const path: N[] = [];
    for (let n: N | undefined = found; n && n.t > depart; n = n.p) path.unshift(n);
    for (const n of path) {
      tr.cells.push(n.c);
      reserve(n.c, n.t, a.id);
    }
    const arrive = found.t;
    for (let t = arrive + 1; t <= holdUntil; t++) {
      tr.cells.push(l.to);
      reserve(l.to, t, a.id);
    }
  }

  return agents.map((a) => {
    const tr = tracks.get(a.id)!;
    // trim trailing duplicate holds past the last planned step for exits
    const tEnd = tr.t0 + tr.cells.length - 1;
    const arrive = (() => {
      const lastCell = tr.cells[tr.cells.length - 1];
      let k = tr.cells.length - 1;
      while (k > 0 && tr.cells[k - 1][0] === lastCell[0] && tr.cells[k - 1][1] === lastCell[1]) k--;
      return (tr.t0 + k) * STEP;
    })();
    return { id: a.id, cells: tr.cells, t0: tr.t0, tEnd, exit: !!a.exit, sit: a.sit ? { stool: a.sit.stool, at: arrive } : undefined };
  });
};

// position of a track at frame f (linear between tiles), or null if not present
export const posAt = (tr: Track, f: number) => {
  const t = f / STEP - tr.t0;
  if (t < 0) return null;
  const i = Math.floor(t);
  if (i >= tr.cells.length - 1) {
    const c = tr.cells[tr.cells.length - 1];
    const [x, y] = cellXY(c);
    if (tr.exit) return null;
    if (tr.sit && f >= tr.sit.at) {
      const k = Math.min(1, (f - tr.sit.at) / 6);
      return { x: x + (tr.sit.stool[0] - x) * k, y: y + (tr.sit.stool[1] - y) * k, walk: k < 0.5, sit: k >= 0.5 };
    }
    return { x, y, walk: false, sit: false };
  }
  const [x0, y0] = cellXY(tr.cells[i]);
  const [x1, y1] = cellXY(tr.cells[i + 1]);
  const u = t - i;
  const moving = x0 !== x1 || y0 !== y1;
  return { x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u, walk: moving, sit: false };
};
