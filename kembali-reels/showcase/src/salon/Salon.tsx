import React from "react";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { C, FONT, tw, EO, EIO, BACK, rand } from "../lib";
import { useFonts, Grain } from "../swarm/shared";
import { StandardEnd, endSfx, endDuck } from "../endcards/StandardEnd";
import { Line, displayText } from "../common";
import { P, planeX, planeY, planeZ, Box, Figure, HairShape, Hair, makeCam, camTransform, toScreen, Cam } from "../iso/kit";
import { plan, posAt, cellXY, AgentSpec, Cell, Track, STEP } from "../cafe/plan";

// Pink Panther (OTISMADEIT) 1:21 → 1:44. 85 BPM; the riff lands a three-hit stab every
// 3.77 s (frames 60/81/102, 173/194/215, 286/307/328, 399/420/441). Every visible
// change in the story sits on one of those stabs.
const T1 = [60, 81, 102];
const T2 = [173, 194, 215];
const T3 = [286, 307, 328];
const T4 = [399, 420, 441];
const WALL = 240;

const PLUM = "#7A2E4A";
const PINK = "#E27396";
const BLUSH = "#F4DCE0";
const MEI_SKIN = "#C58C62";

// ---------- floor plan ----------
const STATIONS = [150, 330, 510];
const CHAIR_Y = 112;
const DESK = { x0: 60, x1: 210, y0: 300, y1: 350, h: 54 };
const SOFA = { x0: 440, x1: 600, y0: 460, y1: 520 };
const PLANT = { x: 600, y: 330 };
const salonBlocked = ([cx, cy]: Cell) => {
  if (cy < 0 || cy > 18 || cx > 20 || cx < -12) return true;
  if (cx < 0) return !(cy === 15 || cy === 16);
  const [x, y] = cellXY([cx, cy]);
  if (y < 150) return true; // stations
  if (x > 40 && x < 230 && y > 240 && y < 362) return true; // reception desk + receptionist
  if (x < 40 && y > 190 && y < 400) return true; // never walk behind the desk
  if (x > 420 && y > 430) return true; // sofa
  if (Math.abs(x - PLANT.x) < 40 && Math.abs(y - PLANT.y) < 40) return true;
  return false;
};

const CHECKIN: Cell = [4, 12];
const SIDE: Cell = [9, 5]; // she steps into the chair from its side, never through the backrest
const SEAT: [number, number] = [STATIONS[1], CHAIR_Y];
const CLAIM = T4[2];
const LEAVE = CLAIM + 30;
const OUT_AT = Math.ceil((LEAVE + 12) / STEP) * STEP;
const AGENTS: AgentSpec[] = [
  { id: "in", spawn: [-5, 15], t0: 0, legs: [{ to: CHECKIN, after: 0 }, { to: SIDE, after: T1[2] }] },
  { id: "out", spawn: SIDE, t0: OUT_AT, legs: [{ to: [-5, 15], after: OUT_AT }], exit: true },
];
const TRACKS = plan(AGENTS, salonBlocked);
const arrival = (tr: Track) => {
  const last = tr.cells[tr.cells.length - 1];
  let k = tr.cells.length - 1;
  while (k > 0 && tr.cells[k - 1][0] === last[0] && tr.cells[k - 1][1] === last[1]) k--;
  return (tr.t0 + k) * STEP;
};
const AT_SIDE = arrival(TRACKS[0]);
const SEATED = AT_SIDE + 10;
const EXIT_END = TRACKS[1].tEnd * STEP;
export const PULL = [EXIT_END + 4, EXIT_END + 40];
// Standard end card: grows in once the pull-back settles. The reel runs 40 frames longer
// than before so the card holds 72 frames after it settles; the music fades over the
// last 1.7 s so no hi-hat ticks on the final frame.
const END = PULL[1];
export const SALON_LEN = 730;

