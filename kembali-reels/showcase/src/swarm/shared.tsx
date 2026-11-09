import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
export { Grain } from "../common";

const FONTS: [string, string, FontFaceDescriptors][] = [
  ["Fraunces", "fonts/fraunces.woff2", { weight: "100 900", style: "normal" }],
  ["Fraunces", "fonts/fraunces-italic.woff2", { weight: "100 900", style: "italic" }],
  ["Jakarta", "fonts/jakarta.woff2", { weight: "200 800" }],
  ["PlexMono", "fonts/plexmono500.woff2", { weight: "500" }],
];

export const useFonts = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(
      FONTS.map(async ([fam, src, desc]) => {
        const face = new FontFace(fam, `url(${staticFile(src)}) format("woff2")`, desc);
        await face.load();
        document.fonts.add(face);
      }),
    ).then(() => continueRender(handle));
  }, [handle]);
};
