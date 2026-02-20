import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "learning_data.json");

interface TradeRecord {
  timestamp: string;
  symbol: string;
  signal: string; // STRONG_BUY, BUY, etc.
  hour: number; // 0-23
  result: "WIN" | "LOSS";
}

export class LearningService {
  private history: TradeRecord[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        this.history = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      }
    } catch (e) {
      console.error("Failed to load learning data:", e);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.history, null, 2));
    } catch (e) {
      console.error("Failed to save learning data:", e);
    }
  }

  recordTrade(symbol: string, signal: string, result: "WIN" | "LOSS") {
    this.history.push({
      timestamp: new Date().toISOString(),
      hour: new Date().getHours(),
      symbol,
      signal,
      result,
    });
    this.save();
    console.log(`🧠 [Learning] Recorded ${result} for ${signal} on ${symbol}`);
  }

  /**
   * Checks if we should take a trade based on past performance.
   * Uses a time-weighted (EMA) win rate to give more importance to recent trades.
   */
  shouldTrade(
    symbol: string,
    signal: string,
  ): { allowed: boolean; winRate: number; reason: string } {
    // 1. Filter history for similar trades, sorted by most recent
    const relevant = this.history
      .filter((t) => t.symbol === symbol && t.signal === signal)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

    // 2. If not enough data, allow it (Explore phase)
    if (relevant.length < 5) {
      return {
        allowed: true,
        winRate: 0,
        reason: "Insufficient data (Exploration mode)",
      };
    }

    // 3. Calculate Exponentially Weighted Win Rate (EWWR)
    // Alpha determines the weight of the most recent trade (0.2 = 20%)
    const alpha = 0.2;
    let ewwr = relevant[relevant.length - 1].result === "WIN" ? 1 : 0; // Initialize with oldest

    // Apply EMA from oldest to newest (index reversed because we sorted by newest)
    for (let i = relevant.length - 2; i >= 0; i--) {
      const win = relevant[i].result === "WIN" ? 1 : 0;
      ewwr = win * alpha + ewwr * (1 - alpha);
    }

    const winRate = ewwr * 100;

    // 4. Decision: Dynamic threshold based on sample size
    // Higher confidence needed for fewer samples
    const threshold = relevant.length < 10 ? 55 : 48;

    if (winRate < threshold) {
      return {
        allowed: false,
        winRate,
        reason: `Weighted win rate too low (${winRate.toFixed(1)}% < ${threshold}%)`,
      };
    }

    return {
      allowed: true,
      winRate,
      reason: `Weighted win rate acceptable (${winRate.toFixed(1)}%)`,
    };
  }

  getStats() {
    const total = this.history.length;
    const wins = this.history.filter((t) => t.result === "WIN").length;
    return {
      totalTrades: total,
      globalWinRate: total > 0 ? ((wins / total) * 100).toFixed(1) + "%" : "0%",
    };
  }
}
