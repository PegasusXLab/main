import React from "react";
import { THEME } from "@/lib/theme";

export interface GridProps {
  pixelsPerMeter: number;
  pan?: { x: number; y: number };
}

export function Grid({ pixelsPerMeter, pan = { x: 0, y: 0 } }: GridProps) {
  const halfMeter = pixelsPerMeter * 0.5;
  const oneMeter = pixelsPerMeter;

  return (
    <defs>
      {/* 0.5 m minor grid and 1.0 m major grid pattern offset by pan */}
      <pattern
        id="editor-grid-pattern"
        x={pan.x}
        y={pan.y}
        width={oneMeter}
        height={oneMeter}
        patternUnits="userSpaceOnUse"
      >
        <path
          d={`M ${halfMeter} 0 L ${halfMeter} ${oneMeter} M 0 ${halfMeter} L ${oneMeter} ${halfMeter}`}
          fill="none"
          stroke={THEME.colors.hairline}
          strokeWidth="1"
          strokeOpacity="0.6"
        />
        <path
          d={`M ${oneMeter} 0 L 0 0 0 ${oneMeter}`}
          fill="none"
          stroke={THEME.colors.hairline}
          strokeWidth="1.25"
        />
      </pattern>
    </defs>
  );
}

export default Grid;
