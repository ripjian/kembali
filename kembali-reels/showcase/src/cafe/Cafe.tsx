import React from "react";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { C, FONT, tw, EO, EIO, BACK, rand } from "../lib";
import { useFonts, Grain } from "../swarm/shared";
import { StandardEnd, endSfx, endDuck } from "../endcards/StandardEnd";
import { Line, displayText } from "../common";
import { P, planeX, planeY, planeZ, Box, Figure, makeCam, camTransform, toScreen, Dots, PlusOne, Cam } from "../iso/kit";
import { posAt, cellXY, TABLES } from "./plan";
import { TRACKS, POSTER, CASHIER, JOIN, STAMP1, QUEUE, FULL, REDEEM } from "./cast";

// Desire (slowed) 0:08 → 0:28. 104.1 BPM: beat k at 5.52 + 17.295k frames.
const bt = (k: number) => Math.round(5.52 + 17.295 * k);
const WALL = 240;
const OFFICE = [bt(22), bt(24)];
// live dashboard events, one per beat; each gets exactly one click
const LIVE = [bt(25), bt(26), bt(27)];
const PULL = [bt(29), bt(31)];
// Standard end card: grows in as the pull-back settles; the dot pops on bt(32) = 559.
// The reel runs 35 frames longer than before so the card holds 62 frames after it settles.
const END = bt(32) - 24;
export const CAFE_LEN = 635;

// staff work in the aisle behind the counter (y 40..110); the barista brings the cup over
const BREW = bt(17);
const BARISTA_X = (f: number) =>
  interpolate(f, [bt(19) + 2, bt(20) - 4, bt(21) + 6, bt(22) + 6], [130, 205, 205, 130], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EIO });
const CASHIER_POS: [number, number] = [255, 74];

const SHIRTS: Record<string, string> = { newbie: "#2D6CB5", q1: "#16261E", q2: "#F2C14E", q3: "#FFFFFF", regular: "#E0684B" };

const cam = makeCam([
  { f: 0, x: 60, y: 430, z: 80, s: 2.0 },
  { f: bt(3), x: 260, y: 330, z: 80, s: 1.75 },
  { f: bt(6), x: 430, y: 230, z: 90, s: 2.0 },
  { f: bt(9), x: 430, y: 230, z: 90, s: 2.0 },
  { f: bt(10) + 6, x: 270, y: 200, z: 90, s: 1.9 },
  { f: bt(12) - 4, x: 270, y: 200, z: 90, s: 1.9 },
  { f: bt(12) + 12, x: 250, y: 260, z: 80, s: 1.55 },
  { f: bt(16) - 4, x: 250, y: 260, z: 80, s: 1.55 },
  { f: bt(17), x: 240, y: 190, z: 90, s: 1.9 },
  { f: bt(21), x: 220, y: 250, z: 80, s: 1.7 },
  { f: 394, x: 220, y: 250, z: 80, s: 1.7 },
  { f: 418, x: 830, y: 150, z: 90, s: 2.1 },
  { f: bt(28), x: 820, y: 170, z: 90, s: 1.7 },
  { f: PULL[1], x: 470, y: 280, z: 60, s: 0.62, ay: 832 },
  { f: 600, x: 470, y: 280, z: 60, s: 0.6, ay: 832 },
]);

type Drawable = { d: number; n: React.ReactNode };

