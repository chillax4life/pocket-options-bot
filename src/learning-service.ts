import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'learning_data.json');

interface TradeRecord {
    timestamp: string;
    symbol: string;
    signal: string; // STRONG_BUY, BUY, etc.
    hour: number;   // 0-23
    result: 'WIN' | 'LOSS';
}

export class LearningService {
    private history: TradeRecord[] = [];

    constructor() {
        this.load();
    }

    private load() {
        try {
            if (fs.existsSync(DATA_FILE)) {
                this.history = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
            }
        } catch (e) {
            console.error('Failed to load learning data:', e);
        }
    }

    private save() {
        try {
            fs.writeFileSync(DATA_FILE, JSON.stringify(this.history, null, 2));
        } catch (e) {
            console.error('Failed to save learning data:', e);
        }
    }

    recordTrade(symbol: string, signal: string, result: 'WIN' | 'LOSS') {
        this.history.push({
            timestamp: new Date().toISOString(),
            hour: new Date().getHours(),
            symbol,
            signal,
            result
        });
        this.save();
        console.log(`🧠 [Learning] Recorded ${result} for ${signal} on ${symbol}`);
    }

    /**
     * Checks if we should take a trade based on past performance.
     * Returns true if win rate is acceptable (> 45%) or if insufficient data.
     */
    shouldTrade(symbol: string, signal: string): { allowed: boolean; winRate: number; reason: string } {
        // 1. Filter history for similar trades
        const relevant = this.history.filter(t => t.symbol === symbol && t.signal === signal);
        
        // 2. If not enough data, allow it (Explore phase)
        if (relevant.length < 5) {
            return { allowed: true, winRate: 0, reason: 'Not enough data (Exploration)' };
        }

        // 3. Calculate Win Rate
        const wins = relevant.filter(t => t.result === 'WIN').length;
        const winRate = (wins / relevant.length) * 100;

        // 4. Decision
        if (winRate < 45) {
            return { allowed: false, winRate, reason: `Win rate too low (${winRate.toFixed(1)}%)` };
        }

        return { allowed: true, winRate, reason: `Win rate acceptable (${winRate.toFixed(1)}%)` };
    }

    getStats() {
        const total = this.history.length;
        const wins = this.history.filter(t => t.result === 'WIN').length;
        return {
            totalTrades: total,
            globalWinRate: total > 0 ? ((wins / total) * 100).toFixed(1) + '%' : '0%'
        };
    }
}
