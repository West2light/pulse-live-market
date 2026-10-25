import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKrakenTicker } from '../src/hooks/useKrakenTicker';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  sentMessages: string[] = [];
  readyState: number = 0; // 0 CONNECTING, 1 OPEN, 2 CLOSING, 3 CLOSED

  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = 3;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  // Test helpers to trigger events
  triggerOpen() {
    this.readyState = 1;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  triggerMessage(data: unknown) {
    if (this.onmessage) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      this.onmessage(new MessageEvent('message', { data: payload }));
    }
  }

  triggerError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

describe('useKrakenTicker hook lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('initializes in CONNECTING state and dispatches subscription on open', () => {
    const { result } = renderHook(() => useKrakenTicker('wss://ws.kraken.com/v2'));

    expect(result.current.status).toBe('CONNECTING');
    expect(MockWebSocket.instances).toHaveLength(1);
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.triggerOpen();
    });

    expect(ws.sentMessages).toHaveLength(1);
    const sent = JSON.parse(ws.sentMessages[0]);
    expect(sent.method).toBe('subscribe');
    expect(sent.params.channel).toBe('ticker');
    expect(sent.params.symbol).toContain('BTC/USD');
  });

  it('transitions to LIVE only after receiving a valid ticker message', () => {
    const { result } = renderHook(() => useKrakenTicker());
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.triggerOpen();
    });

    // Socket is open, but still CONNECTING until ticker arrives
    expect(result.current.status).toBe('CONNECTING');

    // Status or heartbeat received
    act(() => {
      ws.triggerMessage({ channel: 'status', data: [{ system: 'online' }] });
    });
    expect(result.current.status).toBe('CONNECTING');

    // Ticker snapshot arrives
    act(() => {
      ws.triggerMessage({
        channel: 'ticker',
        type: 'snapshot',
        data: [
          {
            symbol: 'BTC/USD',
            bid: 80000,
            ask: 80001,
            last: 80000.5,
            change: 150,
            change_pct: 0.18,
          },
        ],
      });
    });

    expect(result.current.status).toBe('LIVE');
    expect(result.current.tickers['BTC/USD']?.last).toBe(80000.5);
    expect(result.current.tickers['BTC/USD']?.changePct24h).toBe(0.18);
    expect(result.current.tickers['BTC/USD']?.sparkline).toEqual([80000.5]);
  });

  it('maintains sparkline points and coalesces rapid updates', () => {
    const { result } = renderHook(() => useKrakenTicker());
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.triggerOpen();
      ws.triggerMessage({
        channel: 'ticker',
        type: 'snapshot',
        data: [{ symbol: 'ETH/USD', last: 2300, change: 10, change_pct: 0.4 }],
      });
    });

    expect(result.current.tickers['ETH/USD']?.last).toBe(2300);

    // Send rapid updates
    act(() => {
      ws.triggerMessage({
        channel: 'ticker',
        type: 'update',
        data: [{ symbol: 'ETH/USD', last: 2310, change: 20, change_pct: 0.8 }],
      });
      ws.triggerMessage({
        channel: 'ticker',
        type: 'update',
        data: [{ symbol: 'ETH/USD', last: 2320, change: 30, change_pct: 1.2 }],
      });
    });

    // Advance coalescing timer (250ms)
    act(() => {
      vi.advanceTimersByTime(260);
    });

    expect(result.current.tickers['ETH/USD']?.last).toBe(2320);
    expect(result.current.tickers['ETH/USD']?.direction).toBe('up');
    expect(result.current.tickers['ETH/USD']?.sparkline).toEqual([2300, 2310, 2320]);
  });

  it('triggers STALE status and initiates reconnection after 20 seconds without frames', () => {
    const { result } = renderHook(() => useKrakenTicker());
    const ws1 = MockWebSocket.instances[0];

    act(() => {
      ws1.triggerOpen();
      ws1.triggerMessage({
        channel: 'ticker',
        type: 'snapshot',
        data: [{ symbol: 'BTC/USD', last: 80000, change: 0, change_pct: 0 }],
      });
    });

    expect(result.current.status).toBe('LIVE');

    // Advance 19 seconds - still alive
    act(() => {
      vi.advanceTimersByTime(19000);
    });
    expect(result.current.status).toBe('LIVE');

    // Advance another 2 seconds (total 21 seconds > 20s watchdog)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // STALE or RECONNECTING
    expect(['STALE', 'RECONNECTING']).toContain(result.current.status);
  });

  it('heartbeat frames reset the watchdog timer', () => {
    const { result } = renderHook(() => useKrakenTicker());
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.triggerOpen();
      ws.triggerMessage({
        channel: 'ticker',
        type: 'snapshot',
        data: [{ symbol: 'SOL/USD', last: 100, change: 0, change_pct: 0 }],
      });
    });

    expect(result.current.status).toBe('LIVE');

    // Advance 15 seconds
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    // Heartbeat arrives
    act(() => {
      ws.triggerMessage({ channel: 'heartbeat' });
    });

    // Advance another 15 seconds (total 30s elapsed from start, but only 15s since heartbeat)
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    // Still LIVE because heartbeat kept it alive!
    expect(result.current.status).toBe('LIVE');
  });

  it('sets ERROR status when exchange returns a subscription rejection error', () => {
    const { result } = renderHook(() => useKrakenTicker());
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.triggerOpen();
      ws.triggerMessage({
        error: 'Subscription rate limit exceeded',
        method: 'subscribe',
        success: false,
      });
    });

    expect(result.current.status).toBe('ERROR');
    expect(result.current.errorMessage).toContain('Subscription rate limit exceeded');
  });

  it('keeps ERROR state terminal/sticky without auto-reconnect even after >20s, and manual reconnect starts fresh socket and watchdog', () => {
    const { result } = renderHook(() => useKrakenTicker());
    const ws1 = MockWebSocket.instances[0];

    act(() => {
      ws1.triggerOpen();
      ws1.triggerMessage({
        error: 'Currency pair not supported INVALID/PAIR',
        method: 'subscribe',
        success: false,
      });
    });

    expect(result.current.status).toBe('ERROR');
    expect(result.current.errorMessage).toContain('Currency pair not supported');

    // Socket ws1 should be detached and closed
    expect(ws1.readyState).toBe(3);

    // Advance 30 seconds (> 20s watchdog threshold)
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    // Quiet rejected socket must STILL be in ERROR after >20s, no auto-reconnect
    expect(result.current.status).toBe('ERROR');
    expect(MockWebSocket.instances).toHaveLength(1);

    // Stray ticker frame arrives on socket while in ERROR
    act(() => {
      ws1.triggerMessage({
        channel: 'ticker',
        type: 'snapshot',
        data: [{ symbol: 'BTC/USD', last: 80000, change: 0, change_pct: 0 }],
      });
    });

    // Must stay ERROR, not turn LIVE
    expect(result.current.status).toBe('ERROR');

    // Only manual reconnect clears ERROR and starts a fresh socket & watchdog
    act(() => {
      result.current.reconnect();
    });

    expect(result.current.status).toBe('CONNECTING');
    expect(result.current.errorMessage).toBeNull();
    expect(MockWebSocket.instances).toHaveLength(2);

    const ws2 = MockWebSocket.instances[1];
    act(() => {
      ws2.triggerOpen();
      ws2.triggerMessage({
        channel: 'ticker',
        type: 'snapshot',
        data: [{ symbol: 'BTC/USD', last: 80000, change: 0, change_pct: 0 }],
      });
    });

    expect(result.current.status).toBe('LIVE');
  });

  it('prevents old watchdog from closing fresh socket after manual reconnect around 19s', () => {
    const { result } = renderHook(() => useKrakenTicker());
    const ws1 = MockWebSocket.instances[0];

    act(() => {
      ws1.triggerOpen();
    });

    // Advance 19 seconds (just before 20s watchdog fires)
    act(() => {
      vi.advanceTimersByTime(19000);
    });

    // User triggers manual reconnect
    act(() => {
      result.current.reconnect();
    });

    expect(MockWebSocket.instances).toHaveLength(2);
    const ws2 = MockWebSocket.instances[1];

    act(() => {
      ws2.triggerOpen();
    });

    // Advance 2 seconds (total 21s from beginning)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // ws2 must NOT have been closed by ws1's watchdog
    expect(ws2.readyState).toBe(1); // OPEN
    expect(result.current.status).toBe('CONNECTING');
  });

  it('triggers watchdog STALE and reconnection if handshake never opens after 20s', () => {
    const { result } = renderHook(() => useKrakenTicker());
    expect(MockWebSocket.instances).toHaveLength(1);
    const ws1 = MockWebSocket.instances[0];

    // ws1 never opens (stalled handshake)
    expect(result.current.status).toBe('CONNECTING');

    // Advance 20 seconds
    act(() => {
      vi.advanceTimersByTime(20000);
    });

    // Status transitions to STALE or RECONNECTING and closes zombie socket
    expect(['STALE', 'RECONNECTING']).toContain(result.current.status);
    expect(ws1.readyState).toBe(3); // CLOSED
  });

  it('guarantees clean teardown on unmount without duplicate connections', () => {
    const { unmount } = renderHook(() => useKrakenTicker());
    expect(MockWebSocket.instances).toHaveLength(1);
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.triggerOpen();
    });

    unmount();

    // Socket should have closed
    expect(ws.readyState).toBe(3);

    // Advancing timers should not cause new connections after unmount
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(MockWebSocket.instances).toHaveLength(1);
  });
});
