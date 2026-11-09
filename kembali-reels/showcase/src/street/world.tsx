// Isometric shophouse row. World: x along the street, y toward the viewer
// (street side), z up. Facades sit on y = 0 and face +y.
import React from "react";
import { C, rand } from "../lib";

export const P = (x: number, y: number, z = 0): [number, number] => [0.866 * (x - y), 0.5 * (x + y) - z];
const pt = (x: number, y: number, z = 0) => P(x, y, z).join(",");

export const SHOP_W = 220;
export const ROW_N = 6;
export const ROW_END = SHOP_W * ROW_N;

export type Shop = { name: string; wall: string; sign: string; shutter: string; accent: string };
export const SHOPS: Shop[] = [
  { name: "BOOK NOOK", wall: "#9CC7C1", sign: "#1F5553", shutter: "#5E8F8A", accent: "#E8F3EF" },
  { name: "CORNER COFFEE", wall: "#F1D8B8", sign: "#5B3A29", shutter: "#D98A2B", accent: "#FFF6E8" },
  { name: "BLOOM BAKERY", wall: "#F2BACA", sign: "#7A2E4A", shutter: "#E27396", accent: "#FFF0F4" },
  { name: "NOODLE HOUSE", wall: "#F3D466", sign: "#A8321F", shutter: "#C9502F", accent: "#FFF8DC" },
  { name: "GLOW SALON", wall: "#BAC8EA", sign: "#12436B", shutter: "#3A9BD9", accent: "#EEF3FF" },
  { name: "TAILOR & CO", wall: "#D5E1BD", sign: "#3F5B2E", shutter: "#7FA05A", accent: "#F4F8EA" },
];
export const shopCenter = (i: number) => i * SHOP_W + SHOP_W / 2;

const facadeM = (x0: number) => {
  const [e, f] = P(x0, 0, 0);
  return `matrix(0.866 0.5 0 1 ${e} ${f})`;
};
const roofM = (x0: number) => {
  const [e, f] = P(x0, 0, 260);
  return `matrix(0.866 0.5 0.866 -0.864 ${e} ${f})`;
};
const groundM = "matrix(0.866 0.5 -0.866 0.5 0 0)";
const endM = (() => {
  const [e, f] = P(ROW_END, 0, 0);
  return `matrix(0.866 -0.5 0 1 ${e} ${f})`;
})();

// ---------- ground ----------
export const Ground: React.FC<{ night: number }> = ({ night }) => (
  <g transform={groundM}>
    <defs>
      <pattern id="tiles" width="36" height="36" patternUnits="userSpaceOnUse">
        <rect width="36" height="36" fill="#EDE3CF" />
        <rect x="2" y="2" width="32" height="32" fill="#E9D9BA" />
        <circle cx="18" cy="18" r="9" fill="#5E8F8A" />
        <circle cx="18" cy="18" r="4" fill="#E0684B" />
        <path d="M2 2 L10 2 L2 10 Z M34 2 L26 2 L34 10 Z M2 34 L10 34 L2 26 Z M34 34 L26 34 L34 26 Z" fill="#C9A86A" />
      </pattern>
    </defs>
    <rect x={-2600} y={-40} width={6600} height={4000} fill="#6F8F5E" />
    <rect x={-2600} y={0} width={6600} height={80} fill="url(#tiles)" />
    <rect x={-2600} y={78} width={6600} height={10} fill="#BDB6A6" />
    <rect x={-2600} y={88} width={6600} height={230} fill="#3C4144" />
    {Array.from({ length: 40 }).map((_, i) => (
      <rect key={i} x={-2600 + i * 170} y={200} width={80} height={6} fill="#E8E2D2" opacity={0.8} />
    ))}
    <rect x={-2600} y={318} width={6600} height={10} fill="#BDB6A6" />
    <rect x={-2600} y={328} width={6600} height={70} fill="#CFC6B3" />
    <rect x={-2600} y={398} width={6600} height={3600} fill={night > 0.5 ? "#3E5A40" : "#7FA06A"} />
  </g>
);

// cast shadow of the whole row onto the street; length and skew follow the sun
export const RowShadow: React.FC<{ len: number; skew: number; alpha: number }> = ({ len, skew, alpha }) => (
  <g transform={groundM}>
    <polygon points={`0,0 ${ROW_END},0 ${ROW_END + skew},${len} ${skew},${len}`} fill="#1B1410" opacity={alpha} />
  </g>
);

