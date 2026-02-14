# Technical Specification: Binary Options Trading Bot for Pocket Options

## Complexity Assessment
**Level: HARD**

This project involves:
- Web automation with anti-bot detection challenges
- Real-time financial data processing and decision-making
- Machine learning with adaptive indicator weighting
- Risk management for real money trading
- Complex multi-component architecture
- High stakes (financial loss potential)

---

## Technical Context

### Language & Runtime
- **Primary Language**: Python 3.10+
- **Rationale**: Best ecosystem for ML, web automation, and financial analysis

### Core Dependencies

#### Web Automation
- `selenium` (4.x) - Browser automation for Pocket Options interaction
- `webdriver-manager` - Automatic WebDriver management
- `undetected-chromedriver` - Anti-bot detection bypass

#### Technical Analysis
- `pandas` (2.x) - Time series data manipulation
- `numpy` (1.x) - Numerical computations
- `ta-lib` or `pandas-ta` - Technical indicators library

#### Machine Learning
- `scikit-learn` - Indicator weight optimization
- `joblib` - Model persistence

#### Data Storage
- `sqlite3` (built-in) - Trade history and learning data
- `sqlalchemy` - ORM for database operations

#### Utilities
- `python-dotenv` - Environment variable management
- `loguru` - Advanced logging
- `pydantic` - Data validation and settings management
- `schedule` - Task scheduling

---

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────┐
│                    Trading Bot Main                      │
│                    (Orchestrator)                        │
└──────────────┬──────────────────────────────────────────┘
               │
      ┌────────┼────────┬─────────────┬──────────────┐
      │        │        │             │              │
┌─────▼────┐ ┌▼─────┐ ┌▼──────────┐ ┌▼──────────┐  ┌▼────────┐
│ Browser  │ │Market│ │ Strategy  │ │ Learning │  │  Risk   │
│ Manager  │ │Data  │ │ Engine    │ │ Engine   │  │ Manager │
│          │ │Fetch │ │           │ │          │  │         │
└──────────┘ └──────┘ └───────────┘ └──────────┘  └─────────┘
      │         │           │             │              │
      └─────────┴───────────┴─────────────┴──────────────┘
                            │
                     ┌──────▼──────┐
                     │   Database  │
                     │   (SQLite)  │
                     └─────────────┘
