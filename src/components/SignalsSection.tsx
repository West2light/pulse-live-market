import React from 'react';

export const SignalsSection: React.FC = () => {
  return (
    <section id="signals" className="signals-section" aria-labelledby="signals-heading">
      <div className="container">
        <div className="section-intro">
          <span className="section-eyebrow">RESILIENCE & INTEGRITY</span>
          <h2 id="signals-heading" className="section-title">
            Direct feed architecture. Zero synthetic numbers.
          </h2>
          <p className="section-description">
            PULSE operates entirely in your browser over encrypted WebSockets directly to Kraken Spot v2. Every price, tick, and sparkline point reflects verifiable trading activity.
          </p>
        </div>

        <div className="signals-grid">
          <div className="signal-card">
            <div className="signal-card-number">01</div>
            <h3 className="signal-card-title">Direct Public Socket</h3>
            <p className="signal-card-body">
              Client connects directly to <code>wss://ws.kraken.com/v2</code> with zero intermediary servers, proxy scrapers, or latency-inducing relays. No API keys or authentication required.
            </p>
          </div>

          <div className="signal-card">
            <div className="signal-card-number">02</div>
            <h3 className="signal-card-title">20-Second Heartbeat Watchdog</h3>
            <p className="signal-card-body">
              Kraken transmits 1-second heartbeats during quiet market intervals. If 20 seconds elapse without any frame, PULSE terminates the zombie socket and initiates recovery.
            </p>
          </div>

          <div className="signal-card">
            <div className="signal-card-number">03</div>
            <h3 className="signal-card-title">Exponential Backoff & Jitter</h3>
            <p className="signal-card-body">
              Automatic reconnect sequences scale across 1s, 2s, 4s, 8s, 16s, and 30s intervals with randomized jitter. A strict single-timer guarantee prevents duplicate concurrent socket storms.
            </p>
          </div>

          <div className="signal-card">
            <div className="signal-card-number">04</div>
            <h3 className="signal-card-title">Transparent Stale States</h3>
            <p className="signal-card-body">
              When connection disruptions occur, cards preserve the last verified trade accompanied by an explicit STALE indicator and timestamp. We never substitute synthetic or random mock numbers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
