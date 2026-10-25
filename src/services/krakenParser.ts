import { ParsedMessage, SupportedSymbol, SUPPORTED_SYMBOLS } from '../types/market';

export const KRAKEN_WS_URL = 'wss://ws.kraken.com/v2';

export const KRAKEN_SUBSCRIBE_MESSAGE = JSON.stringify({
  method: 'subscribe',
  params: {
    channel: 'ticker',
    symbol: [...SUPPORTED_SYMBOLS],
    event_trigger: 'trades',
    snapshot: true,
  },
});

function isSupportedSymbol(sym: unknown): sym is SupportedSymbol {
  return typeof sym === 'string' && (SUPPORTED_SYMBOLS as readonly string[]).includes(sym);
}

export function parseKrakenMessage(rawData: string): ParsedMessage {
  if (typeof rawData !== 'string' || !rawData.trim()) {
    return { type: 'ignored', reason: 'Empty payload' };
  }

  let json: unknown;
  try {
    json = JSON.parse(rawData);
  } catch {
    return { type: 'ignored', reason: 'Malformed JSON frame' };
  }

  if (typeof json !== 'object' || json === null) {
    return { type: 'ignored', reason: 'Invalid JSON structure' };
  }

  const msg = json as Record<string, unknown>;

  // 1. Subscription Error or General Error
  if (msg.error || msg.success === false) {
    const errorMsg =
      typeof msg.error === 'string'
        ? msg.error
        : typeof msg.message === 'string'
          ? msg.message
          : 'Subscription or request rejected by exchange';
    return {
      type: 'error',
      message: errorMsg,
      symbol: typeof msg.symbol === 'string' ? msg.symbol : undefined,
    };
  }

  // 2. Heartbeat channel
  if (msg.channel === 'heartbeat') {
    return { type: 'heartbeat' };
  }

  // 3. Status channel
  if (msg.channel === 'status') {
    const dataArray = Array.isArray(msg.data) ? msg.data : [];
    const first = (dataArray[0] as Record<string, unknown> | undefined) || {};
    return {
      type: 'status',
      system: typeof first.system === 'string' ? first.system : 'online',
      version: typeof first.version === 'string' ? first.version : undefined,
    };
  }

  // 4. Subscription acknowledgment
  if (msg.method === 'subscribe' && msg.success === true) {
    const res = (msg.result as Record<string, unknown> | undefined) || {};
    return {
      type: 'subscribe_ack',
      success: true,
      channel: typeof res.channel === 'string' ? res.channel : 'ticker',
      symbol: typeof res.symbol === 'string' ? res.symbol : undefined,
    };
  }

  // 5. Ticker stream (both snapshot and update)
  if (msg.channel === 'ticker') {
    const isSnapshot = msg.type === 'snapshot';
    const rawDataArray = Array.isArray(msg.data) ? msg.data : [];
    const validTickers: Array<{
      symbol: SupportedSymbol;
      last: number;
      change24h?: number;
      changePct24h?: number;
      high24h?: number;
      low24h?: number;
      volume24h?: number;
    }> = [];

    for (const item of rawDataArray) {
      if (typeof item !== 'object' || item === null) continue;
      const rec = item as Record<string, unknown>;
      const symbol = rec.symbol;

      if (!isSupportedSymbol(symbol)) continue;

      const last = rec.last;
      const changePct = rec.change_pct;
      const change = rec.change;

      // Last price must be a finite number
      if (typeof last !== 'number' || !Number.isFinite(last)) continue;

      // Do NOT invent 0 if exchange didn't provide a valid finite number
      const changePct24h =
        typeof changePct === 'number' && Number.isFinite(changePct)
          ? changePct
          : undefined;

      const change24h =
        typeof change === 'number' && Number.isFinite(change)
          ? change
          : undefined;

      const high24h =
        typeof rec.high === 'number' && Number.isFinite(rec.high)
          ? rec.high
          : undefined;

      const low24h =
        typeof rec.low === 'number' && Number.isFinite(rec.low)
          ? rec.low
          : undefined;

      const volume24h =
        typeof rec.volume === 'number' && Number.isFinite(rec.volume)
          ? rec.volume
          : undefined;

      validTickers.push({
        symbol,
        last,
        change24h,
        changePct24h,
        high24h,
        low24h,
        volume24h,
      });
    }

    if (validTickers.length > 0) {
      return {
        type: 'ticker',
        isSnapshot,
        tickers: validTickers,
      };
    }

    return {
      type: 'ignored',
      reason: 'No supported ticker records with valid numeric prices',
    };
  }

  return {
    type: 'ignored',
    reason: `Unhandled channel/method: ${String(msg.channel || msg.method)}`,
  };
}
