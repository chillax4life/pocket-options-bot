/**
 * dry-run.ts
 * 
 * Runs a set number of simulated trades to generate performance data
 * for the IntegratorAgent dashboard. Does not launch a browser or
 * place real trades.
 */
import { LearningService } from './src/learning-service';

// Configuration
const CONFIG = {
    symbol: 'EURUSD',
    totalTradesToSimulate: 20,
};

class DryRunSimulator {
    private learner: LearningService;

    constructor() {
        this.learner = new LearningService();
    }

    async start() {
        console.log('🤖 Starting Dry Run Simulation...');
        
        const initialStats = this.learner.getStats();
        console.log(`🧠 Initial Learning Stats: ${initialStats.totalTrades} trades, Win Rate: ${initialStats.globalWinRate}`);

        for (let i = 0; i < CONFIG.totalTradesToSimulate; i++) {
            // 1. Simulate a signal
            const signals = ['STRONG_BUY', 'BUY', 'SELL', 'STRONG_SELL'];
            const randomSignal = signals[Math.floor(Math.random() * signals.length)];

            // 2. Simulate a result (55% win rate)
            const randomResult = Math.random() > 0.45 ? 'WIN' : 'LOSS';

            // 3. Record the trade
            this.learner.recordTrade(CONFIG.symbol, randomSignal, randomResult);
            
            process.stdout.write(`Trade #${i + 1}: ${randomSignal} -> ${randomResult} ... Done\n`);
        }

        const finalStats = this.learner.getStats();
        console.log('\n✅ Simulation Complete!');
        console.log(`🧠 Final Learning Stats: ${finalStats.totalTrades} trades, Win Rate: ${finalStats.globalWinRate}`);
        console.log(`\n📊 The learning_data.json file has been updated. The IntegratorAgent dashboard is now live.`);
    }
}

new DryRunSimulator().start();
