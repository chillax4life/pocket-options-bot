import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Martingale Strategy Manager
 * Implements 1 → 2 → 4 → 8 simultaneous trades progression
 */
export class MartingaleManager {
  private currentTier: number = 0;
  private baseAmount: number;
  private maxTier: number;

  constructor() {
    this.baseAmount = config.baseTradeAmount;
    this.maxTier = config.martingaleMaxTier;
  }

  /**
   * Called when a trade loses
   */
  onTradeLoss(): void {
    if (this.currentTier < this.maxTier) {
      this.currentTier++;
      logger.warn(`Martingale tier increased to ${this.currentTier} (${this.getTradeCount()} trades)`);
    } else {
      logger.error('Martingale max tier reached! Consider stopping trading.');
    }
  }

  /**
   * Called when a trade wins
   */
  onTradeWin(): void {
    if (this.currentTier > 0) {
      logger.info(`Martingale recovered! Resetting from tier ${this.currentTier} to 0`);
    }
    this.currentTier = 0;
  }

  /**
   * Get current tier
   */
  getCurrentTier(): number {
    return this.currentTier;
  }

  /**
   * Get number of simultaneous trades to execute
   */
  getTradeCount(): number {
    return Math.pow(2, this.currentTier); // 2^0=1, 2^1=2, 2^2=4, 2^3=8
  }

  /**
   * Get amount per individual trade
   */
  getTradeAmount(): number {
    return this.baseAmount;
  }

  /**
   * Get total capital at risk
   */
  getTotalRisk(): number {
    return this.getTradeCount() * this.baseAmount;
  }

  /**
   * Check if at maximum tier
   */
  isAtMaxTier(): boolean {
    return this.currentTier >= this.maxTier;
  }

  /**
   * Force reset to tier 0
   */
  reset(): void {
    this.currentTier = 0;
    logger.info('Martingale manager reset to tier 0');
  }

  /**
   * Get status summary
   */
  getStatus(): {
    tier: number;
    tradeCount: number;
    totalRisk: number;
    isMaxTier: boolean;
  } {
    return {
      tier: this.currentTier,
      tradeCount: this.getTradeCount(),
      totalRisk: this.getTotalRisk(),
      isMaxTier: this.isAtMaxTier(),
    };
  }
}