// the free coffee is one object that moves continuously:
// poured at the machine → barista's hand → counter → regular's hand → her table
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const SPOUT: V3 = [126, 30, 60];
const COUNTER_SPOT: V3 = [216, 124, 48];
const TABLE_SPOT: V3 = [158, 326, 54];
const cupWorld = (f: number, reg: { x: number; y: number; sit: boolean } | null, regSitAt: number): { p: V3; a: number } | null => {
  const t0 = bt(18) - 8; // poured
  const lift = bt(19) - 2; // barista picks it up
  const down = bt(20) - 6; // set on the counter
  if (f < t0) return null;
  const hand = (x: number, y: number): V3 => [x + 9, y + 2, 50];
  if (f < lift) return { p: SPOUT, a: tw(f, t0, t0 + 5) };
  if (f < lift + 4) return { p: mix3(SPOUT, hand(BARISTA_X(f), 70), tw(f, lift, lift + 4, 0, 1, EIO)), a: 1 };
  if (f < down) return { p: hand(BARISTA_X(f), 70), a: 1 };
  if (f < down + 6) return { p: mix3(hand(BARISTA_X(f), 70), COUNTER_SPOT, tw(f, down, down + 6, 0, 1, EIO)), a: 1 };
  if (f < REDEEM + 4) return { p: COUNTER_SPOT, a: 1 };
  if (!reg) return null;
  const regHand: V3 = [reg.x + 9, reg.y + 2, 38];
  if (f < REDEEM + 10) return { p: mix3(COUNTER_SPOT, regHand, tw(f, REDEEM + 4, REDEEM + 10, 0, 1, EIO)), a: 1 };
  if (f < regSitAt + 6) return { p: regHand, a: 1 };
  return { p: mix3(regHand, TABLE_SPOT, tw(f, regSitAt + 6, regSitAt + 12, 0, 1, EIO)), a: 1 };
};

const Cup: React.FC<{ p: V3; a: number }> = ({ p, a }) => {
  const [X, Y] = P(p[0], p[1], p[2]);
  return (
    <g opacity={a}>
      <rect x={X - 5} y={Y - 11} width={10} height={11} rx={2} fill="#FFFFFF" stroke="#8A5A3B" strokeWidth={1.5} />
      <ellipse cx={X} cy={Y - 11} rx={5} ry={2} fill="#8A5A3B" />
    </g>
  );
};

