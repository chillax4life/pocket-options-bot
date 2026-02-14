# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification
<!-- chat-id: bd57af59-e10b-4f4b-95f8-4ab8562e3f24 -->

Assess the task's difficulty, as underestimating it leads to poor outcomes.
- easy: Straightforward implementation, trivial bug fix or feature
- medium: Moderate complexity, some edge cases or caveats to consider
- hard: Complex logic, many caveats, architectural considerations, or high-risk changes

Create a technical specification for the task that is appropriate for the complexity level:
- Review the existing codebase architecture and identify reusable components.
- Define the implementation approach based on established patterns in the project.
- Identify all source code files that will be created or modified.
- Define any necessary data model, API, or interface changes.
- Describe verification steps using the project's test and lint commands.

Save the output to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach
- Source code structure changes
- Data model / API / interface changes
- Verification approach

If the task is complex enough, create a detailed implementation plan based on `{@artifacts_path}/spec.md`:
- Break down the work into concrete tasks (incrementable, testable milestones)
- Each task should reference relevant contracts and include verification steps
- Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function).

Important: unit tests must be part of each implementation task, not separate tasks. Each task should implement the code and its tests together, if relevant.

Save to `{@artifacts_path}/plan.md`. If the feature is trivial and doesn't warrant this breakdown, keep the Implementation step below as is.

---

### [ ] Step: Project Setup and Environment Configuration
<!-- chat-id: 10c00179-0e15-4526-9486-058f875e8281 -->

Initialize the Python project structure with all necessary dependencies and configuration files.

**Tasks**:
- Create project directory structure (src/, tests/, data/, logs/)
- Create requirements.txt with all dependencies
- Create .env.example template for credentials
- Create config.yaml with default trading parameters
- Create .gitignore for Python projects
- Set up logging configuration
- Initialize git repository

**Verification**:
- Run `pip install -r requirements.txt` successfully
- Verify directory structure is created
- Check .gitignore excludes .env, data/, logs/

---

### [ ] Step: Browser Automation Foundation

Implement Selenium-based browser automation to interact with Pocket Options website.

**Tasks**:
- Implement BrowserManager class with undetected-chromedriver
- Add anti-detection features (random delays, mouse movements)
- Implement session management and keep-alive
- Create selectors.py with CSS/XPath selectors for Pocket Options UI
- Add browser configuration (headless option, window size)
- Implement error handling and session recovery
- Write unit tests for browser manager

**Verification**:
- Browser launches successfully
- Can navigate to Pocket Options
- Session persists for >10 minutes
- Tests pass: `pytest tests/test_browser_manager.py -v`

---

### [ ] Step: Pocket Options Login Automation

Implement automated login flow for Pocket Options account.

**Tasks**:
- Implement LoginManager class
- Add credential loading from .env
- Implement login flow automation (find form, fill credentials, submit)
- Add CAPTCHA detection and manual intervention fallback
- Implement login verification (check for dashboard elements)
- Add retry logic for failed logins
- Write integration tests for login (with test account)

**Verification**:
- Successfully logs into Pocket Options account
- Handles login errors gracefully
- Persists logged-in session
- Manual test: Run login script, verify dashboard loads

---

### [ ] Step: Trade Execution Module

Implement the ability to place binary options trades through the browser.

**Tasks**:
- Implement TradeExecutor class
- Add methods to select asset (EUR/USD, etc.)
- Implement timeframe selection (1-min)
- Implement contract duration selection (5-min)
- Add CALL/PUT button click automation
- Implement stake amount input
- Add trade confirmation and order tracking
- Implement trade outcome detection (win/loss after expiration)
- Write integration tests for trade execution

**Verification**:
- Can place a single trade successfully
- Trade parameters are set correctly
- Trade outcome is captured after expiration
- Manual test: Place paper trade, verify on Pocket Options

---

### [ ] Step: Real-time Price Data Extraction

Implement price data extraction from Pocket Options interface for technical analysis.

**Tasks**:
- Implement DataFetcher class
- Add price extraction from DOM (current price, timestamp)
- Implement CandleBuilder for 1-minute candle aggregation
- Create DataBuffer class for rolling window (100+ candles)
- Add data validation and sanity checks
- Implement WebSocket sniffing if available (fallback to polling)
- Add error handling for missing/invalid data
- Write unit tests for candle building and buffering

**Verification**:
- Extracts current price every second
- Builds 1-minute candles correctly
- Maintains buffer of last 100 candles
- Tests pass: `pytest tests/test_data_fetcher.py -v`

---

### [ ] Step: Technical Indicators Implementation

Implement all technical indicators for signal generation.

**Tasks**:
- Implement RSI (Relative Strength Index)
- Implement MACD (Moving Average Convergence Divergence)
- Implement Bollinger Bands
- Implement EMA (Exponential Moving Average) for multiple periods
- Implement Stochastic Oscillator
- Implement ADX (Average Directional Index)
- Add volume analysis (if data available)
- Create indicator calculator wrapper class
- Write comprehensive unit tests for each indicator

**Verification**:
- Each indicator calculates correctly against known test data
- Indicators handle edge cases (insufficient data, NaN values)
- Tests pass: `pytest tests/test_indicators.py -v`
- Compare output with TradingView for validation

---

### [ ] Step: Signal Generation System

Implement signal generation logic that interprets indicator values.

**Tasks**:
- Implement SignalGenerator class
- Add signal interpretation for each indicator:
  - RSI: overbought (>70) = SELL, oversold (<30) = BUY
  - MACD: crossover signals
  - Bollinger: price touching bands
  - EMA: trend direction and crossovers
  - Stochastic: overbought/oversold
  - ADX: trend strength confirmation