// into the chair: side cell → beside the seat → onto the seat (and the reverse to leave)
const [SX, SY] = cellXY(SIDE);
const SLIDE: [number, number][] = [
  [SX, SY],
  [SX, CHAIR_Y + 6],
  [SEAT[0], SEAT[1]],
];
const along = (k: number): [number, number] => {
  const seg = Math.min(1, Math.floor(k * 2));
  const u = k * 2 - seg;
  const a = SLIDE[seg];
  const b = SLIDE[Math.min(2, seg + 1)];
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
};

// ---------- the customer's visits (service always matches the change) ----------
type Visit = { at: number; month: string; service: string; rm: number; hair: Hair };
const VISITS: Visit[] = [
  { at: 251, month: "MAR", service: "Cut", rm: 60, hair: { style: "bob", color: "#2A1E1A" } },
  { at: T3[0], month: "APR", service: "Colour", rm: 85, hair: { style: "bob", color: "#A4502A" } },
  { at: T3[1], month: "MAY", service: "Cut", rm: 45, hair: { style: "short", color: "#A4502A" } },
  { at: T3[2], month: "JUN", service: "Colour", rm: 120, hair: { style: "short", color: "#3B5BA5" } },
  { at: T4[0], month: "JUL", service: "Keratin", rm: 190, hair: { style: "short", color: "#3B5BA5", shine: 1 } },
];
const GOAL = 500;
const REWARD = T4[1];
const meiHair = (f: number): Hair => {
  if (f >= CLAIM) return { style: "short", color: PINK, shine: 1 };
  if (f < T2[2]) return { style: "messy", color: "#2A1E1A", trim: T2.filter((s) => f >= s).length / 3 };
  let h = VISITS[0].hair;
  VISITS.forEach((v) => {
    if (f >= v.at) h = v.hair;
  });
  return h;
};
const pointsAt = (f: number) => VISITS.reduce((s, v) => s + v.rm * tw(f, v.at, v.at + 10, 0, 1, EO), 0);

// a new client sits in the other chairs each month
type Client = { hair: Hair; shirt: string; skin: string };
const OTHERS: Client[][] = [
  [
    { hair: { style: "long", color: "#2A1E1A" }, shirt: "#2D6CB5", skin: "#E3B48E" },
    { hair: { style: "long", color: "#7A3B2E" }, shirt: "#2D6CB5", skin: "#E3B48E" },
    { hair: { style: "bob", color: "#7A3B2E" }, shirt: "#2D6CB5", skin: "#E3B48E" },
    { hair: { style: "bob", color: "#C9A227" }, shirt: "#2D6CB5", skin: "#E3B48E" },
    { hair: { style: "short", color: "#C9A227" }, shirt: "#2D6CB5", skin: "#E3B48E" },
  ],
  [
    { hair: { style: "long", color: "#3A2A20" }, shirt: "#F2C14E", skin: "#8D5A3B" },
    { hair: { style: "bob", color: "#3A2A20" }, shirt: "#F2C14E", skin: "#8D5A3B" },
    { hair: { style: "bob", color: "#A4502A" }, shirt: "#F2C14E", skin: "#8D5A3B" },
    { hair: { style: "short", color: "#A4502A" }, shirt: "#F2C14E", skin: "#8D5A3B" },
    { hair: { style: "short", color: "#2A1E1A" }, shirt: "#F2C14E", skin: "#8D5A3B" },
  ],
];
const monthIndex = (f: number) => Math.max(0, VISITS.filter((v) => f >= v.at).length - 1);

const cam = makeCam([
  { f: 0, x: 40, y: 440, z: 80, s: 2.0 },
  { f: 44, x: 150, y: 380, z: 80, s: 2.0 },
  { f: T1[2], x: 150, y: 380, z: 80, s: 2.0 },
  { f: 132, x: 240, y: 270, z: 80, s: 1.8 },
  { f: SEATED, x: 320, y: 150, z: 85, s: 2.3 },
  { f: 236, x: 320, y: 150, z: 85, s: 2.3 },
  { f: 251, x: 320, y: 175, z: 85, s: 2.1 },
  { f: 278, x: 320, y: 150, z: 85, s: 2.3 },
  { f: LEAVE + 10, x: 320, y: 150, z: 85, s: 2.3 },
  { f: LEAVE + 46, x: 190, y: 300, z: 80, s: 1.75 },
  { f: PULL[0], x: 70, y: 430, z: 80, s: 1.75 },
  { f: PULL[1], x: 320, y: 280, z: 60, s: 0.66, ay: 832 },
  { f: 690, x: 320, y: 280, z: 60, s: 0.62, ay: 832 },
]);

