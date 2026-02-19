import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import fs from 'fs';

export class PocketPuppeteer {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private userDataDir: string;

    // PocketOption Selectors (These change, so we keep them central)
    private selectors = {
        higherBtn: '.btn-call',
        lowerBtn: '.btn-put',
        amountInput: 'input[name="amount"]',
        payout: '.profit-percent',
        demoToggle: '.demo-real-switch',
        // Login selectors
        emailInput: 'input[name="email"]',
        passwordInput: 'input[name="password"]',
        loginBtn: 'button.btn-login' // Or similar
    };

    constructor() {
        // Persist session in .browser-data folder
        this.userDataDir = path.join(process.cwd(), '.browser-data');
        if (!fs.existsSync(this.userDataDir)) {
            fs.mkdirSync(this.userDataDir);
        }
    }

    async launch(headless = false) {
        console.log('🚀 Launching Pocket Browser...');
        this.browser = await puppeteer.launch({
            headless: headless,
            defaultViewport: null, // Full width
            userDataDir: this.userDataDir,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--start-maximized',
                // Anti-detection flags
                '--disable-blink-features=AutomationControlled' 
            ]
        });

        this.page = await this.browser.newPage();
        
        // Stealth: Mask WebDriver
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        // Go to Login Page directly first
        await this.page.goto('https://pocketoption.com/en/login/', {
            waitUntil: 'networkidle2'
        });

        console.log('✅ Browser ready.');
    }

    async login(email, password) {
        if (!this.page) return;
        
        console.log('🔐 Attempting Login...');
        try {
            // Check if already logged in (look for balance or logout button)
            const balance = await this.getBalance();
            if (balance) {
                console.log('✅ Already logged in.');
                return;
            }

            // Fill Credentials
            await this.page.waitForSelector(this.selectors.emailInput, { timeout: 5000 });
            await this.page.type(this.selectors.emailInput, email, { delay: 50 });
            await this.page.type(this.selectors.passwordInput, password, { delay: 50 });
            
            // Click Login
            // Try finding button by text if class fails
            const loginBtn = await this.page.$('button[type="submit"]') || 
                             await this.page.$('button.btn-login');
            
            if (loginBtn) {
                await loginBtn.click();
                await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
                console.log('✅ Login submitted. Checking status...');
                
                // Wait for dashboard redirect
                await new Promise(r => setTimeout(r, 5000));
                
                const newBalance = await this.getBalance();
                if (newBalance) {
                    console.log(`🎉 Login Success! Balance: ${newBalance}`);
                } else {
                    console.log('⚠️ Login might have failed or CAPTCHA triggered. Check screenshot.');
                }
            } else {
                console.error('❌ Login button not found');
            }

        } catch (e) {
            console.error('Login flow error:', e.message);
        }
    }

    async getBalance() {
        if (!this.page) return null;
        try {
            // Try to find balance element
            const balance = await this.page.evaluate(() => {
                const el = document.querySelector('.balance-value'); // Selector needs verify
                return el ? el.textContent : null;
            });
            return balance;
        } catch (e) {
            console.error('Error reading balance:', e);
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
        console.log('🟢 CLICKING HIGHER (CALL)');
        try {
            await this.page.click('.btn-call'); // Generic selector, likely needs update
        } catch (e) {
            console.error('Failed to click Higher:', e);
        }
    }

    async clickLower() {
        if (!this.page) return;
        console.log('🔴 CLICKING LOWER (PUT)');
        try {
            await this.page.click('.btn-put');
        } catch (e) {
            console.error('Failed to click Lower:', e);
        }
    }

    async screenshot(filename = 'state.png') {
        if (this.page) {
            await this.page.screenshot({ path: filename });
            console.log(`📸 Screenshot saved: ${filename}`);
        }
    }

    async close() {
        if (this.browser) await this.browser.close();
    }
}
