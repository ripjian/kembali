// Nine small businesses, each a cut-away plot 300×300 with its origin at (ox, oy).
// Everything is drawn back to front by hand: walls, then the back of the room,
// then the front. x → screen lower-right, y → screen lower-left.
import React from "react";
import { staticFile } from "remotion";
import { C, rand } from "../lib";
import { P, pts, planeX, planeY, planeZ, Box, Figure, HairShape } from "../iso/kit";

export const PLOT = 300;
export const WALL_H = 170;

export type Biz = {
  key: string;
  label: string; // plural, for the headline
  name: string;
  color: string; // tenant brand colour
  accent: string;
  rule: string;
  kind: "stamps" | "points";
  total: number;
  have: number; // after this visit
  gain?: number;
  prize?: string;
  wall: string;
  floor: string;
};

export const BIZ: Biz[] = [
  { key: "cafe", label: "Cafés", name: "Corner Coffee", color: "#5B3A29", accent: "#D98A2B", rule: "9 coffees, the 10th is free.", kind: "stamps", total: 9, have: 6, wall: "#F1E4CB", floor: "#EFE7D6" },
  { key: "wash", label: "Car washes", name: "Tide Car Wash", color: "#12436B", accent: "#3A9BD9", rule: "5 washes, the 6th is free.", kind: "stamps", total: 5, have: 4, wall: "#DCE8F0", floor: "#5B6166" },
  { key: "salon", label: "Salons", name: "Glow Salon", color: "#6B4B8A", accent: "#B9A3D9", rule: "Points on every visit.", kind: "points", total: 500, have: 380, gain: 85, prize: "free treatment", wall: "#ECE4F4", floor: "#F4EEF8" },
  { key: "gym", label: "Gyms", name: "Iron Hall", color: "#16261E", accent: "#F2C14E", rule: "10 classes, the 11th is free.", kind: "stamps", total: 10, have: 7, wall: "#D8DCD9", floor: "#3B4240" },
  { key: "bakery", label: "Bakeries", name: "Bloom Bakery", color: "#7A2E4A", accent: "#E27396", rule: "7 buns, the 8th is free.", kind: "stamps", total: 7, have: 4, wall: "#FBE7EC", floor: "#F6EADB" },
  { key: "barber", label: "Barbers", name: "Sharp Cuts", color: "#2D6CB5", accent: "#E0684B", rule: "4 cuts, the 5th is free.", kind: "stamps", total: 4, have: 3, wall: "#E7EEF6", floor: "#EDEDED" },
  { key: "florist", label: "Florists", name: "Petal & Stem", color: "#3F5B2E", accent: "#C77DFF", rule: "Points on every bouquet.", kind: "points", total: 400, have: 260, gain: 60, prize: "free bouquet", wall: "#EAF2E1", floor: "#EDE6D6" },
  { key: "laundry", label: "Laundromats", name: "Spin Laundry", color: "#0E7C86", accent: "#2FB3BD", rule: "10 washes, the 11th is free.", kind: "stamps", total: 10, have: 9, wall: "#E3F1F6", floor: "#E9EEF0" },
  { key: "pets", label: "Pet groomers", name: "Happy Paws", color: "#A8321F", accent: "#F6B26B", rule: "5 baths, the 6th is free.", kind: "stamps", total: 5, have: 2, wall: "#FBEBDD", floor: "#F3E3CC" },
];

// customer standing spot per plot (local), where the stamp happens
export const CUSTOMER: Record<string, [number, number]> = {
  cafe: [130, 150],
  wash: [60, 230],
  salon: [90, 245],
  gym: [235, 215],
  bakery: [150, 175],
  barber: [232, 190],
  florist: [215, 160],
  laundry: [110, 215],
  pets: [235, 245],
};

// walls lower (dollhouse cutaway) when this plot stands in front of the one in focus
const WallCtx = React.createContext(WALL_H);
// anything hung on a wall fades out with it
const Deco: React.FC<{ transform: string; children: React.ReactNode }> = ({ transform, children }) => {
  const h = React.useContext(WallCtx);
  return (
    <g transform={transform} opacity={Math.max(0, Math.min(1, (h - 130) / 40))}>
      {children}
    </g>
  );
};
const Walls: React.FC<{ ox: number; oy: number; b: Biz }> = ({ ox, oy, b }) => {
  const h = React.useContext(WallCtx);
  return (
  <g>
    <Box x={ox - 8} y={oy - 8} dx={PLOT + 8} dy={8} dz={h} color={b.wall} top="#FFFFFF" side={b.wall} />
    <Box x={ox - 8} y={oy} dx={8} dy={PLOT} dz={h} color={b.wall} top="#FFFFFF" side={b.wall} />
    <g transform={planeY(oy)}>
      <rect x={ox} y={-Math.min(46, h)} width={PLOT} height={Math.min(46, h)} fill={b.color} opacity={0.9} />
      <g opacity={Math.max(0, (h - 130) / 40)}>
        <rect x={ox + 50} y={-158} width={200} height={30} rx={4} fill={b.color} />
        <text x={ox + 150} y={-137} textAnchor="middle" fontFamily="PlexMono" fontSize={14} letterSpacing={2.5} fill="#F6F1E3">
          {b.name.toUpperCase()}
        </text>
      </g>
    </g>
    <g transform={planeX(ox)}>
      <rect x={oy} y={-Math.min(46, h)} width={PLOT} height={Math.min(46, h)} fill={b.color} opacity={0.75} />
    </g>
  </g>
  );
};

