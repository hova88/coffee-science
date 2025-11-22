
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo } from 'react';
import { FlavorProfile } from '../types';

interface FlavorRadarProps {
  data: FlavorProfile;
  size?: number;
}

const LABELS = [
  { key: 'acidity', label: 'ACIDITY' },
  { key: 'sweetness', label: 'SWEET' },
  { key: 'body', label: 'BODY' },
  { key: 'bitterness', label: 'BITTER' },
  { key: 'clarity', label: 'CLARITY' },
];

export const FlavorRadar: React.FC<FlavorRadarProps> = ({ data, size = 140 }) => {
  const radius = size / 2;
  const center = size / 2;
  const scale = radius - 25; // Leave room for labels

  // Helper to calculate point coordinates
  const getPoint = (value: number, index: number, max: number) => {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2; // Start at top (-90deg)
    const r = value * scale;
    return {
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
    };
  };

  const polygonPoints = useMemo(() => {
    return LABELS.map((metric, i) => {
      // Normalize and clamp values 0-1 for safety
      let val = data[metric.key as keyof FlavorProfile] || 0;
      val = Math.max(0, Math.min(1, val));
      const { x, y } = getPoint(val, i, 5);
      return `${x},${y}`;
    }).join(' ');
  }, [data, scale, center]);

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <div className="relative flex flex-col items-center justify-center select-none animate-in fade-in duration-700">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grid (Pentagons) */}
        {gridLevels.map((level, i) => {
          const pts = LABELS.map((_, j) => {
             const { x, y } = getPoint(level, j, 5);
             return `${x},${y}`;
          }).join(' ');
          return (
            <polygon 
                key={i} 
                points={pts} 
                fill="none" 
                stroke="rgba(255,255,255,0.1)" 
                strokeWidth="1" 
            />
          );
        })}

        {/* Axes Lines */}
        {LABELS.map((_, i) => {
            const { x, y } = getPoint(1, i, 5);
            return (
                <line 
                    key={i} 
                    x1={center} y1={center} 
                    x2={x} y2={y} 
                    stroke="rgba(255,255,255,0.05)" 
                    strokeWidth="1" 
                />
            );
        })}

        {/* The Data Polygon */}
        <polygon 
            points={polygonPoints} 
            fill="rgba(99, 102, 241, 0.2)" // Indigo tint
            stroke="#818cf8" // Indigo 400
            strokeWidth="2"
            className="transition-all duration-500 ease-out"
        />
        
        {/* Vertex Dots */}
        {LABELS.map((metric, i) => {
            let val = data[metric.key as keyof FlavorProfile] || 0;
            val = Math.max(0, Math.min(1, val));
            const { x, y } = getPoint(val, i, 5);
            return (
                <circle 
                    key={i} 
                    cx={x} cy={y} r={2} 
                    fill="#fff"
                    className="transition-all duration-500 ease-out"
                />
            )
        })}

        {/* Labels */}
        {LABELS.map((metric, i) => {
            const { x, y } = getPoint(1.25, i, 5);
            return (
                <text
                    key={i}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill="rgba(255,255,255,0.5)"
                    fontSize="8"
                    fontFamily="monospace"
                    className="tracking-widest uppercase font-semibold"
                >
                    {metric.label}
                </text>
            );
        })}
      </svg>
    </div>
  );
};
