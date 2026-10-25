import React, { useId } from 'react';

interface SparklineProps {
  prices: number[];
  direction: 'up' | 'down' | 'unchanged';
  symbol: string;
}

export const Sparkline: React.FC<SparklineProps> = ({ prices, direction, symbol }) => {
  const gradientId = useId();

  if (prices.length < 2) {
    return (
      <div
        className="sparkline-container waiting"
        aria-label={`Session trend for ${symbol}: collecting initial ticks`}
      >
        <div className="sparkline-waiting-track">
          <div className="sparkline-waiting-pulse" />
        </div>
        <div className="sparkline-caption">
          <span className="caption-label">Session trend</span>
          <span className="caption-status">
            Collecting ticks ({prices.length}/2)
          </span>
        </div>
      </div>
    );
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min;

  const width = 180;
  const height = 44;
  const paddingY = 6;
  const innerHeight = height - paddingY * 2;

  // Build coordinate points
  const points = prices.map((price, index) => {
    const x = (index / (prices.length - 1)) * width;
    const y =
      range === 0
        ? height / 2
        : height - paddingY - ((price - min) / range) * innerHeight;
    return { x, y };
  });

  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  const areaData = `${pathData} L ${width},${height} L 0,${height} Z`;

  const lastPoint = points[points.length - 1];

  const strokeColor =
    direction === 'up'
      ? '#D7FF64'
      : direction === 'down'
        ? '#f43f5e'
        : '#6DE7F2';

  return (
    <div
      className="sparkline-container"
      aria-label={`Session trend chart for ${symbol} across ${prices.length} ticks`}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="sparkline-svg"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gradient fill */}
        <path d={areaData} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Latest tick indicator node */}
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="3"
          fill={strokeColor}
          className="sparkline-node"
        />
      </svg>

      <div className="sparkline-caption">
        <span className="caption-label">Session trend ({prices.length} ticks)</span>
        <span className="caption-range">
          L: {min.toLocaleString(undefined, { maximumFractionDigits: 4 })} • H:{' '}
          {max.toLocaleString(undefined, { maximumFractionDigits: 4 })}
        </span>
      </div>
    </div>
  );
};
