// Shared isometric toolkit for the diorama reels (street, café, market).
import React from "react";
import { C, FONT, tw, EO, EI, EIO, BACK, rand } from "../lib";

export const P = (x: number, y: number, z = 0): [number, number] => [0.866 * (x - y), 0.5 * (x + y) - z];
export const pts = (list: [number, number, number][]) => list.map(([x, y, z]) => P(x, y, z).join(",")).join(" ");

// SVG transforms that map a flat local drawing onto a plane of the world
export const planeY = (y: number) => {
  const [e, f] = P(0, y, 0);
  return `matrix(0.866 0.5 0 1 ${e} ${f})`; // local (u = x, v = -z)
};
export const planeX = (x: number) => {
  const [e, f] = P(x, 0, 0);
  return `matrix(-0.866 0.5 0 1 ${e} ${f})`; // local (w = y, v = -z)
};
export const planeZ = (z: number) => {
  const [e, f] = P(0, 0, z);
  return `matrix(0.866 0.5 -0.866 0.5 ${e} ${f})`; // local (u = x, s = y)
};

export const Box: React.FC<{ x: number; y: number; z?: number; dx: number; dy: number; dz: number; color: string; top?: string; side?: string; opacity?: number }> = ({
  x,
  y,
  z = 0,
  dx,
  dy,
  dz,
  color,
  top,
  side,
  opacity = 1,
}) => (
  <g opacity={opacity}>
    <polygon points={pts([[x, y + dy, z], [x + dx, y + dy, z], [x + dx, y + dy, z + dz], [x, y + dy, z + dz]])} fill={color} />
    <polygon points={pts([[x + dx, y, z], [x + dx, y + dy, z], [x + dx, y + dy, z + dz], [x + dx, y, z + dz]])} fill={side ?? color} style={side ? undefined : { filter: "brightness(0.8)" }} />
    <polygon points={pts([[x, y, z + dz], [x + dx, y, z + dz], [x + dx, y + dy, z + dz], [x, y + dy, z + dz]])} fill={top ?? color} style={top ? undefined : { filter: "brightness(1.12)" }} />
  </g>
);

const SHIRTS = ["#E0684B", "#2D6CB5", "#F2C14E", "#7FB069", "#FFFFFF", "#6B4B8A", "#16261E", "#E27396"];
const SKINS = ["#8D5A3B", "#C58C62", "#E3B48E", "#6B4029"];

// view "back": seen from behind (hair covers the head); "front": face visible (mirror)
export type Hair = { style: "messy" | "bob" | "long" | "short"; color: string; shine?: number; trim?: number; view?: "back" | "front" };

// hair drawn around a head centred at (X, Y), radius 9
export const HairShape: React.FC<{ X: number; Y: number; h: Hair }> = ({ X, Y, h }) => {
  const c = h.color;
  return (
    <g>
      {h.view === "back" && <circle cx={X} cy={Y} r={9.5} fill={c} />}
      {h.style === "messy" &&
        (() => {
          // spikes shorten as the cut progresses (trim 0 → 1)
          const k = 1 - (h.trim ?? 0) * 0.75;
          return (
            <path
              d={`M${X - 11} ${Y + 1} L${X - 9 - 4 * k} ${Y - 6} L${X - 8} ${Y - 7} L${X - 7 - 2 * k} ${Y - 8 - 5 * k} L${X - 3} ${Y - 10} L${X} ${Y - 9 - 6 * k} L${X + 3} ${Y - 10} L${X + 7 + 2 * k} ${Y - 8 - 5 * k} L${X + 8} ${Y - 7} L${X + 9 + 4 * k} ${Y - 6} L${X + 11} ${Y + 1} L${X + 7} ${Y - 3} L${X - 7} ${Y - 3} Z`}
              fill={c}
            />
          );
        })()}
      {h.style === "bob" && <path d={`M${X - 11} ${Y + 6} L${X - 11} ${Y - 2} A 11 11 0 0 1 ${X + 11} ${Y - 2} L${X + 11} ${Y + 6} L${X + 6} ${Y + 6} L${X + 6} ${Y - 2} L${X - 6} ${Y - 2} L${X - 6} ${Y + 6} Z`} fill={c} />}
      {h.style === "long" &&
        (h.view === "front" ? (
          <>
            <path d={`M${X - 11} ${Y} A 11 11 0 0 1 ${X + 11} ${Y} Z`} fill={c} />
            <rect x={X - 12} y={Y - 2} width={5} height={20} rx={2} fill={c} />
            <rect x={X + 7} y={Y - 2} width={5} height={20} rx={2} fill={c} />
          </>
        ) : (
          <>
            <rect x={X - 11} y={Y - 2} width={22} height={22} rx={5} fill={c} />
            <path d={`M${X - 11} ${Y} A 11 11 0 0 1 ${X + 11} ${Y} Z`} fill={c} />
          </>
        ))}
      {h.style === "short" && <path d={`M${X - 9} ${Y - 2} A 9 9 0 0 1 ${X + 9} ${Y - 2} Z`} fill={c} />}
      {h.shine ? <path d={`M${X - 6} ${Y - 7} A 8 8 0 0 1 ${X + 2} ${Y - 9}`} stroke="#FFFFFF" strokeOpacity={0.7 * h.shine} strokeWidth={2.5} fill="none" strokeLinecap="round" /> : null}
    </g>
  );
};