const Floor: React.FC<{ ox: number; oy: number; color: string; pattern?: "tiles" | "dots" | "planks" | "none" }> = ({ ox, oy, color, pattern = "none" }) => (
  <g transform={planeZ(0)}>
    <rect x={ox} y={oy} width={PLOT} height={PLOT} fill={color} />
    {pattern === "tiles" &&
      Array.from({ length: 100 }).map((_, i) =>
        (Math.floor(i / 10) + (i % 10)) % 2 ? <rect key={i} x={ox + (i % 10) * 30} y={oy + Math.floor(i / 10) * 30} width={30} height={30} fill="#000" opacity={0.06} /> : null,
      )}
    {pattern === "dots" && Array.from({ length: 60 }).map((_, i) => <circle key={i} cx={ox + rand(i + ox) * PLOT} cy={oy + rand(i + oy + 7) * PLOT} r={2 + rand(i) * 3} fill="#000" opacity={0.08} />)}
    {pattern === "planks" && Array.from({ length: 8 }).map((_, i) => <rect key={i} x={ox} y={oy + i * 38} width={PLOT} height={2} fill="#000" opacity={0.12} />)}
  </g>
);

const Cyl: React.FC<{ x: number; y: number; z?: number; r: number; h: number; color: string; top?: string }> = ({ x, y, z = 0, r, h, color, top }) => {
  const [X0, Y0] = P(x, y, z);
  const [, Y1] = P(x, y, z + h);
  const rx = r * 1.22;
  const ry = r * 0.7;
  return (
    <g>
      <path d={`M${X0 - rx} ${Y1} L${X0 - rx} ${Y0} A ${rx} ${ry} 0 0 0 ${X0 + rx} ${Y0} L${X0 + rx} ${Y1} Z`} fill={color} />
      <ellipse cx={X0} cy={Y1} rx={rx} ry={ry} fill={top ?? color} style={top ? undefined : { filter: "brightness(1.15)" }} />
    </g>
  );
};

// ---------- shared furniture (each draws back to front internally) ----------
type Look = { shirt: string; hair?: { style: "messy" | "bob" | "long" | "short"; color: string } };
// a small table with a stool on each side; diners face the table
const TableSet: React.FC<{ x: number; y: number; f: number; seed: number; left?: Look; right?: Look; top?: string; stool?: string }> = ({ x, y, f, seed, left, right, top = "#F6F1E3", stool = "#8A6545" }) => (
  <g>
    <Box x={x - 44} y={y - 8} dx={18} dy={18} dz={24} color={stool} />
    {left && <Figure x={x - 35} y={y + 1} f={f} seed={seed} sit shirt={left.shirt} hair={left.hair} />}
    <Box x={x - 4} y={y - 4} dx={8} dy={8} dz={40} color="#2A2A2A" />
    <Box x={x - 20} y={y - 20} z={40} dx={40} dy={40} dz={5} color={top} />
    <Box x={x - 12} y={y - 12} z={45} dx={8} dy={8} dz={9} color="#FFFFFF" top="#8A5A3B" />
    {right && <Box x={x + 4} y={y + 2} z={45} dx={8} dy={8} dz={9} color="#FFFFFF" top="#8A5A3B" />}
    <Box x={x + 26} y={y - 8} dx={18} dy={18} dz={24} color={stool} />
    {right && <Figure x={x + 35} y={y + 1} f={f} seed={seed + 1} sit faceLeft shirt={right.shirt} hair={right.hair} />}
  </g>
);
// a bench along x with people sat on it
const Bench: React.FC<{ x: number; y: number; len: number; f: number; seed: number; people: Look[]; color: string }> = ({ x, y, len, f, seed, people, color }) => (
  <g>
    <Box x={x} y={y - 10} dx={len} dy={8} dz={46} color={color} />
    <Box x={x} y={y - 2} dx={len} dy={22} dz={22} color={color} />
    {people.map((p, i) => (
      <Figure key={i} x={x + ((i + 0.5) * len) / people.length} y={y + 8} f={f} seed={seed + i} sit shirt={p.shirt} hair={p.hair} phone={i % 2 ? 1 : 0} />
    ))}
  </g>
);
const Plant: React.FC<{ x: number; y: number; pot?: string; r?: number }> = ({ x, y, pot = "#C4623F", r = 22 }) => {
  const [X, Y] = P(x, y, 30 + r * 1.2);
  return (
    <g>
      <Box x={x - 12} y={y - 12} dx={24} dy={24} dz={26} color={pot} />
      <circle cx={X} cy={Y} r={r} fill="#4F8A4A" />
      <circle cx={X - r * 0.35} cy={Y - r * 0.4} r={r * 0.45} fill="#6FAF62" />
    </g>
  );
};

