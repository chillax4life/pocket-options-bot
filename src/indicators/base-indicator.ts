import { Indicator, Candle, Signal } from '../types';
import { config } from '../config';

/**
 * Base Indicator Class
 * All indicators extend this class
 */
export abstract class BaseIndicator implements Indicator {
  name: string;
  weight: number;
  private initialWeight: number;

  constructor(name: string, initialWeight: number = 0.5) {
    this.name = name;
    this.weight = initialWeight;
    this.initialWeight = initialWeight;
  }

  /**
   * Calculate signal from candle data
   * Must be implemented by each indicator
   */
  abstract calculate(candles: Candle[]): Signal;

  /**
   * Adjust weight based on trade success
   */
  adjustWeight(success: boolean): void {
    const learningRate = config.learningRate;

    if (success) {
      // Increase weight for successful predictions
      this.weight = Math.min(this.weight + learningRate, 1.0);
    } else {
      // Decrease weight for failed predictions
      this.weight = Math.max(this.weight - learningRate, 0.1);
    }
  }

  /**
   * Reset weight to initial value
   */
  resetWeight(): void {
    this.weight = this.initialWeight;
  }

  /**
   * Get normalized signal (-1 to 1)
   */
  protected normalizeSignal(value: number, min: number, max: number): number {
    if (max === min) return 0;
    const normalized = ((value - min) / (max - min)) * 2 - 1;
    return Math.max(-1, Math.min(1, normalized));
  }

  /**
   * Convert signal value to Signal object
   */
  protected createSignal(value: number, confidence: number = 1.0): Signal {
    let direction: 'BUY' | 'SELL' | 'NEUTRAL';
    
    if (value > 0.3) {
      direction = 'BUY';
    } else if (value < -0.3) {
      direction = 'SELL';
    } else {
      direction = 'NEUTRAL';
    }

    return {
      direction,
      strength: Math.abs(value),
      confidence,
    };
  }
}