// A figure standing on (x, y, z). walk: phase-driven step; phone: 0..1 raises a lit phone.
export const Figure: React.FC<{
  x: number;
  y: number;
  z?: number;
  f: number;
  seed: number;
  walk?: boolean;
  phone?: number;
  shirt?: string;
  apron?: boolean;
  sit?: boolean;
  faceLeft?: boolean;
  alpha?: number;
  scale?: number;
  hair?: Hair;
  cape?: string;
  capeOpacity?: number;
  skin?: string;
  pace?: number; // frames per step phase; smaller = quicker steps
  arm?: [number, number]; // screen offset of a reaching hand
}> = ({ x, y, z = 0, f, seed, walk, phone = 0, shirt, apron, sit, faceLeft, alpha = 1, scale = 1, hair, cape, capeOpacity = 1, skin, pace = 3, arm }) => {
  const [X, Y0] = P(x, y, z);
  const Y = Y0;
  const bob = walk ? Math.abs(Math.sin(f / pace + seed)) * 3 : 0;
  const leg = walk ? Math.sin(f / pace + seed) * 5 : 0;
  const sh = shirt ?? SHIRTS[Math.floor(rand(seed) * SHIRTS.length)];
  const sk = skin ?? SKINS[Math.floor(rand(seed + 3) * SKINS.length)];
  return (
    <g opacity={alpha} transform={`translate(${X} ${Y}) scale(${scale}) translate(${-X} ${-Y})`}>
      {!sit && <ellipse cx={X + 6} cy={Y + 2} rx={14} ry={5} fill="#000" opacity={0.2} />}
      {sit && (
        <>
          <rect x={faceLeft ? X - 14 : X - 6} y={Y - 30} width={20} height={7} rx={3} fill="#2B2B33" />
          <rect x={faceLeft ? X - 14 : X + 9} y={Y - 26} width={5} height={24} rx={2} fill="#2B2B33" />
        </>
      )}
      {!sit && (
        <>
          <rect x={X - 6 + leg * 0.3} y={Y - 26} width={5} height={26} rx={2} fill="#2B2B33" />
          <rect x={X + 1 - leg * 0.3} y={Y - 26} width={5} height={26} rx={2} fill="#2B2B33" />
        </>
      )}
      <rect x={X - 9} y={Y - 56 - bob} width={18} height={32} rx={8} fill={sh} />
      {apron && <rect x={X - 7} y={Y - 48 - bob} width={14} height={26} rx={3} fill="#5B3A29" />}
      {arm && <line x1={X - 6} y1={Y - 50 - bob} x2={X + arm[0]} y2={Y - 50 - bob + arm[1]} stroke={sh} strokeWidth={5} strokeLinecap="round" />}
      <circle cx={X} cy={Y - 66 - bob} r={9} fill={sk} />
      {cape && <path d={`M${X - 13} ${Y - 26 - bob} L${X - 7} ${Y - 58 - bob} L${X + 7} ${Y - 58 - bob} L${X + 13} ${Y - 26 - bob} Z`} fill={cape} opacity={capeOpacity} />}
      {hair ? <HairShape X={X} Y={Y - 66 - bob} h={hair} /> : <path d={`M${X - 9} ${Y - 68 - bob} A 9 9 0 0 1 ${X + 9} ${Y - 68 - bob} Z`} fill="#1B1512" />}
      {phone > 0 && (
        <g transform={`translate(${X + 8} ${Y - 44 - bob - phone * 10})`}>
          <rect x={-4} y={-7} width={9} height={14} rx={2} fill="#1B1B1B" />
          <rect x={-3} y={-6} width={7} height={11} rx={1} fill="#BFE3C7" opacity={phone} />
        </g>
      )}
    </g>
  );
};

