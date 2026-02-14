# Pocket Options Trading Bot - Code Analysis

## Overview
Analysis of existing code from zip_inspect_skills to build a binary options trading bot for Pocket Options with AI-powered learning and Martingale strategy.

## Requirements Summary
- **Platform**: Pocket Options website (browser automation required)
- **Contract Type**: Binary options with 5-minute expiration
- **Timeframe**: 1-minute charts
- **Trading Mode**: One trade at a time (unless Martingale active)
- **Learning**: Recursive AI that learns from mistakes, adjusts indicators
- **Risk Management**: Martingale strategy (1 → 2 → 4 → 8 simultaneous trades max)
- **Protection**: Price manipulation detection to avoid honeypots

---

## Useful Components from Existing Code

### 1. **base-trader-1.1.1** ⭐⭐⭐⭐⭐
**Highly Relevant - Trading Logic Foundation**

#### Risk Management (references/risk-management.md)
- **Position Sizing**: 2% rule, Kelly Criterion for optimal bet sizing
- **Stop Loss Strategies**: Fixed percentage, support-based, trailing stops
- **Portfolio Allocation**: Conservative/Moderate/Aggressive models
- **Daily/Weekly Limits**: 20% daily loss = 24hr cooldown (CRITICAL for our bot)
- **Emotional Management**: FOMO detection, revenge trading prevention
- **Emergency Procedures**: Market crash handling, rug pull response

**Apply to Our Bot:**
- Use Kelly Criterion to calculate optimal Martingale sizing
- Implement 20% daily loss circuit breaker
- Add FOMO/revenge trading detection in learning system

#### Trading Strategies (references/strategies.md)
- **Momentum Trading**: Price above MA, volume increasing, higher lows
- **Scaled Exit Strategy**: 25% at +30%, 25% at +50%, 25% at +100%, 25% moonbag
- **Entry/Exit Rules**: Never chase pumps, cut losers fast, let winners run

**Apply to Our Bot:**
- Use momentum indicators (MA, volume, higher lows pattern)
- For binary options: adapt scaled exit to multiple simultaneous positions
- Implement "don't chase" logic in price manipulation detector

### 2. **solana-funding-arb-2.1.0** ⭐⭐⭐⭐⭐
**Highly Relevant - Architecture Pattern**

#### Arbitrage Engine (scripts/src/core/arbitrage.ts)
- **Scanning Loop**: Continuous monitoring with configurable intervals
- **Multi-Source Comparison**: Compare quotes across multiple DEXes
- **Opportunity Detection**: Find best buy/sell spread
- **Execution Engine**: Atomic transaction execution
- **Error Handling**: Graceful failures with retry logic

**Apply to Our Bot:**
```typescript
class TradingEngine {
  async start() {
    while (this.isRunning) {
      await this.analyzeMarket();
      await this.executeIfProfitable();
      await this.sleep(scanInterval);
    }
  }
}
```

#### P&L Tracker (scripts/src/core/pnl-tracker.ts)
- **Trade Recording**: Timestamp, pair, profit, success/failure
- **Period Statistics**: Daily, weekly, monthly, all-time
- **Win Rate Calculation**: Successful trades / total trades
- **Best/Worst Tracking**: Performance extremes
- **Persistent Storage**: JSON file storage for history

**Apply to Our Bot:**
```typescript
class PnLTracker {
  recordTrade(result: TradeResult): void
  getStats(): { daily, weekly, monthly, allTime }
  getWinRate(): number // Feed into learning system
}
```

### 3. **agent-browser-clawdbot-0.1.0** ⭐⭐⭐⭐
**Critical - Browser Automation**

#### Key Features
- **Headless Browser Control**: Chromium automation via CLI
- **Accessibility Tree Snapshots**: Ref-based element selection (deterministic)
- **Session Isolation**: Multiple browser profiles
- **State Persistence**: Save/load cookies and auth
- **Network Control**: Route blocking, request mocking

**Apply to Our Bot:**
```bash
# Login to Pocket Options once, save state
agent-browser open https://pocketoption.com
# ... manual login ...
agent-browser state save pocket-auth.json

# Reuse auth in bot
agent-browser state load pocket-auth.json
agent-browser snapshot -i --json  # Get chart/trade buttons
agent-browser click @trade-button
```

### 4. **browser-use-1.0.0** ⭐⭐⭐
**Alternative - Cloud Browser Automation**

#### Features
- **Cloud Browsers**: API-based browser instances
- **Profile Persistence**: Keep logins across sessions
- **Task Subagent**: AI-powered autonomous tasks
- **Pricing**: $0.03-0.06/hour

**Apply to Our Bot:**
- Backup option if local browser is unstable
- Use for parallel testing (multiple timeframes/assets)
- Profile persistence for Pocket Options login

---

