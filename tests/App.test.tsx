import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import App from '../src/App';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  sentMessages: string[] = [];
  readyState: number = 0;

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
}

describe('App Component Integration & Accessibility', () => {
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

  it('renders all landmarks, semantic headings, and the 4 market cards', () => {
    render(<App />);

    // Landmarks
    expect(screen.getByRole('banner')).toBeDefined();
    expect(screen.getByRole('main')).toBeDefined();
    expect(screen.getByRole('contentinfo')).toBeDefined();

    // Headings
    expect(screen.getByRole('heading', { level: 1, name: /See the market move/i })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: /Live Market Board/i })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: /Direct feed architecture/i })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: /How PULSE streams market truth/i })).toBeDefined();

    // 4 Market Cards
    expect(screen.getByText('BTC/USD')).toBeDefined();
    expect(screen.getByText('ETH/USD')).toBeDefined();
    expect(screen.getByText('SOL/USD')).toBeDefined();
    expect(screen.getByText('XRP/USD')).toBeDefined();
  });

  it('verifies that all links are functional and point to valid anchors or external docs', () => {
    render(<App />);
    const links = screen.getAllByRole('link');

    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      const href = link.getAttribute('href');
      expect(href).toBeTruthy();
      // Valid internal anchor or valid https URL
      const isValid = href?.startsWith('#') || href?.startsWith('https://docs.kraken.com');
      expect(isValid).toBe(true);
    }
  });

  it('updates market cards and connection status when Kraken live data arrives', () => {
    render(<App />);
    const ws = MockWebSocket.instances[0];

    // Initial state: CONNECTING
    expect(screen.getByText('CONNECTING')).toBeDefined();

    // Open socket
    act(() => {
      ws.triggerOpen();
    });

    // Send ticker snapshots
    act(() => {
      ws.triggerMessage({
        channel: 'ticker',
        type: 'snapshot',
        data: [
          {
            symbol: 'BTC/USD',
            bid: 80800,
            ask: 80801,
            last: 80824.1,
            volume: 1800,
            change: 120,
            change_pct: 1.45,
            high: 81000,
            low: 79000,
          },
          {
            symbol: 'ETH/USD',
            bid: 2360,
            ask: 2361,
            last: 2363.35,
            volume: 19000,
            change: -20,
            change_pct: -0.84,
            high: 2400,
            low: 2300,
          },
          {
            symbol: 'SOL/USD',
            bid: 102,
            ask: 103,
            last: 102.5,
            volume: 24000,
            change: 2.5,
            change_pct: 2.5,
          },
          {
            symbol: 'XRP/USD',
            bid: 1.3,
            ask: 1.31,
            last: 1.3092,
            volume: 50000,
            change: 0.02,
            change_pct: 1.55,
          },
        ],
      });
    });

    // Connection badge turns LIVE STREAM
    expect(screen.getByText('LIVE STREAM')).toBeDefined();

    // Formatted prices rendered
    expect(screen.getByText('80,824.10')).toBeDefined();
    expect(screen.getByText('2,363.35')).toBeDefined();
    expect(screen.getByText('102.50')).toBeDefined();
    expect(screen.getByText('1.3092')).toBeDefined();
  });

  it('shows no STALE pill for null/skeleton cards, but shows STALE pill and styling when ticker is retained in non-LIVE states', () => {
    render(<App />);
    const ws = MockWebSocket.instances[0];

    // Initial state: CONNECTING, no ticker data yet (null/skeleton)
    // There should be NO stale pill
    expect(screen.queryByText('STALE')).toBeNull();

    // Now send live snapshot
    act(() => {
      ws.triggerOpen();
      ws.triggerMessage({
        channel: 'ticker',
        type: 'snapshot',
        data: [
          {
            symbol: 'BTC/USD',
            bid: 80800,
            ask: 80801,
            last: 80824.1,
            change: 120,
            change_pct: 1.45,
          },
        ],
      });
    });

    // Connection is LIVE: still NO stale pill
    expect(screen.queryByText('STALE')).toBeNull();

    // Now advance time past 20s watchdog threshold -> connection becomes STALE / RECONNECTING
    act(() => {
      vi.advanceTimersByTime(21000);
    });

    // Since BTC/USD has retained ticker data and status is not LIVE, STALE pill MUST now be visible!
    expect(screen.getAllByText('STALE').length).toBeGreaterThan(0);
  });
});
