import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../lib";
import { useFonts } from "../swarm/shared";
import { StandardEnd } from "./StandardEnd";

// Standalone preview of the standard end card over a pandan frame.
export const EndPreview: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.pandan }}>
      <StandardEnd f={f} start={10} />
    </AbsoluteFill>
  );
};
