import React from 'react';
import { ConnectionStatus } from '../types/market';

interface HeaderProps {
  status: ConnectionStatus;
  errorMessage: string | null;
  onReconnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  errorMessage,
  onReconnect,
}) => {
  const getStatusLabel = (s: ConnectionStatus) => {
    switch (s) {
      case 'LIVE':
        return 'LIVE STREAM';
      case 'CONNECTING':
        return 'CONNECTING';
      case 'STALE':
        return 'FEED STALE';
      case 'RECONNECTING':
        return 'RECONNECTING';
      case 'ERROR':
        return 'CONN ERROR';
    }
  };

  const getStatusDescription = (s: ConnectionStatus) => {
    switch (s) {
      case 'LIVE':
        return 'Direct L1 feed streaming from Kraken Spot WebSocket v2';
      case 'CONNECTING':
        return 'Establishing secure socket handshake and requesting snapshots';
      case 'STALE':
        return 'No frames received in >20s. Initiating watchdog reconnect...';
      case 'RECONNECTING':
        return 'Socket dropped. Exponential backoff active with automatic retry.';
      case 'ERROR':
        return errorMessage || 'Subscription rejected. Check connection or retry.';
    }
  };

  return (
    <header className="site-header" role="banner">
      <div className="header-inner container">
        <a href="#overview" className="brand-wordmark" aria-label="PULSE Home">
          <span className="brand-dot" aria-hidden="true" />
          <span className="brand-text">PULSE</span>
        </a>

        <nav className="header-nav" aria-label="Main Navigation">
          <ul className="nav-list">
            <li>
              <a href="#overview" className="nav-link">
                Overview
              </a>
            </li>
            <li>
              <a href="#board" className="nav-link">
                Live Board
              </a>
            </li>
            <li>
              <a href="#signals" className="nav-link">
                Signals
              </a>
            </li>
            <li>
              <a href="#how-it-works" className="nav-link">
                How It Works
              </a>
            </li>
          </ul>
        </nav>

        <div className="header-status-area">
          <div
            className={`connection-pill status-${status.toLowerCase()}`}
            role="status"
            aria-live="polite"
            title={getStatusDescription(status)}
          >
            <span className="status-indicator-dot" aria-hidden="true" />
            <span className="status-text">{getStatusLabel(status)}</span>
          </div>

          {status === 'ERROR' && (
            <button
              type="button"
              onClick={onReconnect}
              className="retry-button"
              aria-label="Retry WebSocket connection"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