```

### Component Responsibilities

1. **Browser Manager** (`src/browser/`)
   - Selenium session management
   - Pocket Options login automation
   - Trade execution (place orders)
   - Session keep-alive
   - Anti-detection measures

2. **Market Data Fetcher** (`src/market/`)
   - Real-time price data extraction from browser
   - Data normalization and validation
   - Historical data for indicator calculation
   - Data buffering (rolling window)

3. **Strategy Engine** (`src/strategy/`)
   - Technical indicator calculation
   - Signal generation based on indicators
   - Weighted voting system
   - Trade decision logic

4. **Learning Engine** (`src/learning/`)
   - Indicator performance tracking
   - Weight adjustment based on outcomes
   - Reinforcement learning for weight optimization
   - Model persistence

5. **Risk Manager** (`src/risk/`)
   - Position sizing
   - Maximum daily loss limits
   - Trade frequency control (one at a time)
   - Account balance tracking

6. **Database** (`src/database/`)
   - Trade history
   - Indicator performance metrics
   - Learning model states
   - Configuration storage

---

## Implementation Approach

### Phase 1: Foundation & Browser Automation
- Project structure setup
- Environment configuration
- Selenium browser automation
- Pocket Options login flow
- Basic trade execution (manual triggers)

### Phase 2: Market Data & Indicators
- Price data extraction from Pocket Options interface
- Technical indicators implementation:
  - **RSI** (Relative Strength Index) - Overbought/oversold
  - **MACD** (Moving Average Convergence Divergence) - Trend/momentum
  - **Bollinger Bands** - Volatility and price levels
  - **EMA** (Exponential Moving Average) - Trend direction
  - **Stochastic Oscillator** - Momentum
  - **ADX** (Average Directional Index) - Trend strength
  - **Volume Analysis** (if available)
- Data buffering for 1-min candles

### Phase 3: Strategy & Signal Generation
- Indicator signal interpretation (buy/sell/neutral)
- Weighted voting system
- Signal aggregation logic
- Trade execution integration
- One-trade-at-a-time enforcement

### Phase 4: Learning System
- Trade outcome tracking
- Indicator performance metrics:
  - Win rate per indicator
  - Average profit/loss contribution
  - Signal accuracy
- Weight adjustment algorithm:
  - Initial equal weights
  - Gradient-based weight updates
  - Exponential moving average of performance
- Model persistence and recovery

### Phase 5: Risk Management
- Account balance monitoring
- Maximum position size (configurable)
- Daily loss limits
- Trade frequency limits
- Emergency stop functionality

### Phase 6: Testing & Optimization
- Backtesting with historical data (if available)
- Paper trading mode (simulation)
- Performance monitoring dashboard
- Logging and alerting

---

## Source Code Structure

```
binary-options-bot/
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore file
├── requirements.txt             # Python dependencies
├── config.yaml                  # Bot configuration
├── README.md                    # Project documentation
│
├── src/
│   ├── __init__.py
│   ├── main.py                  # Entry point and orchestrator
│   ├── config.py                # Configuration management
│   │
│   ├── browser/
│   │   ├── __init__.py
│   │   ├── manager.py           # Browser session manager
│   │   ├── login.py             # Pocket Options login
│   │   ├── trader.py            # Trade execution
│   │   └── selectors.py         # CSS/XPath selectors
│   │
│   ├── market/
│   │   ├── __init__.py
│   │   ├── data_fetcher.py      # Price data extraction
│   │   ├── candle_builder.py    # 1-min candle aggregation
│   │   └── data_buffer.py       # Rolling window buffer
│   │
│   ├── strategy/
│   │   ├── __init__.py
│   │   ├── indicators.py        # Technical indicators
│   │   ├── signals.py           # Signal generation
│   │   ├── voting.py            # Weighted voting system
│   │   └── decision.py          # Final trade decision
│   │
│   ├── learning/
│   │   ├── __init__.py
│   │   ├── tracker.py           # Performance tracking
│   │   ├── optimizer.py         # Weight optimization
│   │   └── model.py             # ML model management
│   │
│   ├── risk/
│   │   ├── __init__.py
│   │   ├── manager.py           # Risk management logic
│   │   └── limits.py            # Limit enforcement
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   ├── models.py            # SQLAlchemy models
│   │   └── repository.py        # Database operations
│   │
│   └── utils/
│       ├── __init__.py
│       ├── logger.py            # Logging setup
│       └── helpers.py           # Utility functions
│
├── tests/
│   ├── __init__.py
│   ├── test_indicators.py
│   ├── test_signals.py
│   ├── test_voting.py
│   ├── test_risk_manager.py
│   └── test_data_buffer.py
│
└── data/
    ├── trades.db                # SQLite database
    └── models/                  # Saved ML models
```

---

## Data Models

### Database Schema

#### `trades` Table
```sql
CREATE TABLE trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    asset VARCHAR(20) NOT NULL,
    direction VARCHAR(4) NOT NULL,  -- 'CALL' or 'PUT'
    stake_amount DECIMAL(10,2) NOT NULL,
    contract_duration INTEGER NOT NULL,  -- in minutes
    entry_price DECIMAL(10,4) NOT NULL,
    exit_price DECIMAL(10,4),
    outcome VARCHAR(10),  -- 'WIN', 'LOSS', 'PENDING'
    profit_loss DECIMAL(10,2),
    indicators_state JSON,  -- Indicator values at trade time
    indicator_weights JSON,  -- Current weights
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `indicator_performance` Table
```sql
CREATE TABLE indicator_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    indicator_name VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    total_signals INTEGER DEFAULT 0,
    correct_signals INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2),
    avg_profit DECIMAL(10,2),
    current_weight DECIMAL(5,4),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(indicator_name, date)
);
```

#### `account_balance` Table
```sql
CREATE TABLE account_balance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    balance DECIMAL(10,2) NOT NULL,
    daily_pnl DECIMAL(10,2),
    total_trades INTEGER
);
```

### Configuration Schema (config.yaml)

```yaml
pocket_options:
  base_url: "https://pocketoption.com/"
  login_email: "${POCKET_EMAIL}"  # From .env
  login_password: "${POCKET_PASSWORD}"  # From .env
  
trading:
  asset: "EUR/USD"  # Default asset
  timeframe: 1  # minutes
  contract_duration: 5  # minutes
  stake_amount: 5.0  # USD
  max_concurrent_trades: 1
  
indicators:
  rsi:
    period: 14
    overbought: 70
    oversold: 30
  macd:
    fast_period: 12
    slow_period: 26
    signal_period: 9
  bollinger_bands:
    period: 20
    std_dev: 2
  ema:
    periods: [9, 21, 50]
  stochastic:
    k_period: 14
    d_period: 3
  adx:
    period: 14
    threshold: 25
    
strategy:
  min_signal_strength: 0.6  # 0-1 threshold for trade execution
  initial_weights:  # Equal weights initially
    rsi: 1.0
    macd: 1.0
    bollinger: 1.0
    ema: 1.0
    stochastic: 1.0
    adx: 1.0
  learning_rate: 0.01  # Weight adjustment rate
  
risk_management:
  max_daily_loss: 50.0  # USD
  max_daily_trades: 50
  min_account_balance: 100.0  # Stop trading if below
  position_size_pct: 2.0  # % of account per trade
  
logging:
  level: "INFO"
  file: "logs/bot.log"
  max_size_mb: 10
  backup_count: 5
```

