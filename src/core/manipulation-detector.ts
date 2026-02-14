import { Candle } from '../types';
import { logger } from '../utils/logger';

/**
 * Price Manipulation Detector
 * Detects honeypot patterns and suspicious price action
 */
export class ManipulationDetector {
  private sensitivity: number = 1.0;

  /**
   * Detect if current market conditions show manipulation
   */
  detectManipulation(candles: Candle[]): {
    isManipulated: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    if (this.hasVolumeSpike(candles)) {
      reasons.push('Unusual volume spike detected');
    }

    if (this.detectWickPattern(candles) === 'MANIPULATION') {
      reasons.push('Repeated wick pattern suggests stop hunting');
    }

    if (this.hasAbnormalSpread(candles)) {
      reasons.push('Abnormally tight spread with low volume');
    }

    if (this.detectSuddenReversal(candles)) {
      reasons.push('Sudden reversal without volume support');
    }

    const isManipulated = reasons.length >= 2; // Require 2+ signals

    if (isManipulated) {
      logger.warn(`⚠️  Manipulation detected: ${reasons.join(', ')}`);
    }

    return { isManipulated, reasons };
  }

  /**
   * Detect volume spike without price movement
   */
  private hasVolumeSpike(candles: Candle[]): boolean {
    if (candles.length < 20) return false;

    const recent = candles.slice(-20);
    const avgVolume = recent.reduce((sum, c) => sum + c.volume, 0) / 20;
    const lastVolume = candles[candles.length - 1].volume;

    const threshold = 3 * this.sensitivity;
    const hasSpike = lastVolume > avgVolume * threshold;

    // Check if price is stagnant despite volume spike
    const lastCandle = candles[candles.length - 1];
    const priceChange = Math.abs((lastCandle.close - lastCandle.open) / lastCandle.open);
    const isStagnant = priceChange < 0.001; // Less than 0.1% movement

    return hasSpike && isStagnant;
  }

  /**
   * Detect repeated wick patterns (stop hunting)
   */
  private detectWickPattern(candles: Candle[]): 'MANIPULATION' | 'NORMAL' {
    if (candles.length < 5) return 'NORMAL';

    const recent = candles.slice(-5);
    let upperWicks = 0;
    let lowerWicks = 0;

    for (const c of recent) {
      const bodySize = Math.abs(c.close - c.open);
      const totalSize = c.high - c.low;
      
      if (totalSize === 0) continue;

      const upperWickSize = c.high - Math.max(c.open, c.close);
      const lowerWickSize = Math.min(c.open, c.close) - c.low;

      const upperWickRatio = upperWickSize / totalSize;
      const lowerWickRatio = lowerWickSize / totalSize;

      if (upperWickRatio > 0.6 * this.sensitivity) upperWicks++;
      if (lowerWickRatio > 0.6 * this.sensitivity) lowerWicks++;
    }

    // 3+ consecutive large wicks in same direction = manipulation
    if (upperWicks >= 3 || lowerWicks >= 3) {
      return 'MANIPULATION';
    }

    return 'NORMAL';
  }

  /**
   * Detect abnormally tight spread
   */
  private hasAbnormalSpread(candles: Candle[]): boolean {
    if (candles.length < 10) return false;

    const recent = candles.slice(-10);
    const spreads = recent.map(c => (c.high - c.low) / c.low);
    const avgSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;

    const lastSpread = spreads[spreads.length - 1];
    
    // Unusually tight spread (less than 30% of average)
    return lastSpread < avgSpread * 0.3 && avgSpread > 0;
  }

  /**
   * Detect sudden reversal without volume
   */
  private detectSuddenReversal(candles: Candle[]): boolean {
    if (candles.length < 3) return false;

    const [prev2, prev1, current] = candles.slice(-3);

    // Check for strong trend followed by sharp reversal
    const trend = (prev1.close - prev2.close) / prev2.close;
    const reversal = (current.close - prev1.close) / prev1.close;

    const hasTrend = Math.abs(trend) > 0.005; // 0.5% trend
    const hasReversal = Math.abs(reversal) > 0.005; // 0.5% reversal
    const isOppositeDirection = trend * reversal < 0;

    // Check if reversal happened without volume increase
    const volumeIncreased = current.volume > prev1.volume * 1.2;

    return hasTrend && hasReversal && isOppositeDirection && !volumeIncreased;
  }

  /**
   * Increase detection sensitivity (after loss streak)
   */
  increaseSensitivity(amount: number = 0.1): void {
    this.sensitivity = Math.min(this.sensitivity + amount, 2.0);
    logger.info(`Manipulation detection sensitivity increased to ${this.sensitivity.toFixed(2)}`);
  }

  /**
   * Decrease detection sensitivity
   */
  decreaseSensitivity(amount: number = 0.1): void {
    this.sensitivity = Math.max(this.sensitivity - amount, 0.5);
    logger.info(`Manipulation detection sensitivity decreased to ${this.sensitivity.toFixed(2)}`);
  }

  /**
   * Reset sensitivity to default
   */
  resetSensitivity(): void {
    this.sensitivity = 1.0;
  }
}
