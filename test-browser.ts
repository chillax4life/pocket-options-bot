import { PocketPuppeteer } from './src/browser/puppeteer-controller';

async function main() {
    const bot = new PocketPuppeteer();
    await bot.launch(true); // Headless for now
    
    console.log('Waiting for page load...');
    await new Promise(r => setTimeout(r, 5000));

    const balance = await bot.getBalance();
    console.log('Current Balance:', balance || 'Not logged in / Element not found');

    await bot.screenshot('pocket-options-test.png');
    await bot.close();
}

main();