// ---------- the nine shops ----------
const Cafe: React.FC<{ ox: number; oy: number; f: number; b: Biz; scan: number }> = ({ ox, oy, f, b, scan }) => (
  <g>
    <Floor ox={ox} oy={oy} color={b.floor} pattern="tiles" />
    <Walls ox={ox} oy={oy} b={b} />
    <Deco transform={planeY(oy)}>
      <rect x={ox + 180} y={-120} width={100} height={56} rx={4} fill="#23231F" />
      <rect x={ox + 24} y={-104} width={120} height={4} fill="#6B4B32" />
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x={ox + 30 + i * 19} y={-118} width={12} height={14} rx={2} fill={["#FFFFFF", b.accent, "#FFFFFF"][i % 3]} />
      ))}
    </Deco>
    <Deco transform={planeX(ox)}>
      <rect x={oy + 140} y={-120} width={90} height={60} fill="#CDEBF2" />
      <rect x={oy + 183} y={-120} width={4} height={60} fill="#FFFFFF" />
    </Deco>
    <Box x={ox + 20} y={oy} dx={150} dy={26} dz={50} color="#6B4B32" />
    <Box x={ox + 50} y={oy + 2} z={50} dx={40} dy={22} dz={34} color="#C9CCCB" />
    <Plant x={ox + 280} y={oy + 24} />
    <Figure x={ox + 100} y={oy + 46} f={f} seed={1} shirt="#FFFFFF" apron phone={scan} />
    <Box x={ox + 30} y={oy + 76} dx={170} dy={34} dz={40} color="#F3E9D6" top={b.color} />
    <Box x={ox + 150} y={oy + 82} z={40} dx={40} dy={22} dz={24} color="#D8EEF2" />
    <TableSet x={ox + 248} y={oy + 120} f={f} seed={7} right={{ shirt: "#7FB069", hair: { style: "bob", color: "#2A1E1A" } }} />
    <Figure x={ox + CUSTOMER.cafe[0]} y={oy + CUSTOMER.cafe[1]} f={f} seed={2} shirt="#2D6CB5" phone={1} />
    <TableSet x={ox + 82} y={oy + 238} f={f} seed={8} left={{ shirt: "#F2C14E" }} right={{ shirt: "#16261E", hair: { style: "long", color: "#7A3B2E" } }} />
    <TableSet x={ox + 252} y={oy + 258} f={f} seed={3} left={{ shirt: "#E27396" }} right={{ shirt: "#FFFFFF", hair: { style: "short", color: "#3A2A20" } }} />
  </g>
);

const Wash: React.FC<{ ox: number; oy: number; f: number; b: Biz; scan: number }> = ({ ox, oy, f, b, scan }) => {
  const cycle = 74;
  const t = ((f % cycle) + cycle) % cycle / cycle;
  const carX = ox - 40 + t * 420;
  const carA = Math.min(1, t / 0.1, (1 - t) / 0.06);
  // off the forecourt the car sits on the road surface (20 below the plot base)
  const carZ = -20 * Math.max(0, Math.min(1, (carX + 90 - (ox + 318)) / 12));
  const under = carX > ox + 90 && carX < ox + 180;
  return (
    <g>
      <Floor ox={ox} oy={oy} color={b.floor} />
      <g transform={planeZ(0)}>
        <rect x={ox} y={oy + 95} width={PLOT} height={110} fill="#4A5055" />
        {Array.from({ length: 6 }).map((_, i) => (
          <rect key={i} x={ox + 10 + i * 50} y={oy + 148} width={26} height={4} fill="#E8E2D2" opacity={0.6} />
        ))}
      </g>
      <Deco transform={planeY(oy)}>
        <rect x={ox + 40} y={-40} width={220} height={40} fill={b.color} />
      </Deco>
      {/* pylon sign by the entrance */}
      <Box x={ox + 6} y={oy + 20} dx={14} dy={14} dz={120} color="#9AA3A8" />
      <Box x={ox + 0} y={oy + 6} z={120} dx={26} dy={110} dz={36} color={b.color} />
      <g transform={planeX(ox + 26)}>
        {/* the +x face reads right-to-left in local space, so flip the text back */}
        <text transform={`translate(${oy + 61} 0) scale(-1 1)`} x={0} y={-132} textAnchor="middle" fontFamily="PlexMono" fontSize={12} letterSpacing={1.5} fill="#F6F1E3">
          TIDE CAR WASH
        </text>
      </g>
      {[
        [64, 28, 3],
        [104, 30, 2],
      ].map(([x, y, n], k) => (
        <g key={k}>
          {Array.from({ length: n }).map((_, i) => (
            <g key={i}>
              <Cyl x={ox + x} y={oy + y} z={i * 13} r={15} h={11} color="#1E1E1E" top="#4A4A4A" />
              {(() => {
                const [X, Y] = P(ox + x, oy + y, i * 13 + 11);
                return <ellipse cx={X} cy={Y} rx={7} ry={4} fill="#1E1E1E" />;
              })()}
            </g>
          ))}
        </g>
      ))}
      <Box x={ox + 140} y={oy + 70} dx={22} dy={22} dz={140} color={b.color} />
      {/* brush behind the car */}
      <Cyl x={ox + 175} y={oy + 98} r={14} h={84} color={b.accent} top="#BFE3F5" />
      {(() => {
        const [X, Y] = P(ox + 175, oy + 98, 40);
        return Array.from({ length: 4 }).map((_, i) => <rect key={i} x={X - 16} y={Y - 30 + (((f * 3 + i * 18) % 72) - 10)} width={32} height={4} fill="#FFFFFF" opacity={0.5} />);
      })()}
      {/* car */}
      <g opacity={carA}>
        <Box x={carX} y={oy + 118} z={carZ} dx={90} dy={52} dz={28} color="#E0684B" />
        <Box x={carX + 18} y={oy + 122} z={carZ + 28} dx={50} dy={44} dz={22} color="#DCE6EA" />
        {under &&
          Array.from({ length: 10 }).map((_, i) => {
            const [X, Y] = P(carX + 20 + rand(i) * 60, oy + 120 + rand(i + 4) * 48, 50 + rand(i + 9) * 20 + Math.sin(f / 4 + i) * 4);
            return <circle key={i} cx={X} cy={Y} r={6 + rand(i + 2) * 6} fill="#FFFFFF" opacity={0.9} />;
          })}
      </g>
      <Cyl x={ox + 175} y={oy + 205} r={14} h={84} color={b.accent} top="#BFE3F5" />
      <Box x={ox + 140} y={oy + 210} dx={22} dy={22} dz={140} color={b.color} />
      <Box x={ox + 140} y={oy + 70} z={140} dx={22} dy={162} dz={18} color={b.color} />
      {/* pay kiosk + staff */}
      <Box x={ox + 20} y={oy + 220} dx={26} dy={18} dz={70} color="#F6F1E3" top={b.color} />
      <Figure x={ox + 100} y={oy + 240} f={f} seed={5} shirt="#F2C14E" phone={scan} />
      <Figure x={ox + CUSTOMER.wash[0]} y={oy + CUSTOMER.wash[1]} f={f} seed={6} shirt="#16261E" phone={1} />
      <Bench x={ox + 150} y={oy + 268} len={84} f={f} seed={80} color="#9AA3A8" people={[{ shirt: "#E27396" }, { shirt: "#7FB069", hair: { style: "short", color: "#2A1E1A" } }]} />
      {/* vacuum station */}
      <Box x={ox + 262} y={oy + 250} dx={22} dy={22} dz={70} color="#F2C14E" top={b.color} />
      {(() => {
        const [X1, Y1] = P(ox + 270, oy + 262, 60);
        const [X2, Y2] = P(ox + 250, oy + 262, 6);
        return <path d={`M${X1} ${Y1} Q ${X1 - 30} ${Y1 + 30} ${X2} ${Y2}`} stroke="#2A2A2A" strokeWidth={4} fill="none" />;
      })()}
    </g>
  );
};