const Room: React.FC<{ f: number }> = ({ f }) => {
  const people = TRACKS.map((t) => ({ t, p: posAt(t, f) })).filter((q) => q.p);
  const regTrack = TRACKS.find((t) => t.id === "regular")!;
  const reg = posAt(regTrack, f);
  const cup = cupWorld(f, reg, regTrack.sit?.at ?? 9999);
  const bx = BARISTA_X(f);
  const baristaWalking = Math.abs(BARISTA_X(f + 1) - bx) > 0.3;
  const stamping = [STAMP1, ...QUEUE].some((s) => f > s - 14 && f < s + 6);
  const screenPulse = Math.max(0, 1 - ((f - bt(22)) % 17.3) / 8);

  const figureFor = (id: string, x: number, y: number, walk: boolean, sit: boolean) => {
    const phone =
      (id === "newbie" && f > JOIN - 14 && f < STAMP1 + 8) ||
      (id.startsWith("q") && !walk) ||
      (id === "regular" && f > FULL - 10 && f < REDEEM);
    return <Figure key={id} x={x} y={y} f={f} seed={id.length * 7 + id.charCodeAt(0)} walk={walk} sit={sit} faceLeft={sit} shirt={SHIRTS[id]} phone={phone ? 1 : 0} />;
  };

  // outside the door (x < 0) people are drawn before the wall and seen through the glass
  const outside = people.filter((q) => q.p!.x < 0).map((q) => figureFor(q.t.id, q.p!.x, q.p!.y, q.p!.walk, false));

  // the floor: stools, diners, tables and walkers, sorted by depth
  const items: Drawable[] = [];
  TABLES.forEach(([x, y], k) => {
    items.push({ d: x - 42 + y + 6 - 2, n: <Box key={`sl${k}`} x={x - 52} y={y - 4} dx={20} dy={20} dz={26} color="#8A6545" /> });
    items.push({ d: x - 42 + y + 6, n: <Figure key={`dn${k}`} x={x - 42} y={y + 6} f={f} seed={k * 5 + 60} sit /> });
    items.push({ d: x + 44 + y + 6 - 2, n: <Box key={`sr${k}`} x={x + 34} y={y - 4} dx={20} dy={20} dz={26} color="#8A6545" /> });
    items.push({
      d: x + y,
      n: (
        <g key={`t${k}`}>
          <Box x={x - 6} y={y - 4} dx={10} dy={10} dz={48} color="#2A2A2A" />
          <Box x={x - 24} y={y - 22} z={48} dx={46} dy={46} dz={6} color="#F6F1E3" side="#E3D9C3" />
          <Box x={x - 14} y={y - 14} z={54} dx={9} dy={9} dz={10} color="#FFFFFF" top="#8A5A3B" />
        </g>
      ),
    });
  });
  items.push({
    d: 1080,
    n: (
      <g key="plant">
        <Box x={570} y={470} dx={40} dy={40} dz={40} color="#C4623F" />
        {[
          [590, 490, 90, 38],
          [575, 480, 120, 28],
        ].map(([x, y, z, r], k) => {
          const [X, Y] = P(x, y, z);
          return <circle key={k} cx={X} cy={Y} r={r} fill="#4F8A4A" />;
        })}
      </g>
    ),
  });
  people
    .filter((q) => q.p!.x >= 0)
    .forEach((q) => {
      const { x, y, walk, sit } = q.p!;
      items.push({ d: x + y + (sit ? 0 : 1), n: figureFor(q.t.id, x, y, walk, sit) });
    });
  // the cup joins the depth sort once it is out on the floor
  if (cup && f >= REDEEM + 4) items.push({ d: cup.p[0] + cup.p[1] + 3, n: <Cup key="cup" p={cup.p} a={cup.a} /> });
  items.sort((a, b) => a.d - b.d);

  return (
    <g>
      {/* diorama base */}
      <Box x={-14} y={-14} z={-34} dx={1008} dy={590} dz={34} color="#D9CDB4" top="#E8DDC7" side="#BFB195" />
      {/* people outside are only ever seen through the glass door */}
      <clipPath id="doorclip">
        <polygon points={[P(0, 430, 0), P(0, 530, 0), P(0, 530, 192), P(0, 430, 192)].map((q) => q.join(",")).join(" ")} />
      </clipPath>
      <g clipPath="url(#doorclip)">
        <g transform={planeZ(0)}>
          <rect x={-400} y={380} width={400} height={200} fill="#5E6B5A" />
          <rect x={-400} y={430} width={400} height={100} fill="#8A9483" />
        </g>
        {outside}
      </g>
      {/* floors */}
      <g transform={planeZ(0)}>
        <defs>
          <pattern id="checker" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect width="60" height="60" fill="#EFE7D6" />
            <rect width="30" height="30" fill="#DCCFB5" />
            <rect x="30" y="30" width="30" height="30" fill="#DCCFB5" />
          </pattern>
          <pattern id="planks" width="400" height="40" patternUnits="userSpaceOnUse">
            <rect width="400" height="40" fill="#B98A5E" />
            <rect y="38" width="400" height="2" fill="#8E6440" />
            <rect x="180" width="2" height="40" fill="#8E6440" />
          </pattern>
        </defs>
        <rect x={0} y={0} width={640} height={560} fill="url(#checker)" />
        <rect x={640} y={0} width={340} height={560} fill="url(#planks)" />
        <polygon points={`0,170 0,400 ${260 + f * 0.1},500 ${260 + f * 0.1},270`} fill="#FFF3C9" opacity={0.3} />
        <rect x={-14} y={430} width={14} height={100} fill="#C7BBA2" />
      </g>
      {/* back wall */}
      <Box x={-14} y={-14} dx={1008} dy={14} dz={WALL} color="#F1E4CB" top="#FFF8EA" side="#E3D2B2" />
      {/* side wall with a real door opening (y 430..530) */}
      <Box x={-14} y={0} dx={14} dy={430} dz={WALL} color="#E6D6B8" top="#FFF8EA" side="#DCCBAA" />
      <Box x={-14} y={530} dx={14} dy={30} dz={WALL} color="#E6D6B8" top="#FFF8EA" side="#DCCBAA" />
      <Box x={-14} y={430} z={192} dx={14} dy={100} dz={WALL - 192} color="#E6D6B8" top="#FFF8EA" side="#DCCBAA" />
      <g transform={planeY(0)}>
        <rect x={0} y={-80} width={620} height={80} fill="#2F6B55" />
        <rect x={0} y={-84} width={620} height={6} fill="#24574A" />
        <rect x={640} y={-WALL} width={340} height={WALL} fill="#E9EFE6" />
        <rect x={110} y={-224} width={220} height={78} rx={4} fill="#23231F" />
        {Array.from({ length: 6 }).map((_, k) => (
          <rect key={k} x={126 + (k % 2) * 104} y={-210 + Math.floor(k / 2) * 16} width={70 + rand(k) * 20} height={4} fill="#CFCFC6" opacity={0.7} />
        ))}
        <rect x={360} y={-176} width={220} height={6} fill="#6B4B32" />
        {Array.from({ length: 7 }).map((_, k) => (
          <rect key={k} x={370 + k * 30} y={-202} width={20} height={26} rx={5} fill={["#D98A2B", "#7FB069", "#E0684B", "#F2C14E"][k % 4]} opacity={0.9} />
        ))}
        <circle cx={900} cy={-190} r={22} fill="#FFFFFF" stroke="#16261E" strokeWidth={3} />
        <line x1={900} y1={-190} x2={900 + Math.sin(f / 40) * 14} y2={-190 - Math.cos(f / 40) * 14} stroke="#16261E" strokeWidth={3} />
        <rect x={680} y={-200} width={120} height={90} fill="#BFE0EA" />
        <rect x={738} y={-200} width={4} height={90} fill="#FFFFFF" />
        <rect x={680} y={-158} width={120} height={4} fill="#FFFFFF" />
      </g>
      <g transform={planeX(0)}>
        <rect x={0} y={-80} width={430} height={80} fill="#2F6B55" />
        <rect x={530} y={-80} width={30} height={80} fill="#2F6B55" />
        <rect x={120} y={-200} width={220} height={120} fill="#CDEBF2" />
        <rect x={226} y={-200} width={6} height={120} fill="#FFFFFF" />
        <rect x={120} y={-144} width={220} height={6} fill="#FFFFFF" />
        {/* glass door: people outside show through it */}
        <rect x={430} y={-192} width={100} height={192} fill="#BFE6EE" opacity={0.28} />
        <rect x={430} y={-192} width={100} height={192} fill="none" stroke="#6B4B32" strokeWidth={6} />
        <rect x={478} y={-192} width={4} height={192} fill="#6B4B32" />
      </g>

      {/* back counter with the espresso machine against the wall */}
      <Box x={30} y={0} dx={440} dy={34} dz={60} color="#6B4B32" top="#8A6545" />
      <Box x={100} y={4} z={60} dx={64} dy={28} dz={52} color="#C9CCCB" top="#DADDDC" />
      <Box x={112} y={26} z={70} dx={12} dy={8} dz={10} color="#3A3A3A" />
      {/* staff, visible above the low front counter */}
      <Figure x={bx} y={70} f={f} seed={4} walk={baristaWalking} shirt="#FFFFFF" apron />
      {cup && f < bt(20) - 6 && <Cup p={cup.p} a={cup.a} />}
      <Figure x={CASHIER_POS[0]} y={CASHIER_POS[1]} f={f} seed={9} shirt="#16261E" apron phone={stamping ? 1 : 0} />
      {/* front counter */}
      <Box x={60} y={112} dx={380} dy={48} dz={48} color="#F3E9D6" top="#6B4B32" side="#E5D8BF" />
      <g transform={planeY(160)}>
        <rect x={60} y={-34} width={380} height={7} fill="#E0684B" />
      </g>
      <Box x={330} y={118} z={48} dx={80} dy={36} dz={34} color="#D8EEF2" />
      {[0, 1, 2].map((k) => (
        <Box key={k} x={338 + k * 24} y={128} z={48} dx={16} dy={16} dz={12} color={["#E27396", "#F2C14E", "#8A5A3B"][k]} />
      ))}
      <Box x={262} y={118} z={48} dx={20} dy={16} dz={12} color="#16261E" top="#2F6B55" />
      {cup && f >= bt(20) - 6 && f < REDEEM + 4 && <Cup p={cup.p} a={cup.a} />}
      {/* pendant lights */}
      {[110, 410].map((x) => {
        const [lx, ly] = P(x, 136, WALL);
        const [bx2, by] = P(x, 136, 196);
        return (
          <g key={x}>
            <line x1={lx} y1={ly} x2={bx2} y2={by} stroke="#16261E" strokeWidth={2} />
            <path d={`M${bx2 - 16} ${by + 14} L${bx2 - 8} ${by} L${bx2 + 8} ${by} L${bx2 + 16} ${by + 14} Z`} fill="#2F6B55" />
            <circle cx={bx2} cy={by + 16} r={6} fill="#FFE7A8" />
          </g>
        );
      })}
      {/* join standee */}
      <Box x={450} y={166} dx={40} dy={6} dz={116} color="#FFFFFF" />
      <g transform={planeY(172)}>
        <rect x={452} y={-112} width={36} height={52} fill={C.shopBrown} />
        <image href={staticFile("qr.svg")} x={456} y={-106} width={28} height={28} style={{ filter: "invert(1)" }} />
        <rect x={456} y={-72} width={28} height={4} fill="#F6F1E3" />
      </g>

      {items.map((i) => i.n)}

      {/* partition between café and office: nearer the camera than everything in the café behind it */}
      <Box x={620} y={0} dx={20} dy={260} dz={WALL} color="#F1E4CB" top="#FFF8EA" side="#EADBC0" />

      {/* office: shelf first (it is behind the desk) */}
      <Box x={660} y={0} dx={70} dy={30} dz={150} color="#8A6545" />
      <g transform={planeY(30)}>
        <rect x={666} y={-140} width={58} height={44} fill="#4A3526" />
        {[0, 1, 2, 3].map((k) => (
          <rect key={k} x={670 + k * 13} y={-134} width={10} height={38} fill={["#E0684B", "#2D6CB5", "#F2C14E", "#7FB069"][k]} />
        ))}
        <rect x={666} y={-80} width={58} height={44} fill="#4A3526" />
      </g>
      <Box x={760} y={60} dx={150} dy={70} dz={70} color="#EDE3CF" top="#FFFFFF" />
      <Box x={805} y={78} z={70} dx={60} dy={34} dz={3} color="#9EA3A3" />
      <g transform={planeY(80)}>
        <rect x={805} y={-118} width={60} height={42} rx={3} fill="#16261E" />
        <rect x={809} y={-114} width={52} height={34} fill="#F6F1E3" />
        {[0, 1, 2, 3, 4].map((k) => (
          <rect key={k} x={813 + k * 9} y={-84 - (6 + rand(k) * 16) * (1 + screenPulse * 0.2)} width={6} height={(6 + rand(k) * 16) * (1 + screenPulse * 0.2)} fill={k === 3 ? C.coral : C.pandan} />
        ))}
      </g>
      <Box x={808} y={146} dx={36} dy={34} dz={26} color="#2F6B55" />
      <Figure x={826} y={160} f={f} seed={17} sit faceLeft shirt="#7FB069" />
      <Box x={806} y={180} dx={40} dy={6} dz={64} color="#2F6B55" />
      <Box x={930} y={470} dx={40} dy={40} dz={36} color="#C4623F" />
      {(() => {
        const [X, Y] = P(950, 490, 90);
        return <circle cx={X} cy={Y} r={36} fill="#4F8A4A" />;
      })()}
    </g>
  );
};

