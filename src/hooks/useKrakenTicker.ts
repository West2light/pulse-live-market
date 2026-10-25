import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ConnectionStatus,
  MarketTicker,
  PriceDirection,
  SupportedSymbol,
} from '../types/market';
import {
  KRAKEN_WS_URL,
  KRAKEN_SUBSCRIBE_MESSAGE,
  parseKrakenMessage,
} from '../services/krakenParser';

const WATCHDOG_TIMEOUT_MS = 20_000; // 20s stale threshold
const BACKOFF_STEPS = [1000, 2000, 4000, 8000, 16000, 30000]; // ms
const MAX_SPARKLINE_POINTS = 24;
const COALESCE_INTERVAL_MS = 250; // max ~4 renders/sec

export interface UseKrakenTickerReturn {
  status: ConnectionStatus;
  tickers: Record<SupportedSymbol, MarketTicker | null>;
  errorMessage: string | null;
  lastMessageAt: number | null;
  reconnect: () => void;
}

export function useKrakenTicker(wsUrl: string = KRAKEN_WS_URL): UseKrakenTickerReturn {
  const [status, setStatus] = useState<ConnectionStatus>('CONNECTING');
  const [tickers, setTickers] = useState<Record<SupportedSymbol, MarketTicker | null>>({
    'BTC/USD': null,
    'ETH/USD': null,
    'SOL/USD': null,
    'XRP/USD': null,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null);

  // References to guarantee single socket, single timers, and guard React lifecycle
  const socketRef = useRef<WebSocket | null>(null);
  const backoffIndexRef = useRef<number>(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coalesceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDestroyedRef = useRef<boolean>(false);
  const isErrorRef = useRef<boolean>(false);
  const lastMessageAtRef = useRef<number | null>(null);

  // Internal mutable buffer of latest tickers for coalesced state updates
  const tickerBufferRef = useRef<Record<SupportedSymbol, MarketTicker | null>>({
    'BTC/USD': null,
    'ETH/USD': null,
    'SOL/USD': null,
    'XRP/USD': null,
  });
  const hasPendingBufferRef = useRef<boolean>(false);

  // Clear watchdog
  const stopWatchdog = useCallback(() => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  }, []);

  // Flush buffer to React state (max 4 times/sec)
  const flushTickerBuffer = useCallback(() => {
    if (isDestroyedRef.current) return;
    if (hasPendingBufferRef.current) {
      setTickers({ ...tickerBufferRef.current });
      hasPendingBufferRef.current = false;
      if (lastMessageAtRef.current !== null) {
        setLastMessageAt(lastMessageAtRef.current);
      }
    }
  }, []);

  const scheduleFlush = useCallback(() => {
    if (!coalesceTimerRef.current) {
      coalesceTimerRef.current = setTimeout(() => {
        coalesceTimerRef.current = null;
        flushTickerBuffer();
      }, COALESCE_INTERVAL_MS);
    }
  }, [flushTickerBuffer]);

  // Connect function declaration
  const connectRef = useRef<() => void>(() => {});

  // Reset watchdog on any valid incoming frame or connection attempt
  const resetWatchdog = useCallback(() => {
    stopWatchdog();
    if (isDestroyedRef.current || isErrorRef.current) return;

    watchdogTimerRef.current = setTimeout(() => {
      // 20 seconds elapsed with zero frames or stuck handshake -> STALE
      if (isDestroyedRef.current || isErrorRef.current) return;
      setStatus('STALE');

      // Close current socket and initiate reconnect
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {
          // ignore
        }
        socketRef.current = null;
      }
      triggerReconnect();
    }, WATCHDOG_TIMEOUT_MS);
  }, [stopWatchdog]);

  // Schedule reconnect with exponential backoff & jitter
  const triggerReconnect = useCallback(() => {
    if (isDestroyedRef.current || isErrorRef.current) return;
    if (reconnectTimerRef.current) return; // Only 1 timer at a time

    setStatus('RECONNECTING');

    const baseDelay =
      BACKOFF_STEPS[
        Math.min(backoffIndexRef.current, BACKOFF_STEPS.length - 1)
      ];
    const jitter = Math.floor(Math.random() * 500); // 0-500ms jitter
    const delay = baseDelay + jitter;

    backoffIndexRef.current += 1;

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      if (!isDestroyedRef.current && !isErrorRef.current) {
        connectRef.current();
      }
    }, delay);
  }, []);

  const connect = useCallback(() => {
    if (isDestroyedRef.current) return;

    // Stop any existing watchdog timer from previous socket/attempt
    stopWatchdog();

    // Clear any existing reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Close any previous socket cleanly
    if (socketRef.current) {
      try {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        socketRef.current.close();
      } catch {
        // ignore
      }
      socketRef.current = null;
    }

    isErrorRef.current = false;
    setStatus('CONNECTING');
    setErrorMessage(null);

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'WebSocket initialization failed';
      setErrorMessage(msg);
      triggerReconnect();
      return;
    }

    socketRef.current = ws;

    // Start watchdog immediately for handshake: if handshake stalls >20s, becomes STALE and retries
    resetWatchdog();

    ws.onopen = () => {
      if (isDestroyedRef.current || socketRef.current !== ws || isErrorRef.current) return;
      // Reset watchdog upon connection opening
      resetWatchdog();

      // Send ticker subscription
      try {
        ws.send(KRAKEN_SUBSCRIBE_MESSAGE);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to send subscription';
        setErrorMessage(msg);
        triggerReconnect();
      }
    };

    ws.onmessage = (event: MessageEvent) => {
      if (isDestroyedRef.current || socketRef.current !== ws) return;

      const now = Date.now();
      // Store in ref to avoid re-rendering on every single frame; flush with coalesced batch
      lastMessageAtRef.current = now;

      // ANY frame (heartbeat, status, ticker, etc.) resets the 20s watchdog unless in terminal error
      if (!isErrorRef.current) {
        resetWatchdog();
      }

      const parsed = parseKrakenMessage(
        typeof event.data === 'string' ? event.data : ''
      );

      switch (parsed.type) {
        case 'heartbeat':
        case 'status':
          // Valid exchange activity, watchdog already reset
          break;

        case 'error': {
          // Terminal/sticky error until manual reconnect
          isErrorRef.current = true;
          setErrorMessage(parsed.message);
          setStatus('ERROR');

          // Stop watchdog
          stopWatchdog();

          // Cancel any retry timer
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }

          // Safely detach event handlers and close the rejected socket without auto-reconnecting
          if (socketRef.current === ws) {
            try {
              ws.onopen = null;
              ws.onmessage = null;
              ws.onerror = null;
              ws.onclose = null;
              ws.close();
            } catch {
              // ignore
            }
            socketRef.current = null;
          }
          break;
        }

        case 'subscribe_ack':
          // Acknowledged, waiting for snapshot
          break;

        case 'ticker': {
          // If error was reported (subscription rejection), ERROR is sticky until manual retry.
          // Do not transition to LIVE while in error state.
          if (!isErrorRef.current) {
            setStatus('LIVE');
            backoffIndexRef.current = 0;
          }

          // Update buffered tickers
          for (const item of parsed.tickers) {
            const current = tickerBufferRef.current[item.symbol];
            let direction: PriceDirection = 'unchanged';

            if (current) {
              if (item.last > current.last) {
                direction = 'up';
              } else if (item.last < current.last) {
                direction = 'down';
              } else {
                direction = current.direction;
              }
            }

            // Build sparkline session history
            const prevSparkline = current?.sparkline ?? [];
            const newSparkline = [...prevSparkline, item.last].slice(-MAX_SPARKLINE_POINTS);

            const updatedTicker: MarketTicker = {
              symbol: item.symbol,
              last: item.last,
              prevLast: current?.last,
              change24h: item.change24h ?? current?.change24h,
              changePct24h: item.changePct24h ?? current?.changePct24h,
              high24h: item.high24h ?? current?.high24h,
              low24h: item.low24h ?? current?.low24h,
              volume24h: item.volume24h ?? current?.volume24h,
              lastReceivedAt: now,
              sparkline: newSparkline,
              direction,
              flashTimestamp: now,
            };

            tickerBufferRef.current[item.symbol] = updatedTicker;
          }

          hasPendingBufferRef.current = true;

          // If this is the initial snapshot, flush immediately for instant render
          if (parsed.isSnapshot) {
            flushTickerBuffer();
          } else {
            scheduleFlush();
          }
          break;
        }

        case 'ignored':
        default:
          break;
      }
    };

    ws.onerror = () => {
      if (isDestroyedRef.current || socketRef.current !== ws || isErrorRef.current) return;
      // Do not mark LIVE. Trigger reconnection for network failures.
      triggerReconnect();
    };

    ws.onclose = () => {
      if (isDestroyedRef.current || socketRef.current !== ws || isErrorRef.current) return;
      stopWatchdog();
      triggerReconnect();
    };
  }, [wsUrl, resetWatchdog, stopWatchdog, triggerReconnect, flushTickerBuffer, scheduleFlush]);

  // Keep ref up to date
  connectRef.current = connect;

  // Manual reconnect action (resets backoff and clears error state)
  const reconnect = useCallback(() => {
    isErrorRef.current = false;
    setErrorMessage(null);
    backoffIndexRef.current = 0;
    connect();
  }, [connect]);

  // Effect to manage socket lifecycle and unmount cleanup
  useEffect(() => {
    isDestroyedRef.current = false;
    connect();

    return () => {
      isDestroyedRef.current = true;
      stopWatchdog();

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (coalesceTimerRef.current) {
        clearTimeout(coalesceTimerRef.current);
        coalesceTimerRef.current = null;
      }

      if (socketRef.current) {
        try {
          socketRef.current.onopen = null;
          socketRef.current.onmessage = null;
          socketRef.current.onerror = null;
          socketRef.current.onclose = null;
          socketRef.current.close();
        } catch {
          // ignore
        }
        socketRef.current = null;
      }
    };
  }, [connect, stopWatchdog]);

  return {
    status,
    tickers,
    errorMessage,
    lastMessageAt,
    reconnect,
  };
}
