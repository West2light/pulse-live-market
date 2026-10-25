import React from 'react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: 'STEP 01',
      title: 'Handshake & Subscription',
      body: 'Browser opens WSS to Kraken v2 and dispatches a JSON subscription for ticker channels across BTC/USD, ETH/USD, SOL/USD, and XRP/USD with snapshot enabled.',
    },
    {
      step: 'STEP 02',
      title: 'Snapshot & Calibration',
      body: 'Exchange returns initial L1 trade snapshots: last executed trade, 24h high/low, and 24h percentage change. The board renders instantly and marks the connection LIVE.',
    },
    {
      step: 'STEP 03',
      title: 'Coalesced Streaming',
      body: 'Trade updates are parsed, validated for finite numbers, and buffered. A coalescing loop throttles React commits to ~4 renders/sec to preserve 60fps responsiveness.',
    },
    {
      step: 'STEP 04',
      title: 'Session Sparklines',
      body: 'Up to 24 live ticks are stored in volatile client memory to draw high-contrast SVG momentum sparklines, clearly labeled as session trends rather than artificial 24h charts.',
    },
  ];

  return (
    <section id="how-it-works" className="how-it-works-section" aria-labelledby="how-heading">
      <div className="container">
        <div className="section-intro">
          <span className="section-eyebrow">TELEMETRY PIPELINE</span>
          <h2 id="how-heading" className="section-title">
            How PULSE streams market truth
          </h2>
          <p className="section-description">
            A minimalist, client-side reactive pipeline built without bloated abstractions.
          </p>
        </div>

        <div className="steps-container">
          {steps.map((item, idx) => (
            <div key={idx} className="step-card">
              <div className="step-header">
                <span className="step-number">{item.step}</span>
                <span className="step-line" aria-hidden="true" />
              </div>
              <h3 className="step-title">{item.title}</h3>
              <p className="step-body">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
