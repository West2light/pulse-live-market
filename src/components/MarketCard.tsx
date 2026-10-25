import React, { useEffect, useState } from 'react';
import {
  ConnectionStatus,
  MarketTicker,
  SupportedSymbol,
  SYMBOL_METADATA,
} from '../types/market';
import { Sparkline } from './Sparkline';

interface MarketCardProps {
  symbol: SupportedSymbol;
  ticker: MarketTicker | null;
  connectionStatus: ConnectionStatus;
}

export const MarketCard: React.FC<MarketCardProps> = ({
  symbol,
  ticker,
  connectionStatus,
}) => {
  const meta = SYMBOL_METADATA[symbol];
  const [flashClass, setFlashClass] = useState<string>('');

  // Flash indicator on new price updates (250-350ms)
  useEffect(() => {
    if (!ticker?.flashTimestamp) return;

    const cls =
      ticker.direction === 'up'
        ? 'flash-up'
        : ticker.direction === 'down'
          ? 'flash-down'
          : '';

    if (cls) {
      setFlashClass(cls);
      const timer = setTimeout(() => {
        setFlashClass('');
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [ticker?.flashTimestamp, ticker?.direction]);

  const isPositive = (ticker?.changePct24h ?? 0) >= 0;
  const isStale = Boolean(ticker && connectionStatus !== 'LIVE');

  const formatPrice = (val: number, decimals: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const formatTime = (ts: number) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 2,
      hour12: false,
    }).format(new Date(ts));
  };

  return (
    <article
      className={`market-card ${flashClass} ${isStale ? 'is-stale' : ''}`}
      aria-labelledby={`card-title-${meta.asset}`}
    >
      <div className="card-top">
        <div className="card-identity">
          <div className="card-badge-symbol">{meta.asset}</div>
          <div>
            <h3 id={`card-title-${meta.asset}`} className="card-symbol-title">
              {symbol}
            </h3>
            <p className="card-asset-name">{meta.name}</p>
          </div>
        </div>

        {isStale && ticker && (
          <span className="card-stale-pill" title="Connection interrupted. Displaying last verified tick.">
            STALE
          </span>
        )}
      </div>

      <div className="card-price-row">
        {ticker ? (
          <>
            <div className="card-price-value tabular-nums">
              <span className="currency-symbol">$</span>
              {formatPrice(ticker.last, meta.decimals)}
            </div>

            {ticker.changePct24h !== undefined ? (
              <div
                className={`card-change-badge ${isPositive ? 'positive' : 'negative'} tabular-nums`}
                aria-label={`24 hour change: ${ticker.changePct24h >= 0 ? '+' : ''}${ticker.changePct24h.toFixed(2)} percent`}
              >
                <span className="change-arrow">{isPositive ? '▲' : '▼'}</span>
                <span>{Math.abs(ticker.changePct24h).toFixed(2)}%</span>
              </div>
            ) : (
              <div className="card-change-badge neutral tabular-nums" aria-label="24 hour change unavailable">
                <span>—</span>
              </div>
            )}
          </>
        ) : (
          <div className="card-price-skeleton" aria-label="Awaiting market data">
            <span className="skeleton-bar" />
          </div>
        )}
      </div>

      <div className="card-metrics-grid">
        <div className="metric-cell">
          <span className="metric-label">24H High</span>
          <span className="metric-value tabular-nums">
            {ticker?.high24h ? `$${formatPrice(ticker.high24h, meta.decimals)}` : '—'}
          </span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">24H Low</span>
          <span className="metric-value tabular-nums">
            {ticker?.low24h ? `$${formatPrice(ticker.low24h, meta.decimals)}` : '—'}
          </span>
        </div>
      </div>

      <div className="card-sparkline-wrap">
        <Sparkline
          prices={ticker?.sparkline ?? []}
          direction={ticker?.direction ?? 'unchanged'}
          symbol={symbol}
        />
      </div>

      <div className="card-footer">
        <span className="card-sync-label">Updated at</span>
        <span className="card-sync-time tabular-nums">
          {ticker ? formatTime(ticker.lastReceivedAt) : '—'}
        </span>
      </div>
    </article>
  );
};