// ---------- one shophouse ----------
export const Shophouse: React.FC<{ i: number; open: number; glow: number; f: number }> = ({ i, open, glow, f }) => {
  const s = SHOPS[i];
  const x0 = i * SHOP_W;
  const shutterH = 112 * (1 - open);
  const win = glow > 0 ? `rgba(255,${196 + 30 * glow},${120 + 40 * glow},${0.35 + 0.6 * glow})` : "#7FA6B3";
  return (
    <g>
      {/* roof */}
      <g transform={roofM(x0)}>
        <rect x={0} y={0} width={SHOP_W} height={110} fill="#B85F43" />
        {Array.from({ length: 10 }).map((_, k) => (
          <rect key={k} x={0} y={k * 11} width={SHOP_W} height={2.5} fill="#8A4630" opacity={0.5} />
        ))}
        {Array.from({ length: 11 }).map((_, k) => (
          <rect key={`v${k}`} x={k * 20 + 10} y={0} width={1.5} height={110} fill="#8A4630" opacity={0.22} />
        ))}
        <rect x={0} y={104} width={SHOP_W} height={8} fill="#6E3524" />
        <rect x={0} y={0} width={4} height={110} fill="#E6DCC8" />
      </g>
      {/* facade */}
      <g transform={facadeM(x0)}>
        <rect x={0} y={-262} width={SHOP_W} height={262} fill={s.wall} />
        <rect x={0} y={-262} width={SHOP_W} height={12} fill="#FFFFFF" opacity={0.55} />
        <rect x={0} y={-262} width={12} height={262} fill="#000" opacity={0.08} />
        <rect x={SHOP_W - 12} y={-262} width={12} height={262} fill="#000" opacity={0.08} />
        {/* upper windows with louvred shutters */}
        {[34, 92, 150].map((u, k) => (
          <g key={k}>
            <rect x={u} y={-236} width={36} height={70} rx={3} fill={win} />
            <rect x={u - 10} y={-236} width={10} height={70} fill={s.shutter} />
            <rect x={u + 36} y={-236} width={10} height={70} fill={s.shutter} />
            <rect x={u - 2} y={-166} width={40} height={6} fill="#FFFFFF" opacity={0.7} />
            <path d={`M${u} -236 Q ${u + 18} -256 ${u + 36} -236 Z`} fill="#FFFFFF" opacity={0.7} />
          </g>
        ))}
        {/* sign board */}
        <rect x={14} y={-150} width={SHOP_W - 28} height={30} rx={3} fill={s.sign} />
        <text x={SHOP_W / 2} y={-129} textAnchor="middle" fontFamily="PlexMono, monospace" fontSize={15} letterSpacing={1.5} fill="#F6F1E3">
          {s.name}
        </text>
        {/* five-foot way arcade */}
        <path d={`M20 0 L20 -92 Q 110 -122 200 -92 L200 0 Z`} fill="#2B231F" />
        <rect x={40} y={-76} width={48} height={50} fill={glow > 0 ? `rgba(255,214,150,${0.5 + glow * 0.5})` : "#8EB2BC"} opacity={0.9} />
        <rect x={132} y={-76} width={48} height={50} fill={glow > 0 ? `rgba(255,214,150,${0.5 + glow * 0.5})` : "#8EB2BC"} opacity={0.9} />
        <rect x={94} y={-82} width={32} height={82} fill={glow > 0 ? "#FFD08A" : s.accent} />
        {/* roller shutter */}
        {shutterH > 1 && (
          <g>
            <rect x={20} y={-112} width={180} height={shutterH} fill="#9EA3A3" />
            {Array.from({ length: Math.ceil(shutterH / 6) }).map((_, k) => (
              <rect key={k} x={20} y={-112 + k * 6} width={180} height={1.4} fill="#6E7373" />
            ))}
          </g>
        )}
        {/* pillars */}
        <rect x={0} y={-120} width={20} height={120} fill={s.wall} />
        <rect x={SHOP_W - 20} y={-120} width={20} height={120} fill={s.wall} />
        <rect x={0} y={-10} width={SHOP_W} height={10} fill="#000" opacity={0.12} />
        {f < 0 && null}
      </g>
    </g>
  );
};

export const EndWall: React.FC = () => (
  <g transform={endM}>
    <rect x={0} y={-262} width={300} height={262} fill="#AFBF95" />
    <polygon points="0,-262 110,-302 300,-262" fill="#9CAD82" />
    <rect x={0} y={-262} width={300} height={262} fill="#000" opacity={0.12} />
  </g>
);

