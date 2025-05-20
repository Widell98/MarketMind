
import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

const Sparkline: React.FC<SparklineProps> = ({ 
  data, 
  width = 80, 
  height = 24, 
  color = "currentColor"
}) => {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  // Normalize data points to fit within the height
  const normalizedData = data.map(value => 
    height - ((value - min) / range) * height
  );

  // Calculate points for the polyline
  const points = normalizedData.map((point, index) => 
    `${(index / (data.length - 1)) * width},${point}`
  ).join(' ');

  // Determine if trending up or down
  const isUp = data[data.length - 1] >= data[0];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? "#22C55E" : "#EF4444"}
        strokeWidth="1.5"
      />
    </svg>
  );
};

export default Sparkline;
