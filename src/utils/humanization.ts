/**
 * Humanization Module
 * Adds human-like randomness to trading behavior
 */

/**
 * Generate random delay in milliseconds
 */
export function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sleep with random duration
 */
export async function humanSleep(minMs: number, maxMs: number): Promise<void> {
  const delay = randomDelay(minMs, maxMs);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Add slight randomness to trade amount
 * Example: $10 becomes $9.80 - $10.20
 */
export function randomizeAmount(
  baseAmount: number,
  variancePercent: number = 2,
): number {
  const variance = (baseAmount * variancePercent) / 100;
  const randomOffset = (Math.random() - 0.5) * 2 * variance;
  return parseFloat((baseAmount + randomOffset).toFixed(2));
}

/**
 * Randomize confidence threshold
 * Prevents always trading at exact same confidence level
 */
export function randomizeThreshold(
  baseThreshold: number,
  variancePercent: number = 5,
): number {
  const variance = (baseThreshold * variancePercent) / 100;
  const randomOffset = (Math.random() - 0.5) * 2 * variance;
  return Math.max(0.5, Math.min(0.95, baseThreshold + randomOffset));
}

/**
 * Simulate human mouse movement (bezier curve)
 */
export function generateMousePath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  steps: number = 20,
): Array<{ x: number; y: number }> {
  const path: Array<{ x: number; y: number }> = [];

  // Generate random control points for bezier curve
  const cp1x = startX + (endX - startX) * (0.25 + Math.random() * 0.25);
  const cp1y = startY + (endY - startY) * (0.25 + Math.random() * 0.25);
  const cp2x = startX + (endX - startX) * (0.5 + Math.random() * 0.25);
  const cp2y = startY + (endY - startY) * (0.5 + Math.random() * 0.25);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    // Cubic bezier formula
    const x =
      Math.pow(1 - t, 3) * startX +
      3 * Math.pow(1 - t, 2) * t * cp1x +
      3 * (1 - t) * Math.pow(t, 2) * cp2x +
      Math.pow(t, 3) * endX;

    const y =
      Math.pow(1 - t, 3) * startY +
      3 * Math.pow(1 - t, 2) * t * cp1y +
      3 * (1 - t) * Math.pow(t, 2) * cp2y +
      Math.pow(t, 3) * endY;

    path.push({ x: Math.round(x), y: Math.round(y) });
  }

  return path;
}

/**
 * Decide whether to skip a trade opportunity (human hesitation)
 */
export function shouldHesitate(baseChance: number = 0.05): boolean {
  return Math.random() < baseChance;
}

/**
 * Random scan interval variance
 * Prevents predictable timing
 */
export function getRandomScanInterval(
  baseInterval: number,
  varianceMs: number = 5000,
): number {
  const offset = (Math.random() - 0.5) * 2 * varianceMs;
  return Math.floor(baseInterval + offset);
}

/**
 * Simulate reading/analysis time before trade
 */
export function getAnalysisDelay(): number {
  // Between 2-8 seconds
  return randomDelay(2000, 8000);
}

/**
 * Generate typing speed for input fields
 */
export function getTypingDelay(): number {
  // Between 50-150ms per character
  return randomDelay(50, 150);
}

/**
 * Simulate human decision-making with occasional "changes of mind"
 */
export class HumanDecisionMaker {
  private recentDecisions: Array<{ timestamp: number; direction: string }> = [];

  /**
   * Check if we should override a decision (human changes mind)
   */
  shouldOverrideDecision(currentDirection: "BUY" | "SELL"): boolean {
    // 3% chance to "change mind" and skip trade
    if (Math.random() < 0.03) {
      return true;
    }

    // Don't trade same direction 5+ times in a row (human varies)
    const now = Date.now();
    const recentSame = this.recentDecisions
      .filter((d) => now - d.timestamp < 30 * 60 * 1000) // Last 30 min
      .filter((d) => d.direction === currentDirection).length;

    if (recentSame >= 5) {
      return Math.random() < 0.4; // 40% chance to skip
    }

    return false;
  }

  /**
   * Record a decision
   */
  recordDecision(direction: "BUY" | "SELL"): void {
    this.recentDecisions.push({
      timestamp: Date.now(),
      direction,
    });

    // Keep only last 50 decisions
    if (this.recentDecisions.length > 50) {
      this.recentDecisions.shift();
    }
  }

  /**
   * Add random pause between trades (human fatigue)
   */
  async randomPause(): Promise<void> {
    // 10% chance to take a longer break (30-120 seconds)
    if (Math.random() < 0.1) {
      await humanSleep(30000, 120000);
    }
  }
}

/**
 * Browser interaction humanization
 */
export class BrowserHumanizer {
  /**
   * Human-like click with slight offset
   */
  getClickOffset(centerX: number, centerY: number): { x: number; y: number } {
    // Click within 5px of center
    const offsetX = (Math.random() - 0.5) * 10;
    const offsetY = (Math.random() - 0.5) * 10;

    return {
      x: Math.round(centerX + offsetX),
      y: Math.round(centerY + offsetY),
    };
  }

  /**
   * Simulate human scrolling
   */
  async humanScroll(page: any, distance: number): Promise<void> {
    const steps = Math.floor(Math.abs(distance) / 100) + 1;
    const stepSize = distance / steps;

    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel({ deltaY: stepSize });
      await humanSleep(50, 150);
    }
  }

  /**
   * Simulate human typing
   */
  async humanType(text: string): Promise<string[]> {
    const commands: string[] = [];

    for (const char of text) {
      commands.push(`press ${char}`);
      // Random typing speed
      const delay = getTypingDelay();
      if (delay > 100) {
        commands.push(`wait ${delay}`);
      }
    }

    return commands;
  }

  /**
   * Random page inspection (move mouse, hover elements)
   */
  async randomPageInspection(): Promise<void> {
    // Simulate looking around the page
    const inspectionTime = randomDelay(1000, 4000);
    await humanSleep(inspectionTime, inspectionTime + 1000);
  }
}

/**
 * Trading pattern randomization
 */
export class TradingPatternRandomizer {
  private lastTradeTime: number = 0;
  private tradeCount: number = 0;

  /**
   * Get randomized minimum time between trades
   */
  getMinTimeBetweenTrades(): number {
    // Between 30 seconds and 3 minutes
    return randomDelay(30000, 180000);
  }

  /**
   * Check if enough time has passed since last trade
   */
  canTradeYet(): boolean {
    const now = Date.now();
    const minInterval = this.getMinTimeBetweenTrades();
    return now - this.lastTradeTime >= minInterval;
  }

  /**
   * Record trade execution
   */
  recordTrade(): void {
    this.lastTradeTime = Date.now();
    this.tradeCount++;
  }

  /**
   * Occasionally take a longer break (human behavior)
   */
  shouldTakeLongBreak(): boolean {
    // Every 20-30 trades, take 5-15 minute break
    if (this.tradeCount % randomDelay(20, 30) === 0) {
      return true;
    }
    return false;
  }

  /**
   * Get long break duration
   */
  getLongBreakDuration(): number {
    return randomDelay(5 * 60 * 1000, 15 * 60 * 1000);
  }
}
