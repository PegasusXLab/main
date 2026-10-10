import React from "react";

export interface GridProps {
  pixelsPerMeter: number;
}

export function Grid({ pixelsPerMeter }: GridProps) {
  const halfMeter = pixelsPerMeter * 0.5;
  const oneMeter = pixelsPerMeter;

  return (
    <defs>
      {/* 0.5 m minor grid and 1.0 m major grid pattern */}
      <pattern
        id="editor-grid-pattern"
        width={oneMeter}
        height={oneMeter}
        patternUnits="userSpaceOnUse"
      >
        <path
          d={`M ${halfMeter} 0 L ${halfMeter} ${oneMeter} M 0 ${halfMeter} L ${oneMeter} ${halfMeter}`}
          fill="none"
          stroke="#e4e4e7"
          strokeWidth="1"
        />
        <path
          d={`M ${oneMeter} 0 L 0 0 0 ${oneMeter}`}
          fill="none"
          stroke="#d4d4d8"
          strokeWidth="1.25"
        />
      </pattern>
    </defs>
  );
}

export default Grid;
