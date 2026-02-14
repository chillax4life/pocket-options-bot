import { config } from '../config';
import { PnLTracker } from './pnl-tracker';
import { logger } from '../utils/logger';

/**
 * Risk Manager - Circuit Breaker
 * Implements safety limits from base-trader pattern
 */
export class RiskManager {
  private pnlTracker: PnLTracker;
  private startingBalance: number;
  private tradingHalted: boolean = false;
  private haltReason: string = '';

  constructor(pnlTracker: PnLTracker, startingBalance: number) {
    this.pnlTracker = pnlTracker;
    this.startingBalance = startingBalance;
  }

  /**
   * Check if trading should be allowed
   */
  canTrade(): { allowed: boolean; reason?: string } {
    if (this.tradingHalted) {
      return { allowed: false, reason: this.haltReason };
    }

    if (!config.circuitBreakerEnabled) {
      return { allowed: true };
    }

    // Check 1: Daily loss limit
    const dailyLoss = this.pnlTracker.getDailyLossPercent(this.startingBalance);
    if (dailyLoss <= -config.maxDailyLossPercent) {
      this.halt(`Daily loss limit reached: ${dailyLoss.toFixed(2)}%`);
      return { allowed: false, reason: this.haltReason };
    }

    // Check 2: Consecutive loss streak
    const lossStreak = this.pnlTracker.getConsecutiveLosses();
    if (lossStreak >= config.stopOnLossStreak) {
      this.halt(`Consecutive loss streak: ${lossStreak} trades`);
      return { allowed: false, reason: this.haltReason };
    }

    return { allowed: true };
  }

  /**
   * Halt trading with reason
   */
  halt(reason: string): void {
    this.tradingHalted = true;
    this.haltReason = reason;
    logger.error(`🛑 TRADING HALTED: ${reason}`);
  }

  /**
   * Resume trading (manual override)
   */
  resume(): void {
    this.tradingHalted = false;
    this.haltReason = '';
    logger.info('✅ Trading resumed');
  }

  /**
   * Check if currently halted
   */
  isHalted(): boolean {
    return this.tradingHalted;
  }

  /**
   * Get halt reason
   */
  getHaltReason(): string {
    return this.haltReason;
  }

  /**
   * Validate trade amount
   */
  validateTradeAmount(amount: number): { valid: boolean; reason?: string } {
    if (amount <= 0) {
      return { valid: false, reason: 'Trade amount must be positive' };
    }

    if (amount > this.startingBalance) {
      return { valid: false, reason: 'Trade amount exceeds balance' };
    }

    return { valid: true };
  }

  /**
   * Check if Martingale tier is safe
   */
  validateMartingaleTier(
    tier: number,
    totalRisk: number
  ): { valid: boolean; reason?: string } {
    // Check if total risk exceeds 50% of balance
    const riskPercent = (totalRisk / this.startingBalance) * 100;
    if (riskPercent > 50) {
      return {
        valid: false,
        reason: `Martingale tier ${tier} risks ${riskPercent.toFixed(0)}% of balance`,
      };
    }

    return { valid: true };
  }
}
