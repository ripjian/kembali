import { TRACKS, JOIN, STAMP1, QUEUE, FULL } from "./cast";
import { posAt, cellXY, TABLES } from "./plan";
const seated: [number, number][] = TABLES.map(([x, y]) => [x - 42, y + 6]);
let worst = 1e9, worstAt = "";
for (let f = 0; f < 600; f++) {
  const ps = TRACKS.map((t) => ({ id: t.id, p: posAt(t, f) })).filter((q) => q.p);
  const all = [...ps.map((q) => ({ id: q.id, x: q.p!.x, y: q.p!.y })), ...seated.map(([x, y], i) => ({ id: `diner${i}`, x, y }))];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const d = Math.hypot(all[i].x - all[j].x, all[i].y - all[j].y);
    if (d < worst) { worst = d; worstAt = `f${f} ${all[i].id}/${all[j].id}`; }
    if (d < 24) console.log("CLOSE", f, all[i].id, all[j].id, d.toFixed(1));
  }
}
console.log("min distance", worst.toFixed(1), worstAt);
const at = (id: string, f: number) => { const t = TRACKS.find((q) => q.id === id)!; const p = posAt(t, f); return p ? `${p.x},${p.y}${p.walk ? " walking" : ""}${p.sit ? " seated" : ""}` : "gone"; };
console.log("JOIN newbie", at("newbie", JOIN), "| STAMP1 newbie", at("newbie", STAMP1));
QUEUE.forEach((q, i) => console.log(`QUEUE${i} q${i + 1}`, at(`q${i + 1}`, q)));
console.log("FULL regular", at("regular", FULL), "| regular 420", at("regular", 420), "| newbie 300", at("newbie", 300));
TRACKS.forEach((t) => console.log(t.id, "t0", t.t0 * 4, "end", t.tEnd * 4, t.sit ? `sits at ${t.sit.at}` : ""));
