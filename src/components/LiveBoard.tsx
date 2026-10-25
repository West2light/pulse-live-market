import React from 'react';
import {
  ConnectionStatus,
  MarketTicker,
  SupportedSymbol,
  SUPPORTED_SYMBOLS,
} from '../types/market';
import { MarketCard } from './MarketCard';

interface LiveBoardProps {
  status: ConnectionStatus;
  tickers: Record<SupportedSymbol, MarketTicker | null>;
  errorMessage: string | null;
  onReconnect: () => void;
}

export const LiveBoard: React.FC<LiveBoardProps> = ({
  status,
  tickers,
  errorMessage,
  onReconnect,
}) => {
  const activeCount = SUPPORTED_SYMBOLS.filter((s) => tickers[s] !== null).length;

  return (
    <section id="board" className="live-board-section" aria-labelledby="board-heading">
      <div className="container">
        <div className="board-header">
          <div className="board-header-left">
            <span className="section-eyebrow">SPOT STREAMING DESK</span>
            <h2 id="board-heading" className="board-heading">
              Live Market Board
            </h2>
            <p className="board-subheading">
              Monitoring 4 core currency pairs with tick-by-tick Level 1 execution updates and in-session trends.
            </p>
          </div>

          <div className="board-header-right">
            <div className="board-telemetry-badge">
              <span className="telemetry-count">{activeCount} / {SUPPORTED_SYMBOLS.length}</span>
              <span className="telemetry-label">PAIRS STREAMING</span>
            </div>
          </div>
        </div>

        {status === 'ERROR' && (
          <div className="board-alert board-alert-error" role="alert">
            <div className="alert-content">
              <strong>Connection Error:</strong> {errorMessage || 'Subscription rejected by exchange.'}
            </div>
            <button type="button" onClick={onReconnect} className="alert-retry-btn">
              Retry Connection
            </button>
          </div>
        )}

        {status === 'STALE' && (
          <div className="board-alert board-alert-warning" role="alert">
            <div className="alert-content">
              <strong>Feed Stale:</strong> No frames received in &gt;20s. Watchdog is re-establishing socket.
            </div>
          </div>
        )}

        <div className="market-cards-grid">
          {SUPPORTED_SYMBOLS.map((symbol) => (
            <MarketCard
              key={symbol}
              symbol={symbol}
              ticker={tickers[symbol]}
              connectionStatus={status}
            />
          ))}
        </div>

        <div className="board-note-bar">
          <div className="note-item">
            <span className="note-bullet">●</span>
            <span><strong>24H Change:</strong> Sourced directly from Kraken exchange calculation.</span>
          </div>
          <div className="note-item">
            <span className="note-bullet">●</span>
            <span><strong>Session Trend:</strong> Up to 24 genuine price ticks received during current page session.</span>
          </div>
        </div>
      </div>
    </section>
  );
};