const Salon: React.FC<{ ox: number; oy: number; f: number; b: Biz; scan: number }> = ({ ox, oy, f, b, scan }) => (
  <g>
    <Floor ox={ox} oy={oy} color={b.floor} pattern="dots" />
    <Walls ox={ox} oy={oy} b={b} />
    <Deco transform={planeY(oy)}>
      {[90, 210].map((x) => (
        <g key={x}>
          <rect x={ox + x - 40} y={-124} width={80} height={70} rx={8} fill="#F2C9A8" />
          <rect x={ox + x - 35} y={-119} width={70} height={60} rx={5} fill="#CFE6EC" />
        </g>
      ))}
    </Deco>
    <Deco transform={planeX(ox)}>
      <rect x={oy + 120} y={-100} width={110} height={5} fill="#5A3A6B" />
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x={oy + 124 + i * 17} y={-118} width={10} height={18} rx={3} fill={[b.accent, "#FFFFFF", "#F2C14E"][i % 3]} />
      ))}
    </Deco>
    <Box x={ox + 40} y={oy} dx={220} dy={22} dz={44} color="#FFFFFF" />
    {[90, 210].map((x, k) => (
      <g key={x}>
        <Box x={ox + x - 16} y={oy + 56} dx={32} dy={30} dz={22} color="#2E2A2C" />
        <Figure x={ox + x} y={oy + 70} f={f} seed={10 + k} sit faceLeft shirt="#FFFFFF" cape={b.color} hair={{ style: k ? "bob" : "long", color: k ? "#C9A227" : "#2A1E1A" }} />
        <Box x={ox + x - 14} y={oy + 84} z={24} dx={28} dy={6} dz={16} color="#2E2A2C" />
        <Figure x={ox + x + 36} y={oy + 74} f={f} seed={12 + k} shirt={b.color} apron hair={{ style: "short", color: "#16261E" }} />
      </g>
    ))}
    <Figure x={ox + 75} y={oy + 165} f={f} seed={15} shirt={b.color} hair={{ style: "bob", color: "#16261E" }} phone={scan} />
    <Box x={ox + 30} y={oy + 180} dx={90} dy={34} dz={46} color="#FFFFFF" top={b.color} />
    <Plant x={ox + 280} y={oy + 150} />
    <Figure x={ox + CUSTOMER.salon[0]} y={oy + CUSTOMER.salon[1]} f={f} seed={14} shirt="#7FB069" phone={1} hair={{ style: "long", color: "#A4502A" }} />
    <Bench x={ox + 180} y={oy + 238} len={104} f={f} seed={16} color={b.accent} people={[{ shirt: "#2D6CB5", hair: { style: "bob", color: "#2A1E1A" } }, { shirt: "#F6F1E3", hair: { style: "long", color: "#C9A227" } }]} />
  </g>
);

