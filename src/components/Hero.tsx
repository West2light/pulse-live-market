import React from 'react';
import { SignalField } from './SignalField';

export const Hero: React.FC = () => {
  return (
    <section id="overview" className="hero-section" aria-labelledby="hero-headline">
      <SignalField />
      <div className="hero-container container">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="eyebrow-beacon" aria-hidden="true" />
            <span className="eyebrow-text">REAL-TIME MARKET SIGNALS</span>
          </div>

          <h1 id="hero-headline" className="hero-headline">
            See the market move.
          </h1>

          <p className="hero-description">
            Direct, zero-lag Level 1 market telemetry streaming straight from Kraken Spot WebSocket v2. Real tick-by-tick prices, transparent 24-hour deltas, and in-memory session momentum with zero synthetic smoothing.
          </p>

          <div className="hero-actions">
            <a href="#board" className="btn-primary">
              <span>Open live board</span>
              <span className="btn-arrow" aria-hidden="true">→</span>
            </a>

            <a href="#how-it-works" className="btn-secondary">
              <span>How it works</span>
            </a>
          </div>

          <div className="hero-spec-strip">
            <div className="spec-item">
              <span className="spec-label">FEED SOURCE</span>
              <span className="spec-val">Kraken Spot v2</span>
            </div>
            <div className="spec-divider" aria-hidden="true" />
            <div className="spec-item">
              <span className="spec-label">PROTOCOL</span>
              <span className="spec-val">WSS Raw L1</span>
            </div>
            <div className="spec-divider" aria-hidden="true" />
            <div className="spec-item">
              <span className="spec-label">WATCHDOG</span>
              <span className="spec-val">20s Heartbeat Guard</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
