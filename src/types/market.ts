export type SupportedSymbol = 'BTC/USD' | 'ETH/USD' | 'SOL/USD' | 'XRP/USD';

export const SUPPORTED_SYMBOLS: readonly SupportedSymbol[] = [
  'BTC/USD',
  'ETH/USD',
  'SOL/USD',
  'XRP/USD',
] as const;

export interface SymbolMetadata {
  symbol: SupportedSymbol;
  name: string;
  asset: string;
  decimals: number;
  description: string;
}

export const SYMBOL_METADATA: Record<SupportedSymbol, SymbolMetadata> = {
  'BTC/USD': {
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    asset: 'BTC',
    decimals: 2,
    description: 'Digital reserve asset & settlement layer',
  },
  'ETH/USD': {
    symbol: 'ETH/USD',
    name: 'Ethereum',
    asset: 'ETH',
    decimals: 2,
    description: 'Programmable smart contract platform',
  },
  'SOL/USD': {
    symbol: 'SOL/USD',
    name: 'Solana',
    asset: 'SOL',
    decimals: 2,
    description: 'High-throughput execution network',
  },
  'XRP/USD': {
    symbol: 'XRP/USD',
    name: 'XRP',
    asset: 'XRP',
    decimals: 4,
    description: 'Institutional liquidity & remittance protocol',
  },
};

export type ConnectionStatus =
  | 'CONNECTING'
  | 'LIVE'
  | 'STALE'
  | 'RECONNECTING'
  | 'ERROR';

export type PriceDirection = 'up' | 'down' | 'unchanged';

export interface MarketTicker {
  symbol: SupportedSymbol;
  last: number;
  prevLast?: number;
  change24h?: number;
  changePct24h?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  lastReceivedAt: number; // Date.now() timestamp when client processed tick
  sparkline: number[]; // Up to 24 real session price points
  direction: PriceDirection;
  flashTimestamp?: number;
}

export type ParsedMessage =
  | {
      type: 'ticker';
      isSnapshot: boolean;
      tickers: Array<{
        symbol: SupportedSymbol;
        last: number;
        change24h?: number;
        changePct24h?: number;
        high24h?: number;
        low24h?: number;
        volume24h?: number;
      }>;
    }
  | {
      type: 'heartbeat';
    }
  | {
      type: 'status';
      system: string;
      version?: string;
    }
  | {
      type: 'subscribe_ack';
      success: boolean;
      channel: string;
      symbol?: string;
    }
  | {
      type: 'error';
      message: string;
      symbol?: string;
    }
  | {
      type: 'ignored';
      reason: string;
    };