// a fixed card low in the frame, tied to the person by a thin dashed line
const Callout: React.FC<{ hx: number; hy: number; t: number; out: number; children: React.ReactNode; width?: number }> = ({ hx, hy, t, out, children, width = 440 }) => {
  if (t <= 0 || out >= 1) return null;
  const s = tw(t, 0, 1, 0, 1, BACK);
  const top = 1335;
  const cx = Math.min(1080 - width / 2 - 40, Math.max(width / 2 + 40, hx));
  const draw = tw(t, 0.2, 1, 0, 1, EO);
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
        <line x1={cx} y1={top} x2={cx + (hx - cx) * draw} y2={top + (hy - top) * draw} stroke={C.sand} strokeWidth={3} strokeDasharray="6 8" />
        <circle cx={hx} cy={hy} r={7 * draw} fill={C.sand} />
      </svg>
      <div style={{ position: "absolute", left: cx - width / 2, top, width, scale: `${s}`, opacity: 1 - out, transformOrigin: "50% 0" }}>
        <div style={{ background: C.sand, borderRadius: 26, padding: "22px 28px", boxShadow: "0 24px 60px rgba(0,0,0,0.35)", fontFamily: FONT.sans, color: C.ink }}>{children}</div>
      </div>
    </>
  );
};

const Moments: React.FC<{ f: number; c: Cam }> = ({ f, c }) => {
  const at = (x: number, y: number, z: number): [number, number] => toScreen(c, ...P(x, y, z));
  const [px, py] = cellXY(POSTER);
  const [cx0, cy0] = cellXY(CASHIER);
  // leader lines end at the feet, so they never cross the person
  const [jx, jy] = at(px, py + 12, 0);
  const [sx, sy] = at(cx0, cy0 + 12, 0);
  const [ox, oy] = at(cx0, cy0, 80);
  return (
    <>
      <Callout hx={jx} hy={jy} t={tw(f, JOIN, JOIN + 10)} out={tw(f, bt(9) - 4, bt(9) + 4)}>
        <div style={{ fontSize: 22, fontWeight: 600, color: C.ink2 }}>Corner Coffee</div>
        <div style={{ fontSize: 34, fontWeight: 800, marginTop: 2 }}>You joined</div>
        <Dots n={0} f={f} />
      </Callout>
      <Callout hx={sx} hy={sy} t={tw(f, STAMP1, STAMP1 + 8)} out={tw(f, bt(12) - 2, bt(12) + 6)}>
        <div style={{ fontSize: 34, fontWeight: 800 }}>Stamp 1 of 9</div>
        <Dots n={1} popAt={STAMP1 + 2} f={f} />
      </Callout>
      {QUEUE.map((q, j) => (
        <PlusOne key={j} x={ox - 70} y={oy - 10} t={f - q} />
      ))}
      <Callout hx={sx} hy={sy} t={tw(f, FULL, FULL + 8)} out={tw(f, bt(21) + 4, bt(21) + 12)} width={460}>
        {f < REDEEM ? (
          <>
            <div style={{ fontSize: 34, fontWeight: 800 }}>Card full</div>
            <div style={{ fontSize: 24, color: C.ink2, marginTop: 2 }}>Your reward is ready</div>
            <Dots n={9} popAt={FULL + 2} f={f} />
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 58, height: 58, borderRadius: "50%", background: C.coral, display: "grid", placeItems: "center", scale: `${tw(f, REDEEM, REDEEM + 8, 1.8, 1, BACK)}` }}>
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>Redeemed</div>
              <div style={{ fontSize: 24, color: C.ink2 }}>Reward claimed</div>
            </div>
          </div>
        )}
      </Callout>
      <Dashboard f={f} c={c} />
    </>
  );
};