// ---------- pieces ----------
const COUNTER_H = 40;
const Chair: React.FC<{ x: number }> = ({ x }) => (
  <g>
    <Box x={x - 8} y={CHAIR_Y - 10} dx={16} dy={16} dz={26} color="#2A2A2A" />
    <Box x={x - 22} y={CHAIR_Y - 20} z={26} dx={44} dy={38} dz={9} color="#2E2A2C" />
  </g>
);
// a low back so the client's caped shoulders show above it
const ChairBack: React.FC<{ x: number }> = ({ x }) => <Box x={x - 20} y={CHAIR_Y + 18} z={30} dx={40} dy={7} dz={20} color="#2E2A2C" />;

// scissors held at the client's head, blades toward the hair
const Scissors: React.FC<{ x: number; y: number; z: number; open: number; s: number }> = ({ x, y, z, open, s }) => {
  const [X, Y] = P(x, y, z);
  const a = 6 + open * 24;
  return (
    <g transform={`translate(${X} ${Y}) rotate(180) scale(${s})`}>
      <line x1={0} y1={0} x2={Math.cos((-a * Math.PI) / 180) * 16} y2={Math.sin((-a * Math.PI) / 180) * 16} stroke="#D7DADB" strokeWidth={3} strokeLinecap="round" />
      <line x1={0} y1={0} x2={Math.cos((a * Math.PI) / 180) * 16} y2={Math.sin((a * Math.PI) / 180) * 16} stroke="#D7DADB" strokeWidth={3} strokeLinecap="round" />
      <circle cx={-4} cy={-3} r={3} fill="none" stroke={PINK} strokeWidth={2} />
      <circle cx={-4} cy={3} r={3} fill="none" stroke={PINK} strokeWidth={2} />
    </g>
  );
};

const ScissorsAt: React.FC<{ X: number; Y: number; open: number; s: number }> = ({ X, Y, open, s }) => {
  const a = 6 + open * 24;
  return (
    <g transform={`translate(${X} ${Y}) rotate(180) scale(${s})`}>
      <line x1={0} y1={0} x2={Math.cos((-a * Math.PI) / 180) * 16} y2={Math.sin((-a * Math.PI) / 180) * 16} stroke="#D7DADB" strokeWidth={3} strokeLinecap="round" />
      <line x1={0} y1={0} x2={Math.cos((a * Math.PI) / 180) * 16} y2={Math.sin((a * Math.PI) / 180) * 16} stroke="#D7DADB" strokeWidth={3} strokeLinecap="round" />
      <circle cx={-4} cy={-3} r={3} fill="none" stroke={PINK} strokeWidth={2} />
      <circle cx={-4} cy={3} r={3} fill="none" stroke={PINK} strokeWidth={2} />
    </g>
  );
};

type MeiState = { x: number; y: number; walk: boolean; sit: boolean; inChair: boolean; alpha: number };
const meiAt = (f: number): MeiState | null => {
  if (f < AT_SIDE) {
    const p = posAt(TRACKS[0], f);
    return p ? { ...p, inChair: false, alpha: 1 } : null;
  }
  if (f < SEATED) {
    const k = (f - AT_SIDE) / 10;
    const [x, y] = along(k);
    return { x, y, walk: k < 0.75, sit: k >= 0.75, inChair: true, alpha: 1 };
  }
  if (f < LEAVE) return { x: SEAT[0], y: SEAT[1], walk: false, sit: true, inChair: true, alpha: 1 };
  if (f < OUT_AT) {
    const k = Math.min(1, (f - LEAVE) / 12);
    const [x, y] = along(1 - k);
    return { x, y, walk: k < 1, sit: false, inChair: true, alpha: 1 };
  }
  const p = posAt(TRACKS[1], f);
  if (!p) return null;
  // fade as she steps out through the door
  return { ...p, inChair: false, alpha: 1 - tw(f, EXIT_END - 8, EXIT_END) };
};

