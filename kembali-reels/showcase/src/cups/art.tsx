// Top-down cups, drinks and latte art, all vector. Coordinates are cup-centred
// (0,0); the coffee surface has radius 180.
import React, { useId } from "react";

const useSvgId = (p: string) => p + useId().replace(/[^a-zA-Z0-9]/g, "");
import { C } from "../lib";
import { rand } from "../lib";

export type Drink = "latte" | "americano" | "iced" | "takeaway" | "mocha" | "matcha";
export type Art = "rosetta" | "heart" | "tulip" | "logo" | "none" | "cocoa";

export type CupSpec = {
  drink: Drink;
  art: Art;
  ceramic: string;
  rim?: string; // e.g. the green rim of a kopitiam cup
  handle: number; // degrees
};

const FOAM = "#F5EADB";

const coffeeFill = (d: Drink) =>
  d === "americano" ? ["#6B3A1E", "#2A140A"] : d === "matcha" ? ["#B9CF8A", "#7E9B4E"] : d === "mocha" ? ["#EBD9C3", "#C9A27F"] : ["#C99060", "#7A4526"];


const Rosetta: React.FC<{ t: number; bg: string }> = ({ t, bg }) => {
  const reveal = 140 - t * 300;
  const id = useSvgId("ros");
  return (
    <g>
      <clipPath id={id}>
        <rect x={-200} y={reveal} width={400} height={400} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <path d="M0 140 C -150 90, -150 -40, 0 -140 C 150 -40, 150 90, 0 140 Z" fill={FOAM} />
        {Array.from({ length: 8 }).map((_, j) => {
          const y = 105 - j * 30;
          const w = 118 - Math.abs(j - 3) * 16;
          return <path key={j} d={`M ${-w} ${y + 8} Q 0 ${y - 30} ${w} ${y + 8}`} stroke={bg} strokeWidth={7} fill="none" strokeLinecap="round" />;
        })}
      </g>
      <line x1={0} y1={150} x2={0} y2={150 - Math.max(0, t - 0.75) * 4 * 300} stroke={bg} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

const Heart: React.FC<{ t: number; fill?: string }> = ({ t, fill = FOAM }) => {
  const s = 0.2 + 0.8 * Math.min(1, t * 1.2);
  const wob = t < 1 ? Math.sin(t * 12) * 0.03 * (1 - t) : 0;
  return (
    <g transform={`translate(0 ${(1 - t) * 30}) scale(${s + wob} ${s - wob})`}>
      <path d="M0 110 C -170 10, -130 -150, 0 -60 C 130 -150, 170 10, 0 110 Z" fill={fill} />
    </g>
  );
};

const Tulip: React.FC<{ t: number; bg: string }> = ({ t, bg }) => {
  const parts = [
    { y: 62, rx: 116, ry: 60 },
    { y: -8, rx: 96, ry: 48 },
    { y: -66, rx: 72, ry: 36 },
  ];
  return (
    <g>
      {parts.map((p, i) => {
        const k = Math.max(0, Math.min(1, t * 3 - i));
        return (
          <g key={i} opacity={k > 0 ? 1 : 0} transform={`translate(0 ${p.y}) scale(${0.3 + 0.7 * k})`}>
            <ellipse rx={p.rx} ry={p.ry} fill={FOAM} />
            <ellipse cy={p.ry * 0.62} rx={p.rx * 0.78} ry={p.ry * 0.5} fill={bg} />
          </g>
        );
      })}
      <line x1={0} y1={140} x2={0} y2={140 - Math.max(0, t - 0.8) * 5 * 230} stroke={bg} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

// The return-loop mark, poured in foam. Scale 4 → arc radius 96.
export const LogoArt: React.FC<{ t: number; arrow: number; dot: number; stroke?: string; width?: number }> = ({ t, arrow, dot, stroke = FOAM, width = 26 }) => (
  <g transform="scale(4) translate(-40 -40)">
    <path
      d="M64 40 A24 24 0 1 1 57 23"
      fill="none"
      stroke={stroke}
      strokeWidth={width / 4}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - t}
      opacity={t > 0 ? 1 : 0}
    />
    <polygon points="62.7,28.7 60.5,19.5 53.5,26.5" fill={stroke} style={{ transformBox: "fill-box", transformOrigin: "50% 50%", scale: `${arrow}` }} />
    <circle cx={40} cy={40} r={8} fill={C.coral} style={{ transformBox: "fill-box", transformOrigin: "50% 50%", scale: `${dot}` }} />
  </g>
);

const Crema: React.FC = () => (
  <g>
    <circle r={150} fill="none" stroke="#9A5B32" strokeWidth={22} opacity={0.55} />
    {Array.from({ length: 34 }).map((_, i) => {
      const a = rand(i + 3) * Math.PI * 2;
      const r = 130 + rand(i + 9) * 40;
      return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={2 + rand(i) * 5} fill="#B77A48" opacity={0.7} />;
    })}
  </g>
);

const CocoaHeart: React.FC<{ t: number }> = ({ t }) => (
  <g opacity={Math.min(1, t * 2)}>
    <circle r={180} fill={FOAM} />
    {Array.from({ length: 260 }).map((_, i) => {
      const x = (rand(i) - 0.5) * 300;
      const y = (rand(i + 400) - 0.5) * 280;
      // inside the heart shape (implicit)
      const X = x / 120;
      const Y = -(y - 10) / 120;
      const inside = (X * X + Y * Y - 1) ** 3 - X * X * Y ** 3 < 0;
      if (!inside || rand(i + 7) > t * 1.3) return null;
      return <circle key={i} cx={x} cy={y} r={2 + rand(i + 2) * 4} fill="#6A3B1F" opacity={0.75} />;
    })}
  </g>
);

const Ice: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {[
      [-60, -40, 20],
      [55, -55, -12],
      [10, 45, 35],
      [-70, 60, -30],
      [75, 50, 8],
    ].map(([x, y, r], i) => (
      <g key={i} transform={`translate(${x + Math.sin(f / 20 + i) * 4} ${y + Math.cos(f / 23 + i) * 4}) rotate(${r + Math.sin(f / 30 + i) * 6})`}>
        <rect x={-42} y={-42} width={84} height={84} rx={16} fill="rgba(255,255,255,0.42)" stroke="rgba(255,255,255,0.8)" strokeWidth={3} />
        <rect x={-30} y={-32} width={30} height={10} rx={5} fill="rgba(255,255,255,0.7)" />
      </g>
    ))}
  </g>
);

export const Cup: React.FC<{ spec: CupSpec; t: number; f: number; logo?: { arrow: number; dot: number } }> = ({ spec, t, f, logo }) => {
  const [c0, c1] = coffeeFill(spec.drink);
  const id = useSvgId("cup");
  const glass = spec.drink === "iced" || spec.drink === "matcha";
  const lid = spec.drink === "takeaway";
  return (
    <svg viewBox="-360 -360 720 720" width={720} height={720} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={`${id}c`} cx="0.45" cy="0.42" r="0.6">
          <stop offset="0" stopColor={c0} />
          <stop offset="1" stopColor={c1} />
        </radialGradient>
        <radialGradient id={`${id}s`} cx="0.4" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.35} />
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="1" stopColor="#000000" stopOpacity={0.18} />
        </radialGradient>
        <filter id={`${id}sh`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={18} />
        </filter>
        <clipPath id={`${id}k`}>
          <circle r={glass ? 172 : 180} />
        </clipPath>
      </defs>
      {/* cast shadow */}
      <circle cx={34} cy={44} r={glass || lid ? 215 : 300} fill="#000" opacity={0.35} filter={`url(#${id}sh)`} />

      {!glass && !lid && (
        <>
          {/* saucer */}
          <circle r={300} fill={spec.ceramic} />
          <circle r={300} fill={`url(#${id}s)`} />
          <circle r={236} fill="#000" opacity={0.07} />
          <circle r={292} fill="none" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={4} />
          {spec.rim && <circle r={286} fill="none" stroke={spec.rim} strokeWidth={10} />}
          {/* spoon */}
          <g transform="rotate(-38) translate(0 250)">
            <rect x={-12} y={-150} width={24} height={150} rx={12} fill="#C9CCCB" transform="translate(236 20)" />
            <ellipse cx={236} cy={-150} rx={26} ry={38} fill="#D7DAD9" />
          </g>
          {/* handle */}
          <g transform={`rotate(${spec.handle})`}>
            <rect x={188} y={-30} width={100} height={60} rx={30} fill={spec.ceramic} />
            <rect x={188} y={-30} width={100} height={60} rx={30} fill="#000" opacity={0.08} />
            <rect x={206} y={-12} width={62} height={24} rx={12} fill="#000" opacity={0.18} />
          </g>
          {/* cup body */}
          <circle cx={10} cy={14} r={208} fill="#000" opacity={0.22} filter={`url(#${id}sh)`} />
          <circle r={206} fill={spec.ceramic} />
          <circle r={206} fill={`url(#${id}s)`} />
          {spec.rim && <circle r={199} fill="none" stroke={spec.rim} strokeWidth={10} />}
          <circle r={188} fill="#000" opacity={0.2} />
        </>
      )}

      {glass && (
        <>
          <circle r={250} fill="#C8A27A" />
          {Array.from({ length: 60 }).map((_, i) => (
            <circle key={i} cx={(rand(i) - 0.5) * 440} cy={(rand(i + 60) - 0.5) * 440} r={2 + rand(i + 5) * 3} fill="#9C7650" opacity={Math.hypot((rand(i) - 0.5) * 440, (rand(i + 60) - 0.5) * 440) < 240 ? 0.6 : 0} />
          ))}
          <circle r={196} fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.75)" strokeWidth={10} />
        </>
      )}

      {lid ? (
        <g>
          <circle r={206} fill="#F1EDE6" />
          {[196, 176, 150].map((r) => (
            <circle key={r} r={r} fill="none" stroke="#000" strokeOpacity={0.1} strokeWidth={4} />
          ))}
          <circle r={206} fill={`url(#${id}s)`} />
          <rect x={-46} y={-150} width={92} height={36} rx={18} fill="#3A2A20" />
          <circle cy={60} r={52} fill="none" stroke="#000" strokeOpacity={0.08} strokeWidth={6} />
          {/* sleeve print: the shop's mark */}
          <g transform="translate(0 60) scale(0.5)">
            <LogoArt t={1} arrow={1} dot={1} stroke="#5B3A29" width={20} />
          </g>
        </g>
      ) : (
        <g clipPath={`url(#${id}k)`}>
          <circle r={190} fill={`url(#${id}c)`} />
          {spec.drink === "americano" && <Crema />}
          {spec.art === "rosetta" && <Rosetta t={t} bg={c0} />}
          {spec.art === "heart" && <Heart t={t} fill={spec.drink === "matcha" ? "#F4F1E4" : FOAM} />}
          {spec.art === "tulip" && <Tulip t={t} bg={c0} />}
          {spec.art === "cocoa" && <CocoaHeart t={t} />}
          {spec.art === "logo" && <LogoArt t={t} arrow={logo?.arrow ?? 0} dot={logo?.dot ?? 0} />}
          {glass && <Ice f={f} />}
          {glass && (
            <g transform="translate(70 -80)">
              <circle r={24} fill="#FFFFFF" stroke="#E0684B" strokeWidth={8} />
            </g>
          )}
          <circle r={190} fill={`url(#${id}s)`} />
        </g>
      )}
      {/* rim glint */}
      {!lid && <path d="M -150 -120 A 190 190 0 0 1 60 -182" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={6} fill="none" strokeLinecap="round" />}
    </svg>
  );
};