## Architecture Design

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                   Pocket Options Bot                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────┐      ┌──────────────────┐          │
│  │ Browser Engine │◄─────┤ Chart Analyzer   │          │
│  │ (agent-browser)│      │ (indicators)     │          │
│  └────────┬───────┘      └──────────────────┘          │
│           │                                               │
│  ┌────────▼──────────────────────────────────────────┐  │
│  │         AI Learning System                        │  │
│  │  - Weighted indicators                            │  │
│  │  - Pattern recognition                            │  │
│  │  - Price manipulation detection                   │  │
│  │  - Win/loss analysis                              │  │
│  └────────┬──────────────────────────────────────────┘  │
│           │                                               │
│  ┌────────▼───────┐      ┌──────────────────┐          │
│  │ Trade Executor │◄─────┤ Martingale Engine│          │
│  │                │      │ (1→2→4→8)        │          │
│  └────────┬───────┘      └──────────────────┘          │
│           │                                               │
│  ┌────────▼───────┐      ┌──────────────────┐          │
│  │ P&L Tracker    │◄─────┤ Risk Manager     │          │
│  │                │      │ (circuit breaker)│          │
│  └────────────────┘      └──────────────────┘          │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Chart Analyzer → Read 1-min candles from Pocket Options
                  ↓
2. Indicators     → RSI, MACD, Bollinger, Volume, Custom patterns
                  ↓
3. AI Learning    → Apply weighted scores, detect manipulation
                  ↓
4. Decision       → BUY/SELL/WAIT signal with confidence %
                  ↓
5. Martingale     → If in recovery mode: calculate position size
                  ↓
6. Execute        → Place trade(s) via browser automation
                  ↓
7. Monitor        → Wait for 5-min expiration
                  ↓
8. Record Result  → Update P&L, feed back to learning system
                  ↓
9. Adjust Weights → Increase weights of successful indicators
```

---

## Key Algorithms

### 1. Weighted Indicator System

```typescript
interface Indicator {
  name: string;
  weight: number;          // 0.0 to 1.0
  calculate(): Signal;     // BUY = 1, SELL = -1, NEUTRAL = 0
  adjustWeight(result: TradeResult): void;
}

class IndicatorManager {
  indicators: Indicator[] = [
    { name: 'RSI', weight: 0.8 },
    { name: 'MACD', weight: 0.7 },
    { name: 'BollingerBands', weight: 0.6 },
    { name: 'VolumeProfile', weight: 0.5 },
  ];

  getSignal(): { direction: 'BUY' | 'SELL' | 'WAIT', confidence: number } {
    let totalScore = 0;
    let totalWeight = 0;

    for (const ind of this.indicators) {
      const signal = ind.calculate();
      totalScore += signal * ind.weight;
      totalWeight += ind.weight;
    }

    const normalizedScore = totalScore / totalWeight;
    
    if (Math.abs(normalizedScore) < 0.3) return { direction: 'WAIT', confidence: 0 };
    return {
      direction: normalizedScore > 0 ? 'BUY' : 'SELL',
      confidence: Math.abs(normalizedScore)
    };
  }

  adjustWeights(tradeResult: TradeResult) {
    for (const ind of this.indicators) {
      // If indicator predicted correctly, increase weight
      // If wrong, decrease weight
      ind.adjustWeight(tradeResult);
    }
  }
}
```

### 2. Martingale Strategy

```typescript
class MartingaleManager {
  private currentTier = 0; // 0=normal, 1=2x, 2=4x, 3=8x
  private baseAmount = 10; // $10 base trade
  private maxTier = 3;     // Stop at 8x (tier 3)

  onTradeLoss() {
    if (this.currentTier < this.maxTier) {
      this.currentTier++;
    }
  }

  onTradeWin() {
    this.currentTier = 0; // Reset to normal
  }

  getTradeCount(): number {
    return Math.pow(2, this.currentTier); // 1, 2, 4, 8
  }

  getTradeAmount(): number {
    return this.baseAmount; // Each trade is still $10
  }

  getTotalRisk(): number {
    return this.getTradeCount() * this.baseAmount; // Total $ at risk
  }

  async executeSimultaneous(signal: Signal) {
    const count = this.getTradeCount();
    const promises = [];
    
    for (let i = 0; i < count; i++) {
      promises.push(this.placeTrade(signal));
    }
    
    // Execute all trades at once
    await Promise.all(promises);
  }
}
```

### 3. Price Manipulation Detection

```typescript
class ManipulationDetector {
  detectHoneypot(chartData: Candle[]): boolean {
    // 1. Sudden volume spike without price movement
    const volumeSpike = this.hasVolumeSpike(chartData);
    const priceStagnant = !this.hasPriceMovement(chartData);
    if (volumeSpike && priceStagnant) return true;

    // 2. Repeated wicks in one direction (stop hunting)
    const wickPattern = this.detectWickPattern(chartData);
    if (wickPattern === 'MANIPULATION') return true;

    // 3. Unusually tight spread with low volume
    const tightSpread = this.hasAbnormalSpread(chartData);
    if (tightSpread) return true;

    return false;
  }