// ---------- props ----------
export const Tree: React.FC<{ x: number; y: number; night: number }> = ({ x, y, night }) => {
  const [X, Y] = P(x, y);
  const leaf = night > 0.5 ? "#2E4A35" : "#4F8A4A";
  return (
    <g>
      <ellipse cx={X + 30} cy={Y + 6} rx={70} ry={26} fill="#000" opacity={0.18} />
      <rect x={X - 6} y={Y - 120} width={12} height={120} fill="#6B4B32" />
      {[
        [0, -170, 62],
        [-44, -140, 44],
        [44, -145, 46],
        [-10, -210, 42],
      ].map(([dx, dy, r], k) => (
        <circle key={k} cx={X + dx} cy={Y + dy} r={r} fill={leaf} />
      ))}
      <circle cx={X - 16} cy={Y - 190} r={26} fill="#FFFFFF" opacity={0.12} />
    </g>
  );
};

export const Lamp: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const [X, Y] = P(x, y);
  return (
    <g>
      <rect x={X - 3} y={Y - 190} width={6} height={190} fill="#2F3A36" />
      <rect x={X - 3} y={Y - 190} width={40} height={6} fill="#2F3A36" />
      <rect x={X + 26} y={Y - 186} width={18} height={10} rx={3} fill="#2F3A36" />
    </g>
  );
};

// iso box: top, front (+y) and right (+x) faces
export const Box: React.FC<{ x: number; y: number; z?: number; dx: number; dy: number; dz: number; color: string }> = ({ x, y, z = 0, dx, dy, dz, color }) => (
  <g>
    <polygon points={`${pt(x, y + dy, z)} ${pt(x + dx, y + dy, z)} ${pt(x + dx, y + dy, z + dz)} ${pt(x, y + dy, z + dz)}`} fill={color} />
    <polygon points={`${pt(x + dx, y, z)} ${pt(x + dx, y + dy, z)} ${pt(x + dx, y + dy, z + dz)} ${pt(x + dx, y, z + dz)}`} fill={color} style={{ filter: "brightness(0.78)" }} />
    <polygon points={`${pt(x, y, z + dz)} ${pt(x + dx, y, z + dz)} ${pt(x + dx, y + dy, z + dz)} ${pt(x, y + dy, z + dz)}`} fill={color} style={{ filter: "brightness(1.15)" }} />
  </g>
);

export const Car: React.FC<{ x: number; y: number; color: string; night: number }> = ({ x, y, color, night }) => {
  const [hx, hy] = P(x + 150, y + 30, 22);
  return (
    <g>
      <Box x={x} y={y} dx={150} dy={64} dz={34} color={color} />
      <Box x={x + 30} y={y + 6} z={34} dx={80} dy={52} dz={26} color="#DCE6EA" />
      {night > 0.4 && <circle cx={hx} cy={hy} r={9} fill="#FFF3C4" />}
    </g>
  );
};

// a walker: upright billboard figure with a walk bob
export const Person: React.FC<{ x: number; y: number; f: number; seed: number; alpha?: number }> = ({ x, y, f, seed, alpha = 1 }) => {
  const [X, Y] = P(x, y);
  const shirts = ["#E0684B", "#2D6CB5", "#F2C14E", "#7FB069", "#FFFFFF", "#6B4B8A", "#16261E", "#E27396"];
  const skins = ["#8D5A3B", "#C58C62", "#E3B48E", "#6B4029"];
  const bob = Math.abs(Math.sin(f / 3 + seed)) * 3;
  const leg = Math.sin(f / 3 + seed) * 5;
  return (
    <g opacity={alpha}>
      <ellipse cx={X + 6} cy={Y + 2} rx={14} ry={5} fill="#000" opacity={0.2} />
      <rect x={X - 6 + leg * 0.3} y={Y - 26} width={5} height={26} rx={2} fill="#2B2B33" />
      <rect x={X + 1 - leg * 0.3} y={Y - 26} width={5} height={26} rx={2} fill="#2B2B33" />
      <rect x={X - 9} y={Y - 56 - bob} width={18} height={32} rx={8} fill={shirts[Math.floor(rand(seed) * shirts.length)]} />
      <circle cx={X} cy={Y - 66 - bob} r={9} fill={skins[Math.floor(rand(seed + 3) * skins.length)]} />
      <path d={`M${X - 9} ${Y - 68 - bob} A 9 9 0 0 1 ${X + 9} ${Y - 68 - bob} Z`} fill="#1B1512" />
    </g>
  );
};

export const TILE = C.coral;