---

## Key Algorithms

### Weighted Voting System

```python
def calculate_trade_signal(indicators: dict, weights: dict) -> float:
    """
    Returns signal strength: -1 (strong PUT) to +1 (strong CALL)
    """
    weighted_sum = 0
    total_weight = 0
    
    for indicator_name, signal in indicators.items():
        weight = weights.get(indicator_name, 1.0)
        weighted_sum += signal * weight
        total_weight += weight
    
    if total_weight == 0:
        return 0
    
    return weighted_sum / total_weight
```

### Weight Update (Reinforcement Learning)

```python
def update_weights(trade_outcome: dict, current_weights: dict) -> dict:
    """
    Update indicator weights based on trade outcome
    Uses gradient ascent for winning indicators, descent for losing
    """
    learning_rate = 0.01
    reward = 1.0 if trade_outcome['profit_loss'] > 0 else -1.0
    
    new_weights = {}
    for indicator, signal in trade_outcome['indicators_state'].items():
        current_weight = current_weights[indicator]
        
        # Reward indicators that signaled in the correct direction
        if (signal > 0 and reward > 0) or (signal < 0 and reward > 0):
            gradient = learning_rate * abs(signal) * reward
        else:
            gradient = -learning_rate * abs(signal)
        
        new_weights[indicator] = max(0.1, current_weight + gradient)
    
    # Normalize weights
    total = sum(new_weights.values())
    return {k: v/total for k, v in new_weights.items()}
```

---

## Technical Challenges & Solutions

### Challenge 1: Anti-Bot Detection
**Issue**: Pocket Options likely has anti-automation measures

**Solutions**:
- Use `undetected-chromedriver` to bypass basic detection
- Random delays between actions (human-like behavior)
- Mouse movement simulation
- User-agent rotation
- Browser fingerprint randomization

### Challenge 2: Real-time Data Extraction
**Issue**: Extracting price data from dynamic web UI

**Solutions**:
- WebSocket sniffing (if available via browser DevTools)
- DOM polling with CSS selectors
- Backup: Screenshot OCR for price reading (if necessary)
- Data validation and sanity checks

### Challenge 3: Overfitting Indicators
**Issue**: Too many indicators might prevent trading

**Solutions**:
- Require minimum signal strength (0.6 threshold)
- Allow conflicting signals (weighted average)
- Time-based forcing (must make decision after X seconds)
- Confidence decay over time

### Challenge 4: Learning Stability
**Issue**: Weights might oscillate or diverge

**Solutions**:
- Exponential moving average of weights
- Bounded weights (0.1 to 5.0 range)
- Weight normalization
- Periodic reset mechanism
- Track long-term performance (30-day average)

### Challenge 5: Network/Session Failures
**Issue**: Browser crashes, disconnections

**Solutions**:
- Automatic session recovery
- Trade state persistence
- Heartbeat monitoring
- Graceful degradation

---

## Verification Approach

### Unit Tests
- **Indicators Module**: Test each indicator calculation
- **Signal Generation**: Test signal logic for edge cases
- **Voting System**: Test weighted averaging
- **Weight Updates**: Test learning algorithm
- **Risk Manager**: Test limit enforcement

### Integration Tests
- **Browser Automation**: Test login flow (with test account)
- **Data Pipeline**: Test data extraction → indicators → signals
- **Trade Execution**: Test order placement (paper trading mode)
- **Database**: Test CRUD operations

### Manual Testing
1. **Paper Trading Mode**: Run bot without real money
2. **Single Trade Test**: Verify one complete trade cycle
3. **Multi-Trade Test**: Verify learning over 20+ trades
4. **Risk Limits**: Verify bot stops at daily loss limit
5. **Session Recovery**: Kill browser mid-trade, verify recovery

