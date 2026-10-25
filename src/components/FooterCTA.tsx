import React from 'react';

export const FooterCTA: React.FC = () => {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="container">
        <div className="footer-cta-card">
          <div className="footer-cta-content">
            <span className="section-eyebrow">READY TO OBSERVE</span>
            <h2 className="footer-cta-title">Stream crypto market flow with zero friction.</h2>
            <p className="footer-cta-text">
              No registration, no API tokens, no telemetry tracking. Jump straight into the live ticker board or inspect the underlying exchange protocol.
            </p>
          </div>

          <div className="footer-cta-actions">
            <a href="#board" className="btn-primary">
              <span>Go to live board</span>
              <span className="btn-arrow" aria-hidden="true">↑</span>
            </a>

            <a
              href="https://docs.kraken.com/api/docs/websocket-v2/ticker"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <span>Kraken WS v2 Docs ↗</span>
            </a>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="footer-brand">
            <span className="brand-dot" aria-hidden="true" />
            <span className="brand-text">PULSE</span>
            <span className="brand-badge">Real-Time Market Terminal</span>
          </div>

          <div className="footer-links">
            <a
              href="https://docs.kraken.com/api/docs/websocket-v2/ticker"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Kraken WebSocket v2
            </a>
            <span className="footer-sep" aria-hidden="true">•</span>
            <a
              href="https://docs.kraken.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Exchange API Docs
            </a>
            <span className="footer-sep" aria-hidden="true">•</span>
            <a href="#overview" className="footer-link">
              Back to top
            </a>
          </div>

          <div className="footer-disclaimer">
            Market data streamed directly from Kraken Spot WebSocket v2. PULSE is an independent real-time visualizer for public crypto market data. Not financial or investment advice.
          </div>
        </div>
      </div>
    </footer>
  );
};
