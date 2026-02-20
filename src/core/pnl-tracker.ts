import { TradeResult, PnLStats, PnLPeriod } from "../types";
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const TRADES_FILE = path.join(DATA_DIR, "trades.json");

/**
 * P&L (Profit & Loss) Tracker
 * Adapted from solana-funding-arb for binary options trading
 */
export class PnLTracker {
  private trades: TradeResult[] = [];

  constructor() {
    this.ensureDataDir();
    this.loadTrades();
  }

  /**
   * Record a completed trade
   */
  recordTrade(result: TradeResult): void {
    this.trades.push(result);
    this.saveTrades();
  }

  /**
   * Get P&L statistics for different time periods
   */
  getStats(): PnLStats {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    return {
      daily: this.calculatePeriod(
        this.trades.filter((t) => t.timestamp > dayAgo),
      ),
      weekly: this.calculatePeriod(
        this.trades.filter((t) => t.timestamp > weekAgo),
      ),
      monthly: this.calculatePeriod(
        this.trades.filter((t) => t.timestamp > monthAgo),
      ),
      allTime: this.calculatePeriod(this.trades),
    };
  }

  /**
   * Get recent trades
   */
  getRecentTrades(limit: number = 50): TradeResult[] {
    return this.trades.slice(-limit).reverse();
  }

  /**
   * Get consecutive loss count
   */
  getConsecutiveLosses(): number {
    let count = 0;
    for (let i = this.trades.length - 1; i >= 0; i--) {
      if (!this.trades[i].success) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  /**
   * Calculate daily loss from starting balance
   */
  getDailyLossPercent(startingBalance: number): number {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const todayTrades = this.trades.filter((t) => t.timestamp > dayAgo);

    const totalPnL = todayTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    return (totalPnL / startingBalance) * 100;
  }

  /**
   * Calculate P&L for a period
   */
  private calculatePeriod(trades: TradeResult[]): PnLPeriod {
    if (trades.length === 0) {
      return {
        profitUsd: 0,
        trades: 0,
        winRate: 0,
        avgProfitPerTrade: 0,
        bestTrade: 0,
        worstTrade: 0,
      };
    }

    const profits = trades.map((t) => t.profitLoss);
    const successfulTrades = trades.filter((t) => t.success);

    return {
      profitUsd: profits.reduce((a, b) => a + b, 0),
      trades: trades.length,
      winRate: (successfulTrades.length / trades.length) * 100,
      avgProfitPerTrade: profits.reduce((a, b) => a + b, 0) / trades.length,
      bestTrade: Math.max(...profits),
      worstTrade: Math.min(...profits),
    };
  }

  /**
   * Get summary string for display
   */
  getSummaryString(): string {
    const stats = this.getStats();

    return `
╔══════════════════════════════════════════════════╗
║       Pocket Options Bot - P&L Summary           ║
╠══════════════════════════════════════════════════╣
║  Daily:   ${this.formatProfit(stats.daily.profitUsd).padEnd(12)} (${stats.daily.trades} trades, ${stats.daily.winRate.toFixed(0)}% win)
║  Weekly:  ${this.formatProfit(stats.weekly.profitUsd).padEnd(12)} (${stats.weekly.trades} trades, ${stats.weekly.winRate.toFixed(0)}% win)
║  Monthly: ${this.formatProfit(stats.monthly.profitUsd).padEnd(12)} (${stats.monthly.trades} trades, ${stats.monthly.winRate.toFixed(0)}% win)
║  AllTime: ${this.formatProfit(stats.allTime.profitUsd).padEnd(12)} (${stats.allTime.trades} trades, ${stats.allTime.winRate.toFixed(0)}% win)
╚══════════════════════════════════════════════════╝`;
  }

  private formatProfit(amount: number): string {
    const sign = amount >= 0 ? "+" : "";
    return `${sign}$${amount.toFixed(2)}`;
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadTrades(): void {
    try {
      if (fs.existsSync(TRADES_FILE)) {
        const data = fs.readFileSync(TRADES_FILE, "utf-8");
        this.trades = JSON.parse(data);
      }
    } catch (error) {
      console.error("Failed to load trades:", error);
      this.trades = [];
    }
  }

  private saveTrades(): void {
    try {
      fs.writeFileSync(TRADES_FILE, JSON.stringify(this.trades, null, 2));
    } catch (error) {
      console.error("Failed to save trades:", error);
    }
  }
}