// Camera: world-space keyframes, scale interpolated in log space.
export type CamKey = { f: number; x: number; y: number; z: number; s: number; ay?: number };
export const makeCam = (K: CamKey[], lastEase: (t: number) => number = EIO) => (f: number) => {
  let i = 0;
  while (i < K.length - 2 && f >= K[i + 1].f) i++;
  const a = K[i];
  const b = K[i + 1];
  const t = tw(f, a.f, b.f, 0, 1, i === K.length - 2 ? lastEase : EIO);
  const [ax, ay] = P(a.x, a.y, a.z);
  const [bx, by] = P(b.x, b.y, b.z);
  const s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * t);
  const anchor = (a.ay ?? 1000) + ((b.ay ?? 1000) - (a.ay ?? 1000)) * t;
  return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, s, ay: anchor };
};
export type Cam = ReturnType<ReturnType<typeof makeCam>>;
export const camTransform = (c: Cam) => `translate(540 ${c.ay}) scale(${c.s}) translate(${-c.x} ${-c.y})`;
export const toScreen = (c: Cam, X: number, Y: number): [number, number] => [(X - c.x) * c.s + 540, (Y - c.y) * c.s + c.ay];

// Screen-space card that pops above an anchor with a tail.
export const Bubble: React.FC<{ x: number; y: number; t: number; out?: number; children: React.ReactNode; width?: number }> = ({ x, y, t, out = 0, children, width = 380 }) => {
  if (t <= 0 || out >= 1) return null;
  const s = tw(t, 0, 1, 0, 1, BACK);
  const cx = Math.min(1080 - width / 2 - 30, Math.max(width / 2 + 30, x));
  return (
    <div style={{ position: "absolute", left: cx - width / 2, top: y, width, translate: "0 -100%", scale: `${s * (1 - out * 0.2)}`, opacity: 1 - out, transformOrigin: `${x - cx + width / 2}px 100%` }}>
      <div style={{ background: C.sand, borderRadius: 26, padding: "22px 26px", boxShadow: "0 24px 60px rgba(0,0,0,0.35)", fontFamily: FONT.sans, color: C.ink }}>{children}</div>
      <div style={{ position: "absolute", left: x - cx + width / 2 - 14, bottom: -12, width: 28, height: 28, background: C.sand, rotate: "45deg", borderRadius: 4 }} />
    </div>
  );
};

export const Dots: React.FC<{ n: number; popAt?: number; f: number; size?: number }> = ({ n, popAt, f, size = 24 }) => (
  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
    {Array.from({ length: 9 }).map((_, k) => {
      const on = k < n;
      const pop = on && popAt !== undefined && k === n - 1 ? tw(f, popAt, popAt + 8, 1.9, 1, BACK) : 1;
      return <div key={k} style={{ width: size, height: size, borderRadius: "50%", background: on ? C.coral : "transparent", border: on ? "none" : `3px solid ${C.border}`, scale: `${pop}` }} />;
    })}
  </div>
);

// "+1" coral orb that pops and floats
export const PlusOne: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  if (t < 0 || t > 30) return null;
  const pop = tw(t, 0, 8, 1.8, 1, BACK);
  const o = 1 - tw(t, 20, 30);
  return (
    <div style={{ position: "absolute", left: x - 34, top: y - 34 - t * 1.4, width: 68, height: 68, borderRadius: "50%", background: C.coral, color: C.white, display: "grid", placeItems: "center", fontFamily: FONT.sans, fontWeight: 800, fontSize: 30, scale: `${pop}`, opacity: o, boxShadow: "0 0 30px rgba(224,104,75,0.7), 0 0 0 5px rgba(246,241,227,0.9)" }}>
      +1
    </div>
  );
};

export { EO, EI, EIO, BACK };