const Gym: React.FC<{ ox: number; oy: number; f: number; b: Biz; scan: number }> = ({ ox, oy, f, b, scan }) => {
  const lift = (Math.sin(f / 7) + 1) / 2;
  return (
    <g>
      <Floor ox={ox} oy={oy} color={b.floor} />
      <Walls ox={ox} oy={oy} b={b} />
      <Deco transform={planeY(oy)}>
        <rect x={ox + 170} y={-120} width={110} height={60} fill="#AEB7B2" />
        <rect x={ox + 172} y={-118} width={106} height={56} fill="#C7D0CB" />
      </Deco>
      {/* dumbbell rack along the side wall */}
      <Box x={ox + 2} y={oy + 140} dx={26} dy={100} dz={34} color="#2A2A2A" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Box key={i} x={ox + 6} y={oy + 146 + i * 19} z={34} dx={18} dy={12} dz={8} color={i % 2 ? b.accent : "#555"} />
      ))}
      {[40, 110].map((x, k) => (
        <g key={x}>
          <Box x={ox + x} y={oy + 20} dx={40} dy={90} dz={12} color="#222" top="#3A3A3A" />
          <Box x={ox + x + 8} y={oy + 16} z={12} dx={24} dy={6} dz={40} color="#555" />
          <Figure x={ox + x + 20} y={oy + 60} z={12} f={f * 2.2} seed={20 + k} walk shirt={k ? b.accent : "#E0684B"} />
        </g>
      ))}
      {/* overhead press: feet planted, the bar travels from the shoulders to overhead */}
      {(() => {
        const z = 50 + lift * 34;
        const [X1, Y1] = P(ox + 172, oy + 70, z);
        const [X2, Y2] = P(ox + 220, oy + 70, z);
        const [HX, HY] = P(ox + 196, oy + 70, 46);
        return (
          <g>
            <Figure x={ox + 196} y={oy + 70} f={f} seed={24} shirt="#2D6CB5" />
            <line x1={HX - 7} y1={HY} x2={X1 + 6} y2={Y1} stroke="#2D6CB5" strokeWidth={4} strokeLinecap="round" />
            <line x1={HX + 7} y1={HY} x2={X2 - 6} y2={Y2} stroke="#2D6CB5" strokeWidth={4} strokeLinecap="round" />
            <line x1={X1} y1={Y1} x2={X2} y2={Y2} stroke="#2A2A2A" strokeWidth={4} />
            <circle cx={X1} cy={Y1} r={9} fill="#16261E" />
            <circle cx={X2} cy={Y2} r={9} fill="#16261E" />
          </g>
        );
      })()}
      {/* punching bag and a boxer */}
      {(() => {
        const swing = Math.sin(f / 5) * 3;
        const [TX, TY] = P(ox + 270, oy + 17, 150);
        const [BX, BY] = P(ox + 270 + swing, oy + 17, 116);
        const jab = Math.max(0, Math.sin(f / 5 + 1.2)) * 10;
        return (
          <g>
            <Box x={ox + 290} y={oy + 14} dx={6} dy={6} dz={154} color="#333" />
            <Box x={ox + 246} y={oy + 14} z={150} dx={50} dy={6} dz={6} color="#333" />
            <line x1={TX} y1={TY} x2={BX} y2={BY} stroke="#777" strokeWidth={2} />
            <rect x={BX - 11} y={BY} width={22} height={58} rx={9} fill="#A8321F" />
            <Figure x={ox + 272} y={oy + 48} f={f} seed={27} shirt="#16261E" arm={[10 + jab, -16]} />
          </g>
        );
      })()}
      <Figure x={ox + 262} y={oy + 160} f={f} seed={26} shirt={b.accent} phone={scan} />
      <Box x={ox + 200} y={oy + 172} dx={80} dy={26} dz={40} color={b.accent} top={b.color} />
      <Figure x={ox + CUSTOMER.gym[0]} y={oy + CUSTOMER.gym[1]} f={f} seed={25} shirt="#E27396" phone={1} />
      {[0, 1, 2].map((i) => (
        <Cyl key={i} x={ox + 60 + i * 26} y={oy + 270} r={9} h={14} color={["#F2C14E", "#2A2A2A", b.accent][i]} top="#444" />
      ))}
    </g>
  );
};

const Bakery: React.FC<{ ox: number; oy: number; f: number; b: Biz; scan: number }> = ({ ox, oy, f, b, scan }) => (
  <g>
    <Floor ox={ox} oy={oy} color={b.floor} pattern="tiles" />
    <Walls ox={ox} oy={oy} b={b} />
    <Deco transform={planeY(oy)}>
      {[0, 1].map((r) => (
        <g key={r}>
          <rect x={ox + 160} y={-118 + r * 32} width={120} height={4} fill="#8A6545" />
          {Array.from({ length: 5 }).map((_, i) => (
            <ellipse key={i} cx={ox + 172 + i * 24} cy={-124 + r * 32} rx={10} ry={6} fill={["#C98A4B", "#E0A060", "#A8642F"][(i + r) % 3]} />
          ))}
        </g>
      ))}
    </Deco>
    <Box x={ox + 20} y={oy} dx={90} dy={40} dz={90} color="#8E8E8E" top="#A8A8A8" />
    <g transform={planeY(oy + 40)}>
      <rect x={ox + 34} y={-70} width={62} height={34} rx={4} fill="#3A1A10" />
      <rect x={ox + 38} y={-66} width={54} height={26} rx={3} fill="#FF9A3C" opacity={0.75 + 0.25 * Math.sin(f / 5)} />
    </g>
    <Box x={ox + 236} y={oy + 2} dx={56} dy={34} dz={100} color="#8A6545" />
    <g transform={planeY(oy + 36)}>
      {[0, 1, 2].map((r) => (
        <g key={r}>
          <rect x={ox + 240} y={-92 + r * 30} width={48} height={4} fill="#6B4B32" />
          {[0, 1, 2].map((i) => (
            <ellipse key={i} cx={ox + 249 + i * 15} cy={-97 + r * 30} rx={7} ry={5} fill={["#C98A4B", "#E0A060", "#A8642F"][(i + r) % 3]} />
          ))}
        </g>
      ))}
    </g>
    <Figure x={ox + 140} y={oy + 50} f={f} seed={30} shirt="#FFFFFF" apron hair={{ style: "short", color: "#3A2A20" }} phone={scan} />
    <Box x={ox + 40} y={oy + 95} dx={210} dy={40} dz={46} color="#FFFFFF" top={b.color} />
    {Array.from({ length: 4 }).map((_, i) => (
      <Box key={i} x={ox + 156 + i * 20} y={oy + 108} z={46} dx={14} dy={12} dz={8} color={["#C98A4B", "#E27396", "#E0A060", "#F6F1E3"][i]} />
    ))}
    <Box x={ox + 150} y={oy + 100} z={46} dx={90} dy={30} dz={26} color="#F7E6EC" opacity={0.45} />
    <Figure x={ox + CUSTOMER.bakery[0]} y={oy + CUSTOMER.bakery[1]} f={f} seed={31} shirt="#2D6CB5" phone={1} hair={{ style: "bob", color: "#16261E" }} />
    <TableSet x={ox + 76} y={oy + 236} f={f} seed={33} top="#FBE7EC" stool={b.color} left={{ shirt: "#7FB069" }} right={{ shirt: "#F2C14E", hair: { style: "long", color: "#2A1E1A" } }} />
    <TableSet x={ox + 262} y={oy + 226} f={f} seed={35} top="#FBE7EC" stool={b.color} right={{ shirt: "#16261E", hair: { style: "bob", color: "#A4502A" } }} />
  </g>
);

