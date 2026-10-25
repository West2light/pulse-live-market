import { describe, it, expect } from 'vitest';
import { parseKrakenMessage } from '../src/services/krakenParser';

describe('krakenParser', () => {
  it('parses valid ticker snapshot with multiple symbols', () => {
    const raw = JSON.stringify({
      channel: 'ticker',
      type: 'snapshot',
      data: [
        {
          symbol: 'BTC/USD',
          bid: 80821.9,
          ask: 80822.0,
          last: 80824.1,
          volume: 1881.09,
          high: 80992.6,
          low: 79120.8,
          change: -36.0,
          change_pct: -0.04,
        },
        {
          symbol: 'ETH/USD',
          bid: 2363.03,
          ask: 2363.04,
          last: 2363.35,
          volume: 19351.37,
          high: 2387.07,
          low: 2279.8,
          change: -17.28,
          change_pct: -0.73,
        },
      ],
    });

    const result = parseKrakenMessage(raw);

    expect(result.type).toBe('ticker');
    if (result.type === 'ticker') {
      expect(result.isSnapshot).toBe(true);
      expect(result.tickers).toHaveLength(2);
      expect(result.tickers[0].symbol).toBe('BTC/USD');
      expect(result.tickers[0].last).toBe(80824.1);
      expect(result.tickers[0].changePct24h).toBe(-0.04);
      expect(result.tickers[1].symbol).toBe('ETH/USD');
      expect(result.tickers[1].last).toBe(2363.35);
      expect(result.tickers[1].changePct24h).toBe(-0.73);
    }
  });

  it('parses valid ticker update frame', () => {
    const raw = JSON.stringify({
      channel: 'ticker',
      type: 'update',
      data: [
        {
          symbol: 'SOL/USD',
          bid: 102.33,
          ask: 102.34,
          last: 102.34,
          volume: 247483.74,
          change: -0.2,
          change_pct: -0.2,
        },
      ],
    });

    const result = parseKrakenMessage(raw);
    expect(result.type).toBe('ticker');
    if (result.type === 'ticker') {
      expect(result.isSnapshot).toBe(false);
      expect(result.tickers).toHaveLength(1);
      expect(result.tickers[0].symbol).toBe('SOL/USD');
      expect(result.tickers[0].last).toBe(102.34);
    }
  });

  it('parses heartbeat channel', () => {
    const raw = JSON.stringify({ channel: 'heartbeat' });
    const result = parseKrakenMessage(raw);
    expect(result.type).toBe('heartbeat');
  });

  it('parses status channel', () => {
    const raw = JSON.stringify({
      channel: 'status',
      type: 'update',
      data: [{ version: '2.0.10', system: 'online', connection_id: 12345 }],
    });
    const result = parseKrakenMessage(raw);
    expect(result.type).toBe('status');
    if (result.type === 'status') {
      expect(result.system).toBe('online');
      expect(result.version).toBe('2.0.10');
    }
  });

  it('parses subscription acknowledgment', () => {
    const raw = JSON.stringify({
      method: 'subscribe',
      result: {
        channel: 'ticker',
        event_trigger: 'trades',
        snapshot: true,
        symbol: 'BTC/USD',
      },
      success: true,
    });
    const result = parseKrakenMessage(raw);
    expect(result.type).toBe('subscribe_ack');
    if (result.type === 'subscribe_ack') {
      expect(result.success).toBe(true);
      expect(result.channel).toBe('ticker');
      expect(result.symbol).toBe('BTC/USD');
    }
  });

  it('parses subscription error payload', () => {
    const raw = JSON.stringify({
      error: 'Currency pair not supported INVALID/PAIR',
      method: 'subscribe',
      success: false,
      symbol: 'INVALID/PAIR',
    });
    const result = parseKrakenMessage(raw);
    expect(result.type).toBe('error');
    if (result.type === 'error') {
      expect(result.message).toContain('Currency pair not supported');
      expect(result.symbol).toBe('INVALID/PAIR');
    }
  });

  it('safely discards malformed JSON strings without throwing', () => {
    const malformed = '{channel: "ticker", type: ';
    const result = parseKrakenMessage(malformed);
    expect(result.type).toBe('ignored');
    if (result.type === 'ignored') {
      expect(result.reason).toContain('Malformed JSON');
    }
  });

  it('safely discards empty or whitespace strings', () => {
    expect(parseKrakenMessage('').type).toBe('ignored');
    expect(parseKrakenMessage('   ').type).toBe('ignored');
  });

  it('filters out unsupported symbols and invalid non-finite numbers', () => {
    const raw = JSON.stringify({
      channel: 'ticker',
      type: 'update',
      data: [
        {
          symbol: 'DOGE/USD', // unsupported
          last: 0.15,
          change_pct: 1.2,
        },
        {
          symbol: 'BTC/USD',
          last: 'NaN_INVALID', // invalid last price
          change_pct: 0.5,
        },
      ],
    });

    const result = parseKrakenMessage(raw);
    expect(result.type).toBe('ignored');
  });

  it('does not invent 0 for missing or non-finite change_pct, representing it as undefined', () => {
    const raw = JSON.stringify({
      channel: 'ticker',
      type: 'update',
      data: [
        {
          symbol: 'BTC/USD',
          last: 80000,
          change_pct: null,
          change: 'invalid',
        },
      ],
    });

    const result = parseKrakenMessage(raw);
    expect(result.type).toBe('ticker');
    if (result.type === 'ticker') {
      expect(result.tickers[0].last).toBe(80000);
      expect(result.tickers[0].changePct24h).toBeUndefined();
      expect(result.tickers[0].change24h).toBeUndefined();
    }
  });
});
