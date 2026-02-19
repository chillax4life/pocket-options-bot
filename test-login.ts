import { PocketPuppeteer } from './src/browser/puppeteer-controller';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    const email = process.env.POCKET_EMAIL;
    const password = process.env.POCKET_PASSWORD;

    if (!email || !password) {
        console.error('Missing credentials in .env');
        return;
    }

    const bot = new PocketPuppeteer();
    await bot.launch(true); // Headless
    
    await bot.login(email, password);
    
    await bot.screenshot('login-result.png');
    await bot.close();
}

main();
