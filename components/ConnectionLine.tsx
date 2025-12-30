
import React from 'react';

interface ConnectionLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ startX, startY, endX, endY }) => {
  // Simple cubic bezier curve calculation
  const dx = Math.abs(endX - startX);
  const dy = Math.abs(endY - startY);

  // Controls points for the curve
  const cp1x = startX + dx * 0.5;
  const cp1y = startY;
  const cp2x = endX - dx * 0.5;
  const cp2y = endY;

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