  hasVolumeSpike(candles: Candle[]): boolean {
    const avgVolume = candles.slice(-20).reduce((a,c) => a + c.volume, 0) / 20;
    const lastVolume = candles[candles.length - 1].volume;
    return lastVolume > avgVolume * 3; // 3x average
  }

  detectWickPattern(candles: Candle[]): string {
    // Look for 3+ consecutive candles with large upper wicks
    let upperWicks = 0;
    let lowerWicks = 0;

    for (const c of candles.slice(-5)) {
      const wickRatio = (c.high - c.close) / (c.high - c.low);
      if (wickRatio > 0.7) upperWicks++;
      if (wickRatio < 0.3) lowerWicks++;
    }

    if (upperWicks >= 3 || lowerWicks >= 3) return 'MANIPULATION';
    return 'NORMAL';
  }
}
```

### 4. Recursive Learning

```typescript
class LearningEngine {
  private memory: TradeMemory[] = [];
  private indicatorManager: IndicatorManager;

  learn(trade: TradeResult) {
    // 1. Store trade in memory
    this.memory.push({
      timestamp: Date.now(),
      signal: trade.signal,
      indicators: trade.indicatorSnapshot,
      result: trade.success,
      profitLoss: trade.pnl
    });

    // 2. Adjust indicator weights based on outcome
    this.indicatorManager.adjustWeights(trade);

    // 3. Pattern recognition - find similar past situations
    const similarTrades = this.findSimilarPatterns(trade);
    const successRate = this.calculateSuccessRate(similarTrades);

    // 4. Update strategy confidence
    if (successRate < 0.4) {
      // This pattern has low success rate, reduce confidence
      this.reduceConfidenceForPattern(trade.pattern);
    }

    // 5. Detect if we're in a losing streak
    const recentTrades = this.memory.slice(-10);
    const lossStreak = this.countConsecutiveLosses(recentTrades);
    
    if (lossStreak >= 3) {
      // Reduce all indicator weights temporarily
      this.indicatorManager.reduceAllWeights(0.8);
      
      // Increase manipulation detection sensitivity
      this.manipulationDetector.increaseSensitivity();
    }
  }

  findSimilarPatterns(trade: TradeResult): TradeMemory[] {
    return this.memory.filter(m => {
      // Compare indicator values (within 10% tolerance)
      const rsiSimilar = Math.abs(m.indicators.rsi - trade.indicatorSnapshot.rsi) < 10;
      const macdSimilar = Math.abs(m.indicators.macd - trade.indicatorSnapshot.macd) < 0.1;
      // ... other indicators
      
      return rsiSimilar && macdSimilar;
    });
  }
}
```

---

## Technical Indicators to Implement

### Essential Indicators
1. **RSI (Relative Strength Index)**: Overbought/oversold detection
2. **MACD (Moving Average Convergence Divergence)**: Trend momentum
3. **Bollinger Bands**: Volatility and mean reversion
4. **Volume Profile**: Order flow analysis
5. **EMA (Exponential Moving Average)**: Trend direction

### Advanced Indicators
6. **Support/Resistance Levels**: Key price zones
7. **Fibonacci Retracements**: Reversal points
8. **Stochastic Oscillator**: Momentum extremes
9. **ATR (Average True Range)**: Volatility measurement
10. **Price Action Patterns**: Candlestick patterns (hammer, doji, engulfing)

---

## Technology Stack

```json
{
  "language": "TypeScript/Node.js",
  "browser": "agent-browser (Chromium)",
  "ai": "Pattern recognition + weighted scoring",
  "storage": "JSON files for trades/config",
  "indicators": "technicalindicators npm package",
  "charting": "Parse from Pocket Options DOM",
  "logging": "Winston or similar"
}
```

---

## Next Steps

1. ✅ Analyze existing code
2. ⏳ Set up project structure
3. ⏳ Implement browser automation for Pocket Options
4. ⏳ Build chart data extractor
5. ⏳ Implement technical indicators
6. ⏳ Create weighted indicator system
7. ⏳ Build Martingale engine
8. ⏳ Add price manipulation detector
9. ⏳ Implement learning/adjustment system
10. ⏳ Add P&L tracker and risk manager
11. ⏳ Testing and optimization
12. ⏳ Deploy and monitor

---

## Risk Warnings

⚠️ **CRITICAL SAFETY MEASURES**

1. **Daily Loss Limit**: Hard stop at -20% (from base-trader pattern)
2. **Martingale Cap**: Never exceed 8 simultaneous trades
3. **Emergency Stop**: Manual kill switch for immediate shutdown
4. **Paper Trading**: Test extensively before real money
5. **Position Sizing**: Never risk more than you can afford to lose

**Binary options are high-risk instruments. This bot is experimental.**