- Normalize signals to -1 (PUT) to +1 (CALL) scale
- Add signal confidence scoring
- Write unit tests for signal generation logic

**Verification**:
- Signals are generated correctly for test scenarios
- Edge cases handled (conflicting signals, neutral markets)
- Tests pass: `pytest tests/test_signals.py -v`

---

### [ ] Step: Weighted Voting System

Implement the weighted voting mechanism to combine indicator signals.

**Tasks**:
- Implement VotingSystem class
- Add weighted average calculation for signals
- Implement weight normalization
- Add configurable signal strength threshold (0.6 default)
- Implement trade decision logic (CALL, PUT, or WAIT)
- Add weight persistence and loading
- Write unit tests for voting algorithm

**Verification**:
- Correctly aggregates multiple signals
- Respects weight priorities
- Threshold prevents weak signals from triggering trades
- Tests pass: `pytest tests/test_voting.py -v`

---

### [ ] Step: Database Layer

Implement SQLite database for trade history and performance tracking.

**Tasks**:
- Set up SQLAlchemy ORM
- Create database models (Trade, IndicatorPerformance, AccountBalance)
- Implement Repository pattern for database operations
- Add migrations/initialization script
- Implement CRUD operations for all models
- Add database connection management
- Write unit tests for database operations

**Verification**:
- Database schema created successfully
- Can save and retrieve trades
- Can query performance metrics
- Tests pass: `pytest tests/test_database.py -v`

---

### [ ] Step: Performance Tracking System

Implement tracking of indicator performance and trade outcomes.

**Tasks**:
- Implement PerformanceTracker class
- Track trade outcomes (win/loss, profit/loss)
- Calculate per-indicator metrics:
  - Win rate when indicator signaled
  - Average profit when indicator was right
  - Signal accuracy over time
- Implement aggregation by day/week/month
- Add performance reporting methods
- Write unit tests for tracking logic

**Verification**:
- Correctly attributes wins/losses to indicators
- Metrics calculated accurately
- Can generate performance reports
- Tests pass: `pytest tests/test_tracker.py -v`

---

### [ ] Step: Learning Engine - Weight Optimization

Implement the machine learning component that adjusts indicator weights.

**Tasks**:
- Implement WeightOptimizer class
- Add gradient-based weight update algorithm
- Implement exponential moving average for weight stability
- Add weight bounds (0.1 to 5.0)
- Implement weight normalization after updates
- Add model persistence (save/load weights)
- Implement performance-based learning rate adjustment
- Write unit tests for weight optimization

**Verification**:
- Weights update correctly after trades
- Weights converge over 50+ trades in simulation
- Winning indicators get higher weights
- Tests pass: `pytest tests/test_optimizer.py -v`

---

### [ ] Step: Risk Management System

Implement risk management rules to protect the account.

**Tasks**:
- Implement RiskManager class
- Add account balance tracking
- Implement position sizing (% of account)
- Add daily loss limit enforcement
- Implement maximum daily trades limit
- Add minimum balance check (stop if too low)
- Implement emergency stop functionality
- Add cooldown periods after losses
- Write unit tests for all risk rules

**Verification**:
- Bot stops at daily loss limit
- Position sizing scales with account
- Emergency stop works immediately
- Tests pass: `pytest tests/test_risk_manager.py -v`

---

### [ ] Step: Main Orchestrator and Trading Loop

Implement the main bot orchestrator that coordinates all components.

**Tasks**:
- Implement TradingBot main class
- Add initialization of all components
- Implement main trading loop:
  1. Fetch real-time data
  2. Calculate indicators
  3. Generate signals
  4. Check risk limits
  5. Make trade decision
  6. Execute trade (if signal strong enough)
  7. Wait for trade outcome
  8. Update weights based on result
  9. Repeat
- Add graceful shutdown handling
- Implement state persistence (resume after restart)
- Add comprehensive logging throughout
- Create command-line interface

**Verification**:
- Bot runs complete trade cycle
- All components work together
- Logs show detailed execution flow
- Can stop and resume gracefully

---

### [ ] Step: Paper Trading Mode

Implement simulation mode for risk-free testing.

**Tasks**:
- Add paper trading flag to config
- Implement simulated trade execution
- Use real data but fake money
- Track simulated account balance
- Add performance comparison (paper vs live)
- Create paper trading report generator

**Verification**:
- Paper mode doesn't place real trades
- Simulated balance tracks correctly
- Can run 100+ paper trades
- Performance metrics are calculated

---

### [ ] Step: Integration Testing and Bug Fixes

Perform end-to-end testing and fix any issues found.

**Tasks**:
- Run full bot in paper trading mode for 24 hours
- Test session recovery (kill browser mid-session)
- Test risk limit enforcement
- Test learning convergence over 100+ trades
- Fix any bugs discovered
- Optimize performance bottlenecks
- Add missing error handling

**Verification**:
- Bot runs for 24+ hours without crashes
- Handles all error scenarios gracefully
- Session recovery works
- All risk limits enforced

---

### [ ] Step: Documentation and Final Report

Create user documentation and project completion report.

**Tasks**:
- Create comprehensive README.md:
  - Installation instructions
  - Configuration guide
  - Usage instructions
  - Safety warnings
- Document all configuration options
- Add code comments where needed
- Create troubleshooting guide
- Write final report to `{@artifacts_path}/report.md`:
  - What was implemented
  - Test results (paper trading performance)
  - Known limitations
  - Recommendations for live trading
  - Challenges encountered and solutions

**Verification**:
- README is clear and complete
- Report covers all aspects
- Documentation is accurate
