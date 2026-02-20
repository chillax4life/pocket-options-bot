export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Indicator {
  name: string;
  weight: number;
  calculate(candles: Candle[]): Signal;
  adjustWeight(success: boolean): void;
}

export interface Signal {
  direction: "BUY" | "SELL" | "NEUTRAL";
  strength: number;
  confidence: number;
}

export interface TradeDecision {
  direction: "BUY" | "SELL" | "WAIT";
  confidence: number;
  indicatorScores: Record<string, number>;
  timestamp: number;
}

export interface TradeResult {
  id: string;
  timestamp: number;
  asset: string;
  direction: "BUY" | "SELL";
  amount: number;
  expirationMinutes: number;
  success: boolean;
  profitLoss: number;
  martingaleTier: number;
  indicatorSnapshot: Record<string, number>;
}

export interface PnLPeriod {
  profitUsd: number;
  trades: number;
  winRate: number;
  avgProfitPerTrade: number;
  bestTrade: number;
  worstTrade: number;
}

export interface PnLStats {
  daily: PnLPeriod;
  weekly: PnLPeriod;
  monthly: PnLPeriod;
  allTime: PnLPeriod;
}

export interface Config {
  baseTradeAmount: number;
  maxDailyLossPercent: number;
  martingaleMaxTier: number;
  learningRate: number;
  minConfidenceThreshold: number;
  stopOnLossStreak: number;
  circuitBreakerEnabled: boolean;
  headlessMode: boolean;
}

export interface TradeMemory {
  timestamp: number;
  signal: TradeDecision;
  indicatorSnapshot: Record<string, number>;
  result: boolean;
  profitLoss: number;
  pattern: string;
}
