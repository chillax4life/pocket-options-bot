import puppeteer, { Browser, Page } from "puppeteer";
import path from "path";
import fs from "fs";

export class PocketPuppeteer {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private userDataDir: string;

  // PocketOption Selectors (These change, so we keep them central)
  private selectors = {
    higherBtn: ".btn-call",
    lowerBtn: ".btn-put",
    amountInput: 'input[name="amount"]',
    payout: ".profit-percent",
    demoToggle: ".demo-real-switch",
    // Login selectors
    emailInput: 'input[name="email"]',
    passwordInput: 'input[name="password"]',
    loginBtn: "button.btn-login", // Or similar
  };

  constructor() {
    // Persist session in .browser-data folder
    this.userDataDir = path.join(process.cwd(), ".browser-data");
    if (!fs.existsSync(this.userDataDir)) {
      fs.mkdirSync(this.userDataDir);
    }
  }

  async launch(headless = false) {
    console.log("🚀 Launching Pocket Browser...");
    this.browser = await puppeteer.launch({
      headless: headless,
      defaultViewport: null, // Full width
      userDataDir: this.userDataDir,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--start-maximized",
        // Anti-detection flags
        "--disable-blink-features=AutomationControlled",
      ],
    });

    this.page = await this.browser.newPage();

    // Stealth: Mask WebDriver
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    // Go to Login Page directly first
    await this.page.goto("https://pocketoption.com/en/login/", {
      waitUntil: "networkidle2",
    });

    console.log("✅ Browser ready.");
  }

  async login(email: string, password: string) {
    if (!this.page) return;

    console.log("🔐 Attempting Login...");
    try {
      // Check if already logged in (look for balance or logout button)
      const balance = await this.getBalance();
      if (balance) {
        console.log("✅ Already logged in.");
        return;
      }

      // Fill Credentials
      await this.page.waitForSelector(this.selectors.emailInput, {
        timeout: 5000,
      });
      await this.page.type(this.selectors.emailInput, email, { delay: 50 });
      await this.page.type(this.selectors.passwordInput, password, {
        delay: 50,
      });

      // Click Login
      // Try finding button by text if class fails
      const loginBtn =
        (await this.page.$('button[type="submit"]')) ||
        (await this.page.$("button.btn-login"));

      if (loginBtn) {
        await loginBtn.click();
        await this.page.waitForNavigation({ waitUntil: "networkidle2" });
        console.log("✅ Login submitted. Checking status...");

        // Wait for dashboard redirect
        await new Promise((r) => setTimeout(r, 5000));

        const newBalance = await this.getBalance();
        if (newBalance) {
          console.log(`🎉 Login Success! Balance: ${newBalance}`);
        } else {
          console.log(
            "⚠️ Login might have failed or CAPTCHA triggered. Check screenshot.",
          );
        }
      } else {
        console.error("❌ Login button not found");
      }
    } catch (e: unknown) {
      console.error("Login flow error:", e instanceof Error ? e.message : String(e));
    }
  }

  async getBalance() {
    if (!this.page) return null;
    try {
      // Try to find balance element
      const balance = await this.page.evaluate(() => {
        const el = document.querySelector(".balance-value"); // Selector needs verify
        return el ? el.textContent : null;
      });
      return balance;
    } catch (e) {
      console.error("Error reading balance:", e);
      return null;
    }
  }

  async setAmount(amount: number) {
    if (!this.page) return;
    // Logic to type amount
    console.log(`Setting trade amount to $${amount}`);
  }

  async clickHigher() {
    if (!this.page) return;
    console.log("🟢 CLICKING HIGHER (CALL)");
    try {
      await this.page.click(".btn-call"); // Generic selector, likely needs update
    } catch (e) {
      console.error("Failed to click Higher:", e);
    }
  }

  async clickLower() {
    if (!this.page) return;
    console.log("🔴 CLICKING LOWER (PUT)");
    try {
      await this.page.click(".btn-put");
    } catch (e) {
      console.error("Failed to click Lower:", e);
    }
  }

  async screenshot(filename = "state.png") {
    if (this.page) {
      await this.page.screenshot({ path: filename });
      console.log(`📸 Screenshot saved: ${filename}`);
    }
  }

  /**
   * Get the underlying Puppeteer page for advanced operations
   */
  getPage() {
    return this.page;
  }

  /**
   * Check the result of the most recent trade by inspecting the DOM.
   * Looks for win/loss indicators in the deals/trades history panel.
   * Falls back to balance comparison if DOM scraping fails.
   *
   * @param balanceBefore - Balance captured before the trade was placed
   * @returns "WIN" | "LOSS"
   */
  async getLastTradeResult(balanceBefore: number | null): Promise<"WIN" | "LOSS"> {
    if (!this.page) {
      console.error("❌ No page available for result check");
      return "LOSS";
    }

    try {
      // Strategy 1: Check the deals/trades history panel for the last closed trade
      const domResult = await this.page.evaluate(() => {
        // Pocket Options shows completed trades with profit/loss values
        // Common selectors for the deals panel (may need updates if PO changes DOM)
        const resultSelectors = [
          ".deals-list__item:first-child .deals-list__item-profit",
          ".closed-item:first-child .profit",
          ".deals__item:first-child .deals__profit",
          "[class*='deal']:first-child [class*='profit']",
          ".history-list .item:first-child .profit",
        ];

        for (const selector of resultSelectors) {
          const el = document.querySelector(selector);
          if (el && el.textContent) {
            const text = el.textContent.trim();
            // Positive amount = WIN, negative or zero = LOSS
            const amount = parseFloat(text.replace(/[^0-9.\-]/g, ""));
            if (!isNaN(amount)) {
              return amount > 0 ? "WIN" : "LOSS";
            }
          }
        }

        // Also check for explicit win/loss class indicators
        const winIndicators = [
          ".deals-list__item:first-child.win",
          ".deals-list__item:first-child .deal--win",
          "[class*='deal']:first-child[class*='win']",
          "[class*='deal']:first-child [class*='success']",
        ];
        for (const selector of winIndicators) {
          if (document.querySelector(selector)) return "WIN";
        }

        const lossIndicators = [
          ".deals-list__item:first-child.loss",
          ".deals-list__item:first-child .deal--loss",
          "[class*='deal']:first-child[class*='loss']",
          "[class*='deal']:first-child [class*='fail']",
        ];
        for (const selector of lossIndicators) {
          if (document.querySelector(selector)) return "LOSS";
        }

        return null; // Could not determine from DOM
      });

      if (domResult) {
        console.log(`📊 DOM Result Check: ${domResult}`);
        return domResult;
      }

      // Strategy 2: Compare balance before/after
      if (balanceBefore !== null) {
        const currentBalanceStr = await this.getBalance();
        const currentBalance = currentBalanceStr
          ? parseFloat(String(currentBalanceStr).replace(/[^0-9.]/g, ""))
          : null;

        if (currentBalance !== null && !isNaN(currentBalance)) {
          const diff = currentBalance - balanceBefore;
          const result = diff > 0 ? "WIN" : "LOSS";
          console.log(
            `📊 Balance Comparison: Before=$${balanceBefore.toFixed(2)}, After=$${currentBalance.toFixed(2)}, Diff=$${diff.toFixed(2)} → ${result}`,
          );
          return result;
        }
      }

      // Strategy 3: If all else fails, log a warning and default to LOSS (conservative)
      console.warn(
        "⚠️ Could not determine trade result from DOM or balance. Defaulting to LOSS (conservative).",
      );
      return "LOSS";
    } catch (e: any) {
      console.error("❌ Error checking trade result:", e.message);
      return "LOSS";
    }
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}