### Performance Metrics
- **Win Rate**: Target >55% for profitability
- **Average Profit/Loss Ratio**: Target >1.1
- **Max Drawdown**: Monitor largest losing streak
- **Indicator Accuracy**: Track per-indicator win rates
- **System Uptime**: Target >95% availability

### Test Commands
```bash
# Run all tests
pytest tests/ -v

# Run specific test suite
pytest tests/test_indicators.py -v

# Run with coverage
pytest --cov=src tests/

# Lint code
flake8 src/ tests/
black --check src/ tests/

# Type checking
mypy src/
```

---

## Security & Safety Considerations

### Credentials Management
- Store credentials in `.env` file (never in code)
- Use environment variables
- Add `.env` to `.gitignore`

### Trading Safety
- **Paper Trading Mode**: Test without real money first
- **Maximum Loss Limits**: Hard caps on daily losses
- **Manual Override**: Emergency stop button/command
- **Account Balance Checks**: Stop if balance too low
- **Cooldown Periods**: Prevent revenge trading

### Code Security
- Input validation on all external data
- SQL injection prevention (use ORM)
- Error handling for all API calls
- Rate limiting on requests

---

## Development Workflow

### Phase 1: Setup & Browser (Week 1)
1. Initialize project structure
2. Set up dependencies
3. Implement browser automation
4. Test Pocket Options login
5. Test basic trade execution

### Phase 2: Data & Indicators (Week 2)
1. Implement price data extraction
2. Build candle aggregation
3. Implement all technical indicators
4. Create data buffer system
5. Unit test all indicators

### Phase 3: Strategy (Week 3)
1. Implement signal generation
2. Build weighted voting system
3. Integrate with trade execution
4. Test signal accuracy

### Phase 4: Learning (Week 4)
1. Build performance tracking
2. Implement weight optimization
3. Add model persistence
4. Test learning convergence

### Phase 5: Risk & Polish (Week 5)
1. Implement risk management
2. Add logging and monitoring
3. Build paper trading mode
4. Integration testing
5. Documentation

---

## Open Questions for User

1. **Account Access**: Do you have a Pocket Options account set up for testing?

2. **Initial Capital**: What's your starting account balance and risk tolerance?

3. **Asset Preference**: Which asset do you want to trade (EUR/USD, BTC/USD, etc.)?

4. **Trade Size**: What stake amount per trade (suggested: 1-2% of account)?

5. **Testing Approach**: Should we implement paper trading mode first before live trading?

6. **Stop Conditions**: What conditions should trigger the bot to stop trading?
   - Daily loss limit: $50? $100?
   - Consecutive losses: 5? 10?
   - Minimum balance: $100? $200?

7. **Monitoring**: Do you want a dashboard/UI or command-line logging?

8. **Deployment**: Where will this run (local machine, VPS, cloud)?

9. **Data Access**: Can you check if Pocket Options has a WebSocket/API for price data, or will we need to scrape the UI?

10. **Browser**: Headless mode (background) or visible browser for monitoring?

---

## Success Criteria

The bot will be considered successful when:

✅ Logs into Pocket Options automatically  
✅ Extracts real-time price data reliably  
✅ Calculates all 6+ technical indicators correctly  
✅ Makes trade decisions using weighted voting  
✅ Executes one trade at a time with 5-min expiration  
✅ Tracks trade outcomes (win/loss)  
✅ Adjusts indicator weights based on performance  
✅ Respects risk management limits  
✅ Achieves >55% win rate over 100+ trades  
✅ Runs continuously with session recovery  
✅ Logs all activities for audit trail  

---

## Timeline Estimate

- **Phase 1 (Foundation)**: 5-7 days
- **Phase 2 (Data & Indicators)**: 7-10 days  
- **Phase 3 (Strategy)**: 5-7 days
- **Phase 4 (Learning)**: 7-10 days
- **Phase 5 (Risk & Polish)**: 5-7 days
- **Testing & Optimization**: 7-14 days

**Total**: 6-8 weeks for production-ready bot

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Anti-bot detection blocks access | High | Use undetected-chromedriver, human-like delays |
| Indicators produce false signals | High | Weight adjustment, multi-indicator consensus |
| Network failures during trade | Medium | Session recovery, trade state persistence |
| Learning algorithm doesn't converge | Medium | Implement multiple learning strategies, manual override |
| Account loss due to bugs | Critical | Paper trading first, strict risk limits, emergency stop |
| Price data extraction breaks | High | Multiple extraction methods, fallback mechanisms |
| Overtrading depletes account | High | Daily trade limits, position sizing rules |

