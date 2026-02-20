import dotenv from "dotenv";
import { Config } from "./types";

dotenv.config();

export const config: Config = {
  baseTradeAmount: parseFloat(process.env.BASE_TRADE_AMOUNT || "10"),
  maxDailyLossPercent: parseFloat(process.env.MAX_DAILY_LOSS_PERCENT || "20"),
  martingaleMaxTier: parseInt(process.env.MARTINGALE_MAX_TIER || "3"),
  learningRate: parseFloat(process.env.LEARNING_RATE || "0.1"),
  minConfidenceThreshold: parseFloat(
    process.env.MIN_CONFIDENCE_THRESHOLD || "0.6",
  ),
  stopOnLossStreak: parseInt(process.env.STOP_ON_LOSS_STREAK || "3"),
  circuitBreakerEnabled: process.env.CIRCUIT_BREAKER_ENABLED === "true",
  headlessMode: process.env.HEADLESS_MODE !== "false",
};

export const pocketOptions = {
  email: process.env.POCKET_OPTIONS_EMAIL || "",
  password: process.env.POCKET_OPTIONS_PASSWORD || "",
  sessionPath: process.env.BROWSER_SESSION_PATH || "./data/browser-session",
};

export const logging = {
  level: process.env.LOG_LEVEL || "info",
  file: process.env.LOG_FILE || "./data/bot.log",
};
