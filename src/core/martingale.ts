import { config } from "../config";
import { logger } from "../utils/logger";

/**
 * Dynamic Sizing Manager - 'High-Safety' Strategy
 * Prioritizes the 1/4 Kelly Criterion for consistent, non-surprising growth.
 */
export class DynamicSizingManager {
  private currentTier: number = 0;
  private baseAmount: number;
  private maxTier: number;
  private useKelly: boolean = true; // Use Kelly by default for "Balanced Growth"

  constructor() {
    this.baseAmount = config.baseTradeAmount;
    this.maxTier = config.martingaleMaxTier;
  }

  /**
   * Called when a trade loses - For 'Balanced Growth' we do NOT double down.
   * We reset or slightly reduce risk to preserve capital.
   */
  onTradeLoss(): void {
    logger.warn(
      `Trade loss recorded. Resetting sizing to base to preserve capital.`,
    );
    this.currentTier = 0; // Reset tier - NEVER double down in "No-Surprise" mode
  }

  /**
   * Called when a trade wins
   */
  onTradeWin(): void {
    this.currentTier = 0;
    logger.info(`Trade win! Maintaining optimal sizing.`);
  }

  /**
   * Get trade amount based on Kelly or Fixed Base
   */
  getTradeAmount(kellySuggested?: number): number {
    if (this.useKelly && kellySuggested && kellySuggested > 0) {
      // Use the smaller of the two for safety
      return Math.min(this.baseAmount, kellySuggested);
    }
    return this.baseAmount;
  }

  /**
   * Check if at maximum tier
   */
  isAtMaxTier(): boolean {
    return this.currentTier >= this.maxTier;
  }

  /**
   * Force reset
   */
  reset(): void {
    this.currentTier = 0;
    logger.info("Sizing manager reset to base.");
  }

  /**
   * Get status summary
   */
  getStatus(): {
    mode: string;
    totalRisk: number;
  } {
    return {
      mode: this.useKelly ? "Fractional Kelly (0.25x)" : "Fixed Base",
      totalRisk: this.getTradeAmount(),
    };
  }
}