const Barber: React.FC<{ ox: number; oy: number; f: number; b: Biz; scan: number }> = ({ ox, oy, f, b, scan }) => (
  <g>
    <Floor ox={ox} oy={oy} color={b.floor} pattern="tiles" />
    <Walls ox={ox} oy={oy} b={b} />
    <Deco transform={planeY(oy)}>
      <rect x={ox + 110} y={-124} width={100} height={70} rx={6} fill="#CFE6EC" />
      <rect x={ox + 22} y={-124} width={80} height={70} rx={6} fill="#CFE6EC" />
    </Deco>
    <Box x={ox + 14} y={oy} dx={206} dy={20} dz={44} color="#FFFFFF" />
    <Box x={ox + 46} y={oy + 56} dx={32} dy={30} dz={22} color="#8A2A1E" />
    <Figure x={ox + 62} y={oy + 70} f={f} seed={44} sit faceLeft shirt="#FFFFFF" cape="#16261E" hair={{ style: "short", color: "#C9A227" }} />
    <Box x={ox + 48} y={oy + 84} z={24} dx={28} dy={6} dz={16} color="#8A2A1E" />
    <Figure x={ox + 102} y={oy + 76} f={f} seed={45} shirt={b.color} apron hair={{ style: "bob", color: "#2A1E1A" }} arm={[-20, -24]} />
    <Box x={ox + 144} y={oy + 56} dx={32} dy={30} dz={22} color="#8A2A1E" />
    <Figure x={ox + 160} y={oy + 70} f={f} seed={40} sit faceLeft shirt="#FFFFFF" cape="#16261E" hair={{ style: "short", color: "#2A1E1A" }} />
    <Box x={ox + 146} y={oy + 84} z={24} dx={28} dy={6} dz={16} color="#8A2A1E" />
    <Figure x={ox + 200} y={oy + 76} f={f} seed={41} shirt={b.color} apron hair={{ style: "short", color: "#16261E" }} phone={scan} />
    {/* barber pole: stripes travel up */}
    {(() => {
      const [X, Y] = P(ox + 14, oy + 200, 0);
      const id = `pole${ox}${oy}`;
      return (
        <g>
          <clipPath id={id}>
            <rect x={X - 9} y={Y - 120} width={18} height={100} rx={9} />
          </clipPath>
          <rect x={X - 9} y={Y - 120} width={18} height={100} rx={9} fill="#FFFFFF" />
          <g clipPath={`url(#${id})`}>
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={i} x1={X - 12} y1={Y - 20 - i * 18 + ((f * 1.5) % 18) + 10} x2={X + 12} y2={Y - 34 - i * 18 + ((f * 1.5) % 18) + 10} stroke={i % 2 ? b.accent : b.color} strokeWidth={7} />
            ))}
          </g>
          <rect x={X - 3} y={Y - 20} width={6} height={20} fill="#555" />
        </g>
      );
    })()}
    <Figure x={ox + CUSTOMER.barber[0]} y={oy + CUSTOMER.barber[1]} f={f} seed={43} shirt="#7FB069" phone={1} />
    <Bench x={ox + 60} y={oy + 232} len={120} f={f} seed={46} color="#2E2A2C" people={[{ shirt: "#F2C14E", hair: { style: "short", color: "#2A1E1A" } }, { shirt: "#2D6CB5", hair: { style: "messy", color: "#3A2A20" } }, { shirt: "#E0684B" }]} />
  </g>
);

const Florist: React.FC<{ ox: number; oy: number; f: number; b: Biz; scan: number }> = ({ ox, oy, f, b, scan }) => (
  <g>
    <Floor ox={ox} oy={oy} color={b.floor} pattern="planks" />
    <Walls ox={ox} oy={oy} b={b} />
    <Deco transform={planeY(oy)}>
      {[0, 1].map((r) => (
        <g key={r}>
          <rect x={ox + 170} y={-130 + r * 34} width={110} height={4} fill="#6B4B32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <g key={i}>
              <rect x={ox + 176 + i * 21} y={-142 + r * 34} width={12} height={12} fill="#C4623F" />
              <circle cx={ox + 182 + i * 21} cy={-146 + r * 34} r={7} fill={["#4F8A4A", "#6FAF62"][(i + r) % 2]} />
            </g>
          ))}
        </g>
      ))}
    </Deco>
    {Array.from({ length: 6 }).map((_, i) => {
      const x = ox + 32 + (i % 3) * 42;
      const y = oy + 34 + Math.floor(i / 3) * 52;
      return (
        <g key={i}>
          <Cyl x={x} y={y} r={14} h={26} color="#5E6B70" top="#2F3A3E" />
          {Array.from({ length: 4 }).map((_, j) => {
            const [SX, SY] = P(x + (j - 1.5) * 5, y, 26);
            const [X, Y] = P(x + (j - 1.5) * 9 + rand(i * 9 + j) * 4, y + (rand(i * 9 + j + 3) - 0.5) * 10, 50 + rand(j + i) * 12 + Math.sin(f / 9 + j) * 1.5);
            return (
              <g key={j}>
                <line x1={SX} y1={SY} x2={X} y2={Y} stroke="#4F8A4A" strokeWidth={2} />
                <circle cx={X} cy={Y} r={8} fill={["#E27396", "#F2C14E", "#E0684B", "#FFFFFF", "#C77DFF"][(i + j) % 5]} />
                <circle cx={X} cy={Y} r={3} fill="#F2C14E" />
              </g>
            );
          })}
        </g>
      );
    })}
    <Figure x={ox + 92} y={oy + 150} f={f} seed={52} shirt="#2D6CB5" hair={{ style: "short", color: "#2A1E1A" }} />
    <Figure x={ox + 210} y={oy + 60} f={f} seed={50} shirt={b.color} apron hair={{ style: "bob", color: "#7A3B2E" }} phone={scan} />
    <Box x={ox + 170} y={oy + 90} dx={110} dy={34} dz={44} color="#8A6545" top="#A57D56" />
    <Figure x={ox + CUSTOMER.florist[0]} y={oy + CUSTOMER.florist[1]} f={f} seed={51} shirt="#F6F1E3" phone={1} hair={{ style: "long", color: "#16261E" }} />
    {(() => {
      const [X, Y] = P(ox + CUSTOMER.florist[0] - 10, oy + CUSTOMER.florist[1], 44);
      return (
        <g>
          {[0, 1, 2].map((j) => (
            <circle key={j} cx={X - 6 + j * 6} cy={Y - 6 - (j % 2) * 4} r={5} fill={["#E27396", "#F2C14E", "#E0684B"][j]} />
          ))}
        </g>
      );
    })()}
    {/* potted plants on a low table */}
    <Box x={ox + 40} y={oy + 220} dx={110} dy={44} dz={26} color="#8A6545" top="#A57D56" />
    {[0, 1, 2].map((i) => (
      <Plant key={i} x={ox + 58 + i * 36} y={oy + 242} r={14 + (i % 2) * 4} pot={["#C4623F", "#F6F1E3", "#3F5B2E"][i]} />
    ))}
  </g>
);

