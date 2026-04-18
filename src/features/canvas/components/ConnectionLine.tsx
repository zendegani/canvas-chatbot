
import React from 'react';

interface ConnectionLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  orientation?: 'horizontal' | 'vertical';
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ startX, startY, endX, endY, orientation = 'horizontal' }) => {
  // Midpoint-based control points — curves correctly regardless of direction
  let cp1x, cp1y, cp2x, cp2y;

  if (orientation === 'horizontal') {
    const midX = (startX + endX) / 2;
    cp1x = midX;
    cp1y = startY;
    cp2x = midX;
    cp2y = endY;
  } else {
    const midY = (startY + endY) / 2;
    // Add slight horizontal curve when nearly vertical to avoid degenerate bezier
    const curveOffset = Math.abs(endX - startX) < 2 ? 20 : 0;
    cp1x = startX + curveOffset;
    cp1y = midY;
    cp2x = endX - curveOffset;
    cp2y = midY;
  }

  const path = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

  return (
    <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible" style={{ zIndex: 0 }}>
      <path
        d={path}
        fill="none"
        stroke="url(#connection-gradient)"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-40 animate-pulse"
      />
    </svg>
  );
};
