
import React from 'react';

interface ConnectionLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  orientation?: 'horizontal' | 'vertical';
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ startX, startY, endX, endY, orientation = 'horizontal' }) => {
  // Simple cubic bezier curve calculation
  const dx = Math.abs(endX - startX);
  const dy = Math.abs(endY - startY);

  let cp1x, cp1y, cp2x, cp2y;

  if (orientation === 'horizontal') {
    cp1x = startX + dx * 0.5;
    cp1y = startY;
    cp2x = endX - dx * 0.5;
    cp2y = endY;
  } else {
    // Vertical orientation
    cp1x = startX;
    cp1y = startY + dy * 0.5;
    cp2x = endX;
    cp2y = endY - dy * 0.5;
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
