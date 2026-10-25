import React from 'react';

export const SignalField: React.FC = () => {
  return (
    <div className="signal-field-wrap" aria-hidden="true">
      <svg
        className="signal-field-svg"
        viewBox="0 0 800 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="grid-grad-x" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6DE7F2" stopOpacity="0" />
            <stop offset="50%" stopColor="#6DE7F2" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6DE7F2" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="grid-grad-y" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D7FF64" stopOpacity="0" />
            <stop offset="50%" stopColor="#D7FF64" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#D7FF64" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="pulse-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6DE7F2" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#071014" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient radial center glow */}
        <ellipse cx="400" cy="250" rx="350" ry="200" fill="url(#pulse-glow)" />

        {/* Horizontal grid lines */}
        <line x1="40" y1="100" x2="760" y2="100" stroke="url(#grid-grad-x)" strokeWidth="1" strokeDasharray="4 8" className="signal-line-h1" />
        <line x1="20" y1="200" x2="780" y2="200" stroke="url(#grid-grad-x)" strokeWidth="1" className="signal-line-h2" />
        <line x1="40" y1="300" x2="760" y2="300" stroke="url(#grid-grad-x)" strokeWidth="1" className="signal-line-h3" />
        <line x1="20" y1="400" x2="780" y2="400" stroke="url(#grid-grad-x)" strokeWidth="1" strokeDasharray="4 8" className="signal-line-h4" />

        {/* Vertical flux guides */}
        <line x1="160" y1="30" x2="160" y2="470" stroke="url(#grid-grad-y)" strokeWidth="1" strokeDasharray="2 6" />
        <line x1="320" y1="30" x2="320" y2="470" stroke="url(#grid-grad-y)" strokeWidth="1" />
        <line x1="480" y1="30" x2="480" y2="470" stroke="url(#grid-grad-y)" strokeWidth="1" />
        <line x1="640" y1="30" x2="640" y2="470" stroke="url(#grid-grad-y)" strokeWidth="1" strokeDasharray="2 6" />

        {/* Concentric radar rings */}
        <circle cx="400" cy="250" r="90" stroke="#6DE7F2" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="6 6" className="radar-ring-1" />
        <circle cx="400" cy="250" r="180" stroke="#D7FF64" strokeWidth="1" strokeOpacity="0.12" className="radar-ring-2" />
        <circle cx="400" cy="250" r="270" stroke="#6DE7F2" strokeWidth="0.75" strokeOpacity="0.08" strokeDasharray="12 12" className="radar-ring-3" />

        {/* Telemetry nodes */}
        <g className="telemetry-node node-a">
          <circle cx="320" cy="200" r="4" fill="#D7FF64" />
          <circle cx="320" cy="200" r="10" stroke="#D7FF64" strokeWidth="1" opacity="0.4" className="node-ping" />
        </g>

        <g className="telemetry-node node-b">
          <circle cx="480" cy="300" r="4" fill="#6DE7F2" />
          <circle cx="480" cy="300" r="10" stroke="#6DE7F2" strokeWidth="1" opacity="0.4" className="node-ping" />
        </g>

        <g className="telemetry-node node-c">
          <circle cx="400" cy="100" r="3" fill="#D7FF64" opacity="0.7" />
        </g>

        <g className="telemetry-node node-d">
          <circle cx="640" cy="200" r="3.5" fill="#6DE7F2" opacity="0.8" />
        </g>

        <g className="telemetry-node node-e">
          <circle cx="160" cy="300" r="3.5" fill="#D7FF64" opacity="0.6" />
        </g>

        {/* Wave vector path */}
        <path
          d="M 60 270 Q 200 160 320 200 T 480 300 T 740 220"
          fill="none"
          stroke="#6DE7F2"
          strokeWidth="1.5"
          strokeOpacity="0.25"
          className="signal-wave-path"
        />
      </svg>
    </div>
  );
};