const Laundry: React.FC<{ ox: number; oy: number; f: number; b: Biz; scan: number }> = ({ ox, oy, f, b, scan }) => (
  <g>
    <Floor ox={ox} oy={oy} color={b.floor} pattern="tiles" />
    <Walls ox={ox} oy={oy} b={b} />
    {/* stacked dryers on the side wall */}
    {[0, 1].map((i) => (
      <g key={i}>
        <Box x={ox} y={oy + 70 + i * 0} z={i * 52} dx={44} dy={56} dz={52} color="#E9EEF0" top="#F7FAFB" />
        <g transform={planeX(ox + 44)}>
          <circle cx={oy + 98} cy={-26 - i * 52} r={15} fill="#5C7A8A" />
          <circle cx={oy + 98} cy={-26 - i * 52} r={11} fill="#F2C9A0" opacity={0.6 + 0.4 * Math.sin(f / 4 + i)} />
        </g>
      </g>
    ))}
    {Array.from({ length: 4 }).map((_, i) => {
      const x = ox + 20 + i * 66;
      return (
        <g key={i}>
          <Box x={x} y={oy} dx={58} dy={50} dz={64} color="#FFFFFF" top="#F0F4F6" />
          <g transform={planeY(oy + 50)}>
            <circle cx={x + 29} cy={-30} r={18} fill="#5C7A8A" />
            <circle cx={x + 29} cy={-30} r={14} fill="#9CC7DA" />
            {Array.from({ length: 4 }).map((_, j) => {
              const a = f / (4 + i) + j * 1.57 + i;
              return <circle key={j} cx={x + 29 + Math.cos(a) * 8} cy={-30 + Math.sin(a) * 8} r={3.5} fill={["#E0684B", "#F2C14E", "#FFFFFF", "#2D6CB5"][j]} />;
            })}
            <rect x={x + 6} y={-60} width={46} height={6} rx={2} fill="#D5E0E6" />
          </g>
        </g>
      );
    })}
    <Figure x={ox + 95} y={oy + 130} f={f} seed={61} shirt={b.color} hair={{ style: "short", color: "#2A1E1A" }} phone={scan} />
    <Box x={ox + 40} y={oy + 150} dx={110} dy={44} dz={40} color="#C9CCCB" top="#E9EEF0" />
    {Array.from({ length: 3 }).map((_, i) => (
      <Box key={i} x={ox + 52 + i * 32} y={oy + 160} z={40} dx={24} dy={20} dz={6} color={["#E27396", "#7FB069", "#F2C14E"][i]} />
    ))}
    <Figure x={ox + CUSTOMER.laundry[0]} y={oy + CUSTOMER.laundry[1]} f={f} seed={60} shirt="#6B4B8A" phone={1} hair={{ style: "short", color: "#2A1E1A" }} />
    <Bench x={ox + 184} y={oy + 236} len={100} f={f} seed={62} color={b.color} people={[{ shirt: "#F2C14E", hair: { style: "long", color: "#2A1E1A" } }, { shirt: "#7FB069" }]} />
    <Box x={ox + 210} y={oy + 270} dx={30} dy={24} dz={20} color="#C9CCCB" top="#E27396" />
  </g>
);