const Room: React.FC<{ f: number }> = ({ f }) => {
  const mi = monthIndex(f);
  const mei = meiAt(f);
  const hair = meiHair(f);
  const seated = mei?.sit ?? false;
  const cutting = f >= T2[0] - 10 && f < T2[2] + 12;
  const snip = T2.reduce((acc, s) => acc + (f >= s - 3 && f < s + 6 ? Math.sin(((f - s + 3) / 9) * Math.PI) : 0), 0);
  const phone = (a: number, b: number) => tw(f, a - 8, a) * (1 - tw(f, b, b + 8));
  const meiPhone = Math.max(phone(T1[0], T1[2]), phone(VISITS[0].at - 4, VISITS[0].at + 12));
  // the glass door slides open as she nears it
  const doorOpen = mei ? Math.max(0, Math.min(1, 1 - (Math.hypot(mei.x - 0, mei.y - 480) - 50) / 70)) : 0;

  const meiFig = mei ? (
    <Figure
      key="mei"
      x={mei.x}
      y={mei.y}
      f={f}
      seed={3}
      walk={mei.walk}
      pace={1.6}
      sit={seated}
      faceLeft
      shirt="#16261E"
      skin={MEI_SKIN}
      hair={{ ...hair, view: seated ? "back" : undefined }}
      cape={seated ? PLUM : undefined}
      capeOpacity={tw(f, SEATED - 2, SEATED + 6) * (1 - tw(f, LEAVE - 6, LEAVE))}
      phone={seated ? 0 : meiPhone}
      alpha={mei.alpha}
    />
  ) : null;

  const client = (k: 0 | 1, x: number) => {
    const c = OTHERS[k][0];
    return <Figure x={x} y={CHAIR_Y} f={f} seed={21 + k} sit faceLeft shirt={c.shirt} skin={c.skin} hair={{ ...OTHERS[k][mi].hair, view: "back" }} cape={PLUM} />;
  };

  return (
    <g>
      <Box x={-14} y={-14} z={-34} dx={668} dy={590} dz={34} color="#E8D3CF" top="#F2E2DE" side="#CDB3AE" />
      <clipPath id="sdoor">
        <polygon points={[P(0, 430, 0), P(0, 530, 0), P(0, 530, 192), P(0, 430, 192)].map((q) => q.join(",")).join(" ")} />
      </clipPath>
      <g clipPath="url(#sdoor)">
        <g transform={planeZ(0)}>
          <rect x={-400} y={380} width={400} height={200} fill="#6E7A72" />
          <rect x={-400} y={430} width={400} height={100} fill="#99A397" />
        </g>
        {mei && mei.x < 0 && meiFig}
      </g>
      {/* terrazzo floor */}
      <g transform={planeZ(0)}>
        <rect x={0} y={0} width={640} height={560} fill="#F6E9E6" />
        {Array.from({ length: 160 }).map((_, i) => (
          <circle key={i} cx={rand(i) * 640} cy={rand(i + 200) * 560} r={2 + rand(i + 9) * 4} fill={["#E3B8BF", "#C9A9B0", "#F0CFA0", "#D9DDE0"][i % 4]} opacity={0.8} />
        ))}
        <rect x={-14} y={430} width={14} height={100} fill="#D8C2BD" />
      </g>
      {/* walls */}
      <Box x={-14} y={-14} dx={668} dy={14} dz={WALL} color={BLUSH} top="#FFF4F5" side="#E8C9CE" />
      <Box x={-14} y={0} dx={14} dy={430} dz={WALL} color="#EED0D5" top="#FFF4F5" side="#E2C2C8" />
      <Box x={-14} y={530} dx={14} dy={30} dz={WALL} color="#EED0D5" top="#FFF4F5" side="#E2C2C8" />
      <Box x={-14} y={430} z={192} dx={14} dy={100} dz={WALL - 192} color="#EED0D5" top="#FFF4F5" side="#E2C2C8" />
      <g transform={planeY(0)}>
        <rect x={0} y={-70} width={640} height={70} fill={PLUM} />
        {STATIONS.map((x, k) => {
          const show = k === 1 ? f >= SEATED - 2 && f < LEAVE + 4 : true;
          const c = k === 1 ? null : { ...OTHERS[k === 0 ? 0 : 1][0], hair: OTHERS[k === 0 ? 0 : 1][mi].hair };
          return (
            <g key={x}>
              <rect x={x - 58} y={-186} width={116} height={140} rx={10} fill="#F2C9A8" />
              <rect x={x - 52} y={-180} width={104} height={128} rx={6} fill="#CFE6EC" />
              <path d={`M${x - 44} ${-64} L${x - 10} ${-172}`} stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={6} />
              {Array.from({ length: 6 }).map((_, j) => (
                <circle key={j} cx={x - 50 + j * 20} cy={-192} r={4} fill="#FFE7A8" />
              ))}
              {/* the client in the chair, seen face-on in the mirror at head height */}
              {show && (
                <g opacity={k === 1 ? tw(f, SEATED - 2, SEATED + 4) * (1 - tw(f, LEAVE, LEAVE + 4)) : 1}>
                  <rect x={x - 14} y={-64} width={28} height={30} rx={8} fill={PLUM} />
                  <circle cx={x} cy={-76} r={10} fill={k === 1 ? MEI_SKIN : c!.skin} />
                  <HairShape X={x} Y={-76} h={{ ...(k === 1 ? hair : c!.hair), view: "front" }} />
                </g>
              )}
            </g>
          );
        })}
        <rect x={588} y={-160} width={46} height={5} fill="#5A2236" />
        {Array.from({ length: 4 }).map((_, j) => (
          <rect key={j} x={590 + j * 11} y={-178} width={8} height={18} rx={3} fill={[PINK, "#FFFFFF", "#F2C14E", PLUM][j]} />
        ))}
      </g>
      <g transform={planeX(0)}>
        <rect x={0} y={-70} width={430} height={70} fill={PLUM} />
        <rect x={530} y={-70} width={30} height={70} fill={PLUM} />
        <rect x={140} y={-200} width={200} height={110} fill="#CDEBF2" />
        <rect x={238} y={-200} width={4} height={110} fill="#FFFFFF" />
        {/* sliding glass door */}
        <rect x={430 + doorOpen * 88} y={-192} width={100 - doorOpen * 88} height={192} fill="#BFE6EE" opacity={0.3} />
        <rect x={430 + doorOpen * 88} y={-192} width={100 - doorOpen * 88} height={192} fill="none" stroke={PLUM} strokeWidth={5} />
        <rect x={430} y={-192} width={100} height={192} fill="none" stroke={PLUM} strokeWidth={6} />
      </g>

      {/* stations */}
      {STATIONS.map((x) => (
        <Box key={`c${x}`} x={x - 60} y={0} dx={120} dy={34} dz={COUNTER_H} color="#FFFFFF" top="#F4E7E9" />
      ))}
      {STATIONS.map((x) => (
        <Chair key={`ch${x}`} x={x} />
      ))}
      {client(0, STATIONS[0])}
      {client(1, STATIONS[2])}
      {mei && mei.inChair && meiFig}
      {STATIONS.map((x) => (
        <ChairBack key={`cb${x}`} x={x} />
      ))}
      <Figure x={STATIONS[0] + 46} y={100} f={f} seed={31} scale={1.08} shirt={PINK} apron hair={{ style: "bob", color: "#16261E" }} arm={[-22, -24]} />
      <Figure x={STATIONS[1] + 46} y={100} f={f} seed={33} scale={1.08} shirt="#FFFFFF" apron hair={{ style: "short", color: "#2A1E1A" }} arm={cutting ? [-22, -24 + snip * 2] : undefined} />
      <Figure x={STATIONS[2] + 46} y={100} f={f} seed={35} scale={1.08} shirt={PLUM} apron hair={{ style: "long", color: "#A4502A" }} arm={[-20, -12]} />
      {(() => {
        const [FX, FY] = P(STATIONS[0] + 46, 100, 0);
        const X = FX - 22 * 1.08 - 4;
        const Y = FY - 74 * 1.08;
        return (
          <g>
            <rect x={X - 4} y={Y - 6} width={16} height={9} rx={3} fill="#3A3A3A" />
            {[0, 1, 2].map((j) => (
              <line key={j} x1={X - 6} y1={Y - 3 + j * 4} x2={X - 16 - ((f + j * 3) % 8)} y2={Y - 5 + j * 4} stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={1.5} />
            ))}
          </g>
        );
      })()}
      {cutting && seated && (() => {
        const [FX, FY] = P(STATIONS[1] + 46, 100, 0);
        const sc = tw(f, T2[0] - 10, T2[0] - 4, 0, 1, BACK) * (1 - tw(f, T2[2] + 6, T2[2] + 12));
        return <ScissorsAt X={FX - 22 * 1.08 - 6} Y={FY - (74 - snip * 2) * 1.08} open={1 - snip} s={sc} />;
      })()}
      {T2.map((s) =>
        Array.from({ length: 7 }).map((_, j) => {
          const t = f - s;
          if (t < 0 || t > 26) return null;
          const [X, Y] = P(SEAT[0] + 14 + (rand(j + s) - 0.5) * 20, SEAT[1] - 4, Math.max(36, 72 - t * 2.2));
          return <rect key={`${s}-${j}`} x={X} y={Y} width={2} height={7} rx={1} fill="#2A1E1A" opacity={1 - t / 26} transform={`rotate(${t * 14 + j * 40} ${X} ${Y})`} />;
        }),
      )}

      {/* reception */}
      <Figure x={135} y={262} f={f} seed={41} shirt={PLUM} skin="#E3B48E" hair={{ style: "long", color: "#16261E", view: "front" }} />
      <Box x={DESK.x0} y={DESK.y0} dx={DESK.x1 - DESK.x0} dy={DESK.y1 - DESK.y0} dz={DESK.h} color="#FFFFFF" top={PLUM} side="#EFE2E4" />
      <g transform={planeY(DESK.y1)}>
        <text x={135} y={-24} textAnchor="middle" fontFamily="PlexMono" fontSize={11} letterSpacing={3} fill={PLUM}>
          GLOW SALON
        </text>
      </g>
      <Box x={176} y={316} z={DESK.h} dx={20} dy={6} dz={32} color="#FFFFFF" />
      <g transform={planeY(322)}>
        <rect x={177} y={-DESK.h - 30} width={18} height={26} fill={PLUM} />
        <image href={staticFile("qr.svg")} x={179} y={-DESK.h - 27} width={14} height={14} style={{ filter: "invert(1)" }} />
      </g>
      <Box x={84} y={312} z={DESK.h} dx={30} dy={18} dz={8} color="#F2C14E" />

      <Box x={PLANT.x - 20} y={PLANT.y - 20} dx={40} dy={40} dz={40} color={PLUM} />
      {(() => {
        const [X, Y] = P(PLANT.x, PLANT.y, 95);
        return <circle cx={X} cy={Y} r={36} fill="#4F8A4A" />;
      })()}

      {mei && mei.x >= 0 && !mei.inChair && meiFig}

      <Box x={SOFA.x0} y={SOFA.y0} dx={SOFA.x1 - SOFA.x0} dy={SOFA.y1 - SOFA.y0 - 10} dz={30} color={PINK} top="#EE9BB2" />
      <Figure x={500} y={478} f={f} seed={51} sit faceLeft shirt="#7FB069" skin="#8D5A3B" hair={{ style: "long", color: "#2A1E1A", view: "front" }} />
      <Box x={SOFA.x0} y={SOFA.y1 - 10} dx={SOFA.x1 - SOFA.x0} dy={10} dz={64} color={PINK} top="#EE9BB2" />
    </g>
  );
};

