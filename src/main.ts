import { PocketPuppeteer } from "./browser/puppeteer-controller";
import { LearningService } from "./learning-service";
import dotenv from "dotenv";

dotenv.config();

// Configuration
const CONFIG = {
  symbol: "EURUSD", // TradingView symbol
  pocketSymbol: "EURUSD_otc", // Pocket Option symbol
  baseAmount: 1,
  martingaleMultiplier: 2.2,
  maxSteps: 4,
  targetProfit: 10,
  stopLoss: 20,
  intervalMs: 5000, // Check every 5s (API rate limit friendly)
  expirationMs: 300000, // 5 minutes
  bufferMs: 10000, // 10s buffer for execution
};

class PocketBot {
  private browser: PocketPuppeteer;
  private learner: LearningService;
  private currentStep = 0;
  private totalPnL = 0;
  private balanceBeforeTrade: number | null = null;

  constructor() {
    this.browser = new PocketPuppeteer();
    this.learner = new LearningService();
  }

  async start() {
    await this.browser.launch(false);

    console.log("🤖 Bot Started. Waiting for Login...");
    await new Promise((r) => setTimeout(r, 10000));

    const balance = await this.browser.getBalance();
    console.log(`💰 Initial Balance: ${balance}`);
    console.log(
      `⚠️  IMPORTANT: Please manually set Contract Expiration to M5 (00:05:00) on the UI now.`,
    );
    console.log(`⚠️  Bot will analyze 1m candles for 5m expiration trades.`);

    const stats = this.learner.getStats();
    console.log(
      `🧠 Learning Stats: ${stats.totalTrades} trades, Win Rate: ${stats.globalWinRate}`,
    );

    this.loop();
  }

  async loop() {
    while (true) {
      try {
        // 1. Check Limits
        if (this.totalPnL >= CONFIG.targetProfit) {
          console.log("✅ Target Profit. Stop.");
          break;
        }
        if (this.totalPnL <= -CONFIG.stopLoss) {
          console.log("❌ Stop Loss. Stop.");
          break;
        }

        // 2. Get Signal from AI Link (TradingView)
        const signalData = await this.getSignal();
        const action = signalData?.summary?.action; // STRONG_BUY, SELL, etc.

        if (action && (action.includes("BUY") || action.includes("SELL"))) {
          const direction = action.includes("BUY") ? "CALL" : "PUT";

          // 3. Consult Learning Service
          const wisdom = this.learner.shouldTrade(CONFIG.symbol, action);

          if (wisdom.allowed) {
            console.log(
              `🚀 Signal: ${action} | Brain: ${wisdom.reason} -> EXECUTING`,
            );

            // Capture balance BEFORE the trade for result verification
            const rawBalance = await this.browser.getBalance();
            this.balanceBeforeTrade = rawBalance
              ? parseFloat(String(rawBalance).replace(/[^0-9.]/g, ""))
              : null;

            await this.executeTrade(direction);

            const waitTime = CONFIG.expirationMs + CONFIG.bufferMs;
            console.log(`⏳ Trade active... Waiting ${waitTime / 1000}s`);
            await new Promise((r) => setTimeout(r, waitTime));

            // 4. Check REAL result & Learn
            const result = await this.checkResult();
            this.handleResult(result, direction, action); // Pass context for learning
          } else {
            console.log(
              `✋ Signal: ${action} | Brain: REJECTED (${wisdom.reason})`,
            );
          }
        } else {
          process.stdout.write("."); // Heartbeat
        }

        await new Promise((r) => setTimeout(r, CONFIG.intervalMs));
      } catch (e) {
        console.error("Loop Error:", e.message);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  async getSignal() {
    try {
      // Talk to AI Link Server (Localhost) - Request 1m interval
      const res = await fetch(
        `http://localhost:3000/api/signal?symbol=${CONFIG.symbol}&interval=1`,
      );
      if (res.ok) return await res.json();
    } catch (e) {
      // console.error('Signal fetch failed (AI Link offline?)');
    }
    return null;
  }

  async executeTrade(direction: "CALL" | "PUT") {
    const amount =
      this.currentStep === 0
        ? CONFIG.baseAmount
        : CONFIG.baseAmount *
        Math.pow(CONFIG.martingaleMultiplier, this.currentStep);

    console.log(
      `⚡ ${direction} | $${amount.toFixed(2)} | Step ${this.currentStep}`,
    );
    await this.browser.setAmount(amount);
    if (direction === "CALL") await this.browser.clickHigher();
    else await this.browser.clickLower();
  }

  async checkResult(): Promise<"WIN" | "LOSS"> {
    // Use real DOM scraping + balance comparison instead of random
    return await this.browser.getLastTradeResult(this.balanceBeforeTrade);
  }

  handleResult(result: "WIN" | "LOSS", direction: string, signalName: string) {
    console.log(`📝 Result: ${result}`);

    // LEARN: Record what happened
    this.learner.recordTrade(CONFIG.symbol, signalName, result);

    if (result === "WIN") {
      this.totalPnL += this.currentAmount() * 0.92;
      this.currentStep = 0;
    } else {
      this.totalPnL -= this.currentAmount();
      this.currentStep++;
      if (this.currentStep > CONFIG.maxSteps) {
        console.log("⚠️ Max Martingale Steps. Reset.");
        this.currentStep = 0;
      }
    }
    console.log(`📊 Session PnL: $${this.totalPnL.toFixed(2)}`);
  }

  currentAmount() {
    return this.currentStep === 0
      ? CONFIG.baseAmount
      : CONFIG.baseAmount *
      Math.pow(CONFIG.martingaleMultiplier, this.currentStep);
  }
}

new PocketBot().start();