const Pets: React.FC<{ ox: number; oy: number; f: number; b: Biz; scan: number }> = ({ ox, oy, f, b, scan }) => {
  const wag = Math.sin(f / 2) * 6;
  const [DX, DY] = P(ox + 150, oy + 80, 52);
  return (
    <g>
      <Floor ox={ox} oy={oy} color={b.floor} pattern="tiles" />
      <Walls ox={ox} oy={oy} b={b} />
      <Deco transform={planeY(oy)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <circle key={i} cx={ox + 200 + i * 16} cy={-100} r={5} fill={b.accent} />
        ))}
      </Deco>
      <Deco transform={planeX(ox)}>
        <rect x={oy + 150} y={-104} width={110} height={5} fill="#6B4B32" />
        {Array.from({ length: 6 }).map((_, i) => (
          <rect key={i} x={oy + 154 + i * 17} y={-122} width={11} height={18} rx={2} fill={[b.accent, b.color, "#7FB069"][i % 3]} />
        ))}
      </Deco>
      {/* a dog waiting in a crate */}
      {(() => {
        const [X, Y] = P(ox + 46, oy + 46, 12);
        return (
          <g>
            <Box x={ox + 18} y={oy + 20} dx={56} dy={52} dz={4} color="#C9CCCB" />
            <ellipse cx={X} cy={Y} rx={13} ry={7} fill="#6B4B32" />
            <circle cx={X - 12} cy={Y - 6} r={6} fill="#6B4B32" />
            <circle cx={X - 14} cy={Y - 7} r={1.4} fill="#F6F1E3" />
            {Array.from({ length: 6 }).map((_, i) => {
              const [X1, Y1] = P(ox + 18 + i * 11, oy + 72, 4);
              const [X2, Y2] = P(ox + 18 + i * 11, oy + 72, 44);
              return <line key={i} x1={X1} y1={Y1} x2={X2} y2={Y2} stroke="#8E9AA0" strokeWidth={2} />;
            })}
            <Box x={ox + 18} y={oy + 20} z={44} dx={56} dy={52} dz={3} color="#C9CCCB" />
          </g>
        );
      })()}
      <Box x={ox + 100} y={oy + 50} dx={100} dy={60} dz={40} color="#DDE6EA" top="#BFD8E2" />
      {/* the dog in the tub */}
      <g>
        <ellipse cx={DX} cy={DY} rx={20} ry={11} fill="#E3B07A" />
        <circle cx={DX - 18} cy={DY - 10} r={9} fill="#E3B07A" />
        <ellipse cx={DX - 24} cy={DY - 14} rx={4} ry={7} fill="#B07A45" />
        <circle cx={DX - 21} cy={DY - 11} r={1.6} fill="#16261E" />
        <line x1={DX + 18} y1={DY - 4} x2={DX + 26 + wag * 0.3} y2={DY - 14 + wag} stroke="#E3B07A" strokeWidth={4} strokeLinecap="round" />
        {Array.from({ length: 8 }).map((_, i) => (
          <circle key={i} cx={DX - 20 + rand(i) * 40 + Math.sin(f / 6 + i) * 2} cy={DY - 4 - rand(i + 3) * 16 - ((f / 2 + i * 5) % 18)} r={3 + rand(i + 7) * 3} fill="#FFFFFF" opacity={0.85} />
        ))}
      </g>
      <Figure x={ox + 220} y={oy + 90} f={f} seed={70} shirt={b.color} apron hair={{ style: "bob", color: "#2A1E1A" }} arm={[-22, -8]} />
      {/* a dog asleep on its bed */}
      {(() => {
        const [X, Y] = P(ox + 70, oy + 200, 8);
        const breathe = 1 + Math.sin(f / 10) * 0.05;
        return (
          <g>
            <ellipse cx={X} cy={Y + 4} rx={30} ry={15} fill={b.accent} />
            <ellipse cx={X} cy={Y} rx={16 * breathe} ry={9 * breathe} fill="#B07A45" />
            <circle cx={X - 13} cy={Y - 2} r={7} fill="#B07A45" />
          </g>
        );
      })()}
      <Figure x={ox + 235} y={oy + 175} f={f} seed={72} shirt={b.color} hair={{ style: "short", color: "#3A2A20" }} phone={scan} />
      <Box x={ox + 190} y={oy + 190} dx={90} dy={30} dz={44} color={b.accent} top={b.color} />
      <Figure x={ox + CUSTOMER.pets[0]} y={oy + CUSTOMER.pets[1]} f={f} seed={71} shirt="#2D6CB5" phone={1} />
      {/* a second dog waiting with its owner */}
      {(() => {
        const [X, Y] = P(ox + CUSTOMER.pets[0] - 30, oy + CUSTOMER.pets[1] + 10, 10);
        return (
          <g>
            {[-8, -3, 4, 9].map((dx, q) => (
              <rect key={q} x={X + dx - 1.5} y={Y + 2} width={3} height={9} fill="#3A2A20" />
            ))}
            <ellipse cx={X} cy={Y} rx={12} ry={7} fill="#3A2A20" />
            <circle cx={X - 11} cy={Y - 6} r={6} fill="#3A2A20" />
            <line x1={X + 10} y1={Y - 3} x2={X + 15} y2={Y - 10 + wag * 0.6} stroke="#3A2A20" strokeWidth={3} strokeLinecap="round" />
          </g>
        );
      })()}
    </g>
  );
};

const VIEWS: Record<string, React.FC<{ ox: number; oy: number; f: number; b: Biz; scan: number }>> = {
  cafe: Cafe,
  wash: Wash,
  salon: Salon,
  gym: Gym,
  bakery: Bakery,
  barber: Barber,
  florist: Florist,
  laundry: Laundry,
  pets: Pets,
};

export const PlotView: React.FC<{ ox: number; oy: number; f: number; b: Biz; wallH?: number; scan?: number }> = ({ ox, oy, f, b, wallH = WALL_H, scan = 0 }) => {
  const V = VIEWS[b.key];
  return (
    <WallCtx.Provider value={wallH}>
    <g>
      <Box x={ox - 18} y={oy - 18} z={-20} dx={PLOT + 36} dy={PLOT + 36} dz={20} color="#D9D2C0" top="#E6DFCC" side="#C2B9A3" />
      <V ox={ox} oy={oy} f={f} b={b} scan={scan} />
    </g>
    </WallCtx.Provider>
  );
};