const Dashboard: React.FC<{ f: number; c: Cam }> = ({ f, c }) => {
  const t = tw(f, OFFICE[1] - 4, OFFICE[1] + 12, 0, 1, EO) * (1 - tw(f, PULL[0] - 10, PULL[0] + 2, 0, 1, EIO));
  const out = 0;
  if (t <= 0.001) return null;
  const [lx, ly] = toScreen(c, ...P(835, 80, 100));
  const W = 820;
  const top = 880;
  const ticks = LIVE;
  const n = ticks.filter((k) => f >= k).length;
  // the free coffee we watched was redeemed at 09:54; the feed is consistent with the clock
  // the free coffee we watched is already in the feed; each beat adds one live event
  const rows = [
    ["Ming Wei", "Reward", "09:54"],
    ["Daniel T.", "Stamp", "10:04"],
    ["Priya K.", "Joined", "10:05"],
    ["Farah Z.", "Stamp", "10:05"],
  ];
  const stamps = 48 + (n >= 1 ? 1 : 0) + (n >= 3 ? 1 : 0);
  const stampPop = Math.max(...[ticks[0], ticks[2]].map((k) => (f >= k && f < k + 8 ? tw(f, k, k + 8, 1.25, 1, BACK) : 1)).map((v) => v - 1)) + 1;
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - W / 2,
        top,
        width: W,
        translate: `${(lx - 540) * (1 - t)}px ${(ly - top) * (1 - t)}px`,
        scale: `${0.15 + 0.85 * t}`,
        transformOrigin: "50% 0",
        opacity: Math.min(1, t * 4) * (1 - out),
        background: C.sand,
        borderRadius: 32,
        padding: 34,
        boxShadow: "0 40px 90px rgba(0,0,0,0.45)",
        fontFamily: FONT.sans,
        color: C.ink,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: 36, fontWeight: 800 }}>Today</div>
        <div style={{ fontFamily: FONT.mono, fontSize: 20, letterSpacing: "0.2em", color: C.ink2 }}>CORNER COFFEE · LIVE</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 22 }}>
        {[
          ["Stamps", String(stamps)],
          ["Rewards", "4"],
          ["Returning", "62%"],
        ].map(([k, v], i) => (
          <div key={k} style={{ background: C.white, borderRadius: 18, padding: "18px 20px", border: "1px solid #E6DFCB" }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: i === 0 ? C.coral : C.ink, fontVariantNumeric: "tabular-nums", scale: i === 0 ? `${stampPop}` : undefined, transformOrigin: "0 60%" }}>{v}</div>
            <div style={{ fontSize: 22, color: C.ink2 }}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18, background: C.white, borderRadius: 18, border: "1px solid #E6DFCB", overflow: "hidden" }}>
        {rows.slice(0, 1 + n).map((r, i) => {
          const at = i < 1 ? 0 : ticks[i - 1];
          const inn = i < 1 ? 1 : tw(f, at, at + 8, 0, 1, EO);
          return (
            <div key={r[0]} style={{ display: "flex", justifyContent: "space-between", padding: "16px 22px", fontSize: 26, borderTop: i ? "1px solid #EDE6D2" : "none", background: i >= 1 && i === n ? "#FBF1E6" : C.white, opacity: inn, translate: `${(1 - inn) * -40}px 0` }}>
              <b style={{ fontWeight: 700 }}>{r[0]}</b>
              <span style={{ color: r[1] === "Reward" ? C.coralDeep : C.ink2 }}>{r[1]}</span>
              <span style={{ fontFamily: FONT.mono, color: C.muted }}>{r[2]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Headlines: React.FC<{ f: number }> = ({ f }) => {
  const h = interpolate(f, [0, bt(12), bt(16), bt(22), bt(29)], [8.0, 8.4, 9.6, 10.05, 10.12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const clock = `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")}`;
  const L = (a: string, b: string, inAt: number, outAt: number) => (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, textAlign: "center", ...displayText(80) }}>
      <Line f={f} inAt={inAt} outAt={outAt}>
        {a}
      </Line>
      <Line f={f} inAt={inAt + 5} outAt={outAt + 2}>
        <span style={{ fontStyle: "italic", fontWeight: 400 }}>{b}</span>
      </Line>
    </div>
  );
  if (f > PULL[0] + 10) return null;
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 604, display: "flex", justifyContent: "center", opacity: tw(f, 4, 14) * (1 - tw(f, PULL[0] - 6, PULL[0] + 4)) }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 28, letterSpacing: "0.16em", color: C.sand, background: "rgba(8,24,19,0.72)", padding: "8px 20px", borderRadius: 99 }}>{clock}</div>
      </div>
      <div style={{ position: "absolute", left: 40, right: 40, top: 424 }}>
        {L("Here's how", "a regular is made.", 8, bt(5) - 4)}
        {L("Scan the poster.", "Join in seconds.", bt(5) + 4, bt(10) - 6)}
        {L("Show the code.", "Get the stamp.", bt(10) + 2, bt(12) - 4)}
        {L("A busy morning,", "every stamp counted.", bt(12) + 4, bt(16) - 6)}
        {L("Nine visits later,", "a free reward.", bt(16) + 4, 398)}
        {L("And you see it", "as it happens.", 410, PULL[0] - 4)}
      </div>
    </>
  );
};

const Sfx: React.FC<{ at: number; src: string; vol?: number }> = ({ at, src, vol = 0.5 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={50} layout="none">
    <Audio src={staticFile(src)} volume={vol} />
  </Sequence>
);
const SOUND = [
  { at: JOIN, src: "sfx/interface/drop_001.ogg", vol: 0.45 },
  { at: STAMP1 - 1, src: "sfx/impact/impactSoft_medium_001.ogg", vol: 0.55 },
  ...QUEUE.map((q) => ({ at: q - 1, src: "sfx/interface/click_003.ogg", vol: 0.4 })),
  { at: FULL, src: "sfx/interface/drop_001.ogg", vol: 0.4 },
  { at: REDEEM - 1, src: "sfx/impact/impactBell_heavy_000.ogg", vol: 0.25 },
  { at: bt(22), src: "sfx/web/whoosh.wav", vol: 0.3 },
  ...LIVE.map((k) => ({ at: k, src: "sfx/interface/click_003.ogg", vol: 0.4 })),
  { at: PULL[0], src: "sfx/web/whoosh.wav", vol: 0.35 },
  ...endSfx(END),
];

export const Cafe: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const c = cam(f);
  const world = (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <g transform={camTransform(c)}>
        <Room f={f} />
      </g>
    </svg>
  );
  return (
    <AbsoluteFill style={{ background: C.pandan, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(1200px 1400px at 50% 45%, #1C5A48 0%, #0F3D32 55%, #082119 100%)" }} />
      <AbsoluteFill style={{ filter: "saturate(1.2) contrast(1.03)" }}>{world}</AbsoluteFill>
      <AbsoluteFill
        style={{
          filter: "blur(8px) saturate(1.2)",
          WebkitMaskImage: "linear-gradient(180deg, black 0%, transparent 30%, transparent 66%, black 100%)",
          maskImage: "linear-gradient(180deg, black 0%, transparent 30%, transparent 66%, black 100%)",
          opacity: 1 - tw(f, PULL[0], PULL[1]),
        }}
      >
        {world}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(6,14,11,0.7) 0%, rgba(6,14,11,0.6) 29%, rgba(6,14,11,0.25) 35%, rgba(6,14,11,0) 41%)", opacity: 1 - tw(f, PULL[0], PULL[1]) }} />
      <Moments f={f} c={c} />
      <Headlines f={f} />
      <Grain f={f} />
      <StandardEnd f={f} start={END} />
      <Audio src={staticFile("music/desire.mp3")} trimBefore={8 * 30} volume={(fr) => endDuck(fr, END) * interpolate(fr, [0, 3, CAFE_LEN - 50, CAFE_LEN - 4], [0, 0.8, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {SOUND.map((s, k) => (
        <Sfx key={k} {...s} />
      ))}
    </AbsoluteFill>
  );
};