// ---------- overlays ----------
const Sparkles: React.FC<{ c: Cam; f: number }> = ({ c, f }) => {
  const t = f - CLAIM + 14;
  if (t < 0 || f >= LEAVE) return null;
  const [X, Y] = toScreen(c, ...P(SEAT[0], SEAT[1], 70));
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2 + t / 9;
        const r = (12 + t * 0.6) * c.s;
        const s = Math.sin(Math.min(1, t / 44) * Math.PI) * (3 + rand(i) * 3) * c.s;
        const x = X + Math.cos(a) * r;
        const y = Y + Math.sin(a) * r * 0.7;
        return <path key={i} d={`M${x} ${y - s * 2} L${x + s * 0.5} ${y} L${x} ${y + s * 2} L${x - s * 0.5} ${y} Z M${x - s * 2} ${y} L${x} ${y - s * 0.5} L${x + s * 2} ${y} L${x} ${y + s * 0.5} Z`} fill={i % 2 ? "#FFD98A" : "#FFFFFF"} />;
      })}
    </svg>
  );
};

const Card: React.FC<{ f: number; c: Cam }> = ({ f, c }) => {
  const join = tw(f, T1[1], T1[1] + 8) * (1 - tw(f, T1[2] + 10, T1[2] + 18));
  const pts = tw(f, VISITS[0].at, VISITS[0].at + 8) * (1 - tw(f, LEAVE, LEAVE + 8));
  const show = Math.max(join, pts);
  if (show <= 0.001) return null;
  const s = tw(show, 0, 1, 0.6, 1, BACK);
  const mei = meiAt(f);
  const fx = mei ? mei.x : SEAT[0];
  const fy = mei ? mei.y : SEAT[1];
  const [hx, hy] = toScreen(c, ...P(fx, fy + 12, 0));
  const top = 1262;
  const W = 470;
  const cx = Math.min(1080 - W / 2 - 40, Math.max(W / 2 + 40, hx));
  const p = Math.round(pointsAt(f));
  const rewardOn = f >= REWARD;
  const claimed = f >= CLAIM;
  const visit = VISITS.filter((v) => f >= v.at).pop();
  const bump = visit ? tw(f, visit.at, visit.at + 8, 1.3, 1, BACK) : 1;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: show }}>
        <line x1={cx} y1={top} x2={hx} y2={hy} stroke={C.sand} strokeWidth={6} strokeDasharray="6 8" strokeOpacity={0.9} />
        <line x1={cx} y1={top} x2={hx} y2={hy} stroke={PLUM} strokeWidth={3} strokeDasharray="6 8" />
        <circle cx={hx} cy={hy} r={8} fill={PLUM} stroke={C.sand} strokeWidth={3} />
      </svg>
      <div style={{ position: "absolute", left: cx - W / 2, top, width: W, scale: `${s}`, transformOrigin: "50% 0", opacity: Math.min(1, show * 2) }}>
        <div style={{ background: C.sand, borderRadius: 26, padding: "22px 28px", boxShadow: "0 24px 60px rgba(0,0,0,0.35)", fontFamily: FONT.sans, color: C.ink }}>
          {join > 0 && f < 200 ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 600, color: C.ink2 }}>Glow Salon</div>
              <div style={{ fontSize: 34, fontWeight: 800 }}>You joined</div>
              <div style={{ fontSize: 22, color: C.ink2, marginTop: 4 }}>1 point for every RM 1</div>
            </>
          ) : claimed ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 58, height: 58, borderRadius: "50%", background: C.coral, display: "grid", placeItems: "center", scale: `${tw(f, CLAIM, CLAIM + 8, 1.8, 1, BACK)}` }}>
                <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800 }}>Reward claimed</div>
                <div style={{ fontSize: 24, color: C.ink2 }}>A free colour</div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 24, color: C.ink2, whiteSpace: "nowrap" }}>{rewardOn ? "Glow Salon" : `${visit?.service} · RM ${visit?.rm}`}</div>
                <div style={{ fontFamily: FONT.mono, fontSize: 20, letterSpacing: "0.16em", color: C.ink2, whiteSpace: "nowrap" }}>{visit?.month} · VISIT {VISITS.filter((v) => f >= v.at).length}</div>
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, marginTop: 2, scale: `${rewardOn ? tw(f, REWARD, REWARD + 8, 1.3, 1, BACK) : bump}`, transformOrigin: "0 50%", whiteSpace: "nowrap" }}>{rewardOn ? "Reward unlocked" : `+${visit?.rm} points`}</div>
              <div style={{ marginTop: 14, height: 14, borderRadius: 99, background: C.sandAlt, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(1, p / GOAL) * 100}%`, height: "100%", background: rewardOn ? C.coral : C.leaf, borderRadius: 99 }} />
              </div>
              <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 20, color: C.ink2, fontVariantNumeric: "tabular-nums" }}>
                <span>{p} points</span>
                <span>Free colour at {GOAL}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

const Headlines: React.FC<{ f: number }> = ({ f }) => {
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
  const n = VISITS.filter((v) => f >= v.at).length;
  return (
    <>
      <div style={{ position: "absolute", left: 40, right: 40, top: 424 }}>
        {L("Walk in for a cut.", "Leave as a regular.", 10, 148)}
        {L("Every RM spent", "becomes points.", 164, 270)}
        {L("Back every month,", "a new look each time.", 290, 384)}
        {L("500 points,", "a free colour.", 402, PULL[0] - 4)}
      </div>
    </>
  );
};

const Sfx: React.FC<{ at: number; src: string; vol?: number }> = ({ at, src, vol = 0.5 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={60} layout="none">
    <Audio src={staticFile(src)} volume={vol} />
  </Sequence>
);
const SOUND = [
  { at: T1[1], src: "sfx/interface/drop_001.ogg", vol: 0.45 },
  ...T2.map((s) => ({ at: s - 1, src: "sfx/ui/switch1.ogg", vol: 0.4 })),
  ...VISITS.map((v) => ({ at: v.at - 1, src: "sfx/web/mouse-click.wav", vol: 0.45 })),
  { at: REWARD, src: "sfx/web/ding.wav", vol: 0.3 },
  { at: CLAIM - 1, src: "sfx/impact/impactBell_heavy_000.ogg", vol: 0.3 },
  { at: PULL[0], src: "sfx/web/whoosh.wav", vol: 0.35 },
  { at: PULL[0] + 10, src: "sfx/web/whoosh.wav", vol: 0.25 },
  ...endSfx(END),
];

export const Salon: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const c = cam(f);
  const flash = VISITS.slice(1).reduce((a, v) => a + (f >= v.at && f < v.at + 6 ? (1 - (f - v.at) / 6) * 0.35 : 0), 0);
  const world = (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <g transform={camTransform(c)}>
        <Room f={f} />
      </g>
    </svg>
  );
  return (
    <AbsoluteFill style={{ background: "#3A1426", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(1200px 1400px at 50% 45%, #6B2A45 0%, #3A1426 60%, #1E0A14 100%)" }} />
      <AbsoluteFill style={{ filter: "saturate(1.15)" }}>{world}</AbsoluteFill>
      <AbsoluteFill
        style={{
          filter: "blur(8px) saturate(1.15)",
          WebkitMaskImage: "linear-gradient(180deg, black 0%, transparent 30%, transparent 66%, black 100%)",
          maskImage: "linear-gradient(180deg, black 0%, transparent 30%, transparent 66%, black 100%)",
          opacity: 1 - tw(f, PULL[0], PULL[1]),
        }}
      >
        {world}
      </AbsoluteFill>
      <Sparkles c={c} f={f} />
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash, mixBlendMode: "overlay" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(30,8,18,0.7) 0%, rgba(30,8,18,0.6) 29%, rgba(30,8,18,0.25) 35%, rgba(30,8,18,0) 41%)", opacity: 1 - tw(f, PULL[0], PULL[1]) }} />
      <Card f={f} c={c} />
      <Headlines f={f} />
      <Grain f={f} />
      <StandardEnd f={f} start={END} />
      <Audio src={staticFile("music/pink-panther.mp3")} trimBefore={81 * 30} volume={(fr) => endDuck(fr, END) * interpolate(fr, [0, 3, SALON_LEN - 56, SALON_LEN - 4], [0, 0.8, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {SOUND.map((s, k) => (
        <Sfx key={k} {...s} />
      ))}
    </AbsoluteFill>
  );
};
