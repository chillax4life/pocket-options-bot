import { RSI } from 'technicalindicators';
import { BaseIndicator } from './base-indicator';
import { Candle, Signal } from '../types';

/**
 * RSI (Relative Strength Index) Indicator
 * Overbought/oversold detection
 */
export class RSIIndicator extends BaseIndicator {
  private period: number;

  constructor(period: number = 14, weight: number = 0.8) {
    super('RSI', weight);
    this.period = period;
  }

  calculate(candles: Candle[]): Signal {
    if (candles.length < this.period + 1) {
      return this.createSignal(0, 0);
    }

    const closes = candles.map(c => c.close);
    const rsiValues = RSI.calculate({ period: this.period, values: closes });
    
    if (rsiValues.length === 0) {
      return this.createSignal(0, 0);
    }

    const currentRSI = rsiValues[rsiValues.length - 1];

    // RSI interpretation:
    // < 30: Oversold → BUY signal
    // > 70: Overbought → SELL signal
    // 30-70: Neutral
    let signalValue: number;
    let confidence: number;

    if (currentRSI < 30) {
      // Strong buy signal (oversold)
      signalValue = this.normalizeSignal(currentRSI, 0, 30);
      confidence = (30 - currentRSI) / 30; // More oversold = higher confidence
    } else if (currentRSI > 70) {
      // Strong sell signal (overbought)
      signalValue = this.normalizeSignal(currentRSI, 70, 100);
      confidence = (currentRSI - 70) / 30; // More overbought = higher confidence
    } else {
      // Neutral zone
      signalValue = this.normalizeSignal(currentRSI, 30, 70);
      confidence = 0.3; // Low confidence in neutral zone
    }

    return this.createSignal(signalValue, confidence);
  }
}
