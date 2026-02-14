import { TradeDecision, Candle } from '../types';
import { config } from '../config';
import { ManipulationDetector } from './manipulation-detector';
import { randomizeThreshold, shouldHesitate, HumanDecisionMaker } from '../utils/humanization';
import { logger } from '../utils/logger';

/**
 * Trading Decision Engine
 * Makes final trade decision with human-like randomization
 */
export class TradingDecisionEngine {
  private manipulationDetector: ManipulationDetector;
  private humanDecisionMaker: HumanDecisionMaker;
  private baseConfidenceThreshold: number;

  constructor(manipulationDetector: ManipulationDetector) {
    this.manipulationDetector = manipulationDetector;
    this.humanDecisionMaker = new HumanDecisionMaker();
    this.baseConfidenceThreshold = config.minConfidenceThreshold;
  }

  /**
   * Make final trading decision with randomization
   */
  async makeDecision(
    indicatorDecision: TradeDecision,
    candles: Candle[]
  ): Promise<{ shouldTrade: boolean; decision: TradeDecision; reason?: string }> {
    // 1. Check for price manipulation
    const manipulation = this.manipulationDetector.detectManipulation(candles);
    if (manipulation.isManipulated) {
      logger.warn('Trade blocked: Price manipulation detected');
      return {
        shouldTrade: false,
        decision: indicatorDecision,
        reason: `Manipulation: ${manipulation.reasons.join(', ')}`,
      };
    }

    // 2. Randomize confidence threshold (prevent predictability)
    const dynamicThreshold = randomizeThreshold(this.baseConfidenceThreshold, 5);

    // 3. Check if confidence meets threshold
    if (indicatorDecision.confidence < dynamicThreshold) {
      return {
        shouldTrade: false,
        decision: indicatorDecision,
        reason: `Low confidence: ${indicatorDecision.confidence.toFixed(2)} < ${dynamicThreshold.toFixed(2)}`,
      };
    }

    // 4. Check if decision is WAIT
    if (indicatorDecision.direction === 'WAIT') {
      return {
        shouldTrade: false,
        decision: indicatorDecision,
        reason: 'Indicator decision is WAIT',
      };
    }

    // 5. Human hesitation (randomly skip some trades)
    if (shouldHesitate(0.05)) {
      logger.info('Trade skipped: Human hesitation simulation');
      return {
        shouldTrade: false,
        decision: indicatorDecision,
        reason: 'Human hesitation',
      };
    }

    // 6. Check for repetitive pattern (avoid predictability)
    if (this.humanDecisionMaker.shouldOverrideDecision(indicatorDecision.direction)) {
      logger.info('Trade skipped: Avoiding repetitive pattern');
      return {
        shouldTrade: false,
        decision: indicatorDecision,
        reason: 'Pattern variance',
      };
    }

    // 7. All checks passed - trade approved
    this.humanDecisionMaker.recordDecision(indicatorDecision.direction);
    
    logger.info(
      `✅ Trade approved: ${indicatorDecision.direction} with ${(indicatorDecision.confidence * 100).toFixed(1)}% confidence`
    );

    return {
      shouldTrade: true,
      decision: indicatorDecision,
    };
  }

  /**
   * Occasionally pause between trades (human fatigue)
   */
  async considerPause(): Promise<void> {
    await this.humanDecisionMaker.randomPause();
  }

  /**
   * Update confidence threshold (learning system can adjust)
   */
  updateConfidenceThreshold(newThreshold: number): void {
    this.baseConfidenceThreshold = newThreshold;
    logger.info(`Confidence threshold updated to ${newThreshold.toFixed(2)}`);
  }
}
