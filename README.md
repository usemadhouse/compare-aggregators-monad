# DEX Aggregator Comparison Script

## Overview

The DEX Aggregator Comparison Script is a sophisticated benchmarking and analysis tool designed to objectively compare
the performance of decentralized exchange (DEX) aggregators on the Monad testnet. This tool helps identify which
aggregators provide the best trading outcomes for users by testing real-world trading scenarios across hundreds of token
pairs and trade sizes.

### Purpose

In the competitive landscape of DEX aggregators, performance differences can significantly impact user returns. This
script serves several key purposes:

- **Objective Performance Measurement**: Compare aggregators based on actual quote quality, response times, and
  transaction success rates rather than marketing claims
- **Market-Realistic Testing**: Weight results based on real-world trading patterns, prioritizing the most commonly
  traded pairs and typical trade sizes
- **Comprehensive Coverage**: Test across 147+ token pairs and 20 different trade sizes (from $1 to $1M) to understand
  performance across all market conditions
- **Simulation Verification**: Optionally verify quotes through on-chain simulation to catch aggregators that provide
  inaccurate pricing
- **Data-Driven Insights**: Generate detailed CSV reports and summary statistics to identify consistent performance
  leaders

### Performance Metrics

The script generates comprehensive performance statistics for each aggregator across multiple dimensions:

#### Quote Quality Metrics

- **Best Quote Percentage**: How often an aggregator provides the best output amount compared to competitors for each
  route
- **Weighted Best Quote Percentage**: Best quote percentage weighted by token pair importance (Tier 1-3) and trade size
  distribution (detailed below)
- **Best Quote by Pair**: Performance breakdown showing which aggregators excel on specific token pairs (e.g., MON-USDC,
  WETH-WBTC)
- **Best Quote by Trade Size**: Separate statistics for small (≤$100), medium ($100-$10K), and large (>$10K) trades to
  identify aggregators that specialize in different trade sizes

#### Speed & Reliability Metrics

- **Fastest Response Percentage**: How often an aggregator returns the quickest response time among all tested
  aggregators
- **Success Rate**: Percentage of requests that return valid quotes (status 200 with output > 0)
- **P50 Latency (Median)**: The median response time - 50% of requests complete faster than this
- **P95 Latency**: 95th percentile response time - only 5% of requests are slower than this
- **P99 Latency**: 99th percentile response time - captures worst-case latency for the slowest 1% of requests

#### Simulation Metrics (When Enabled)

When running with `--simulation` flag, the script verifies quotes by executing them on a forked network:

- **Simulation Revert Rate**: Percentage of successful quotes that actually fail (revert) when executed on-chain - lower
  is better
- **Simulation Revert Rate by Trade Size**: Breakdown of revert rates across different trade sizes to identify
  problematic ranges
- **Best Net Amount Percentage**: After accounting for actual gas costs from simulation, which aggregator provides the
  best net return to the user
- **Average Quote vs Simulation Difference**: How accurate are the aggregator's quotes compared to actual on-chain
  execution

### Weighted Scoring System

To provide realistic performance metrics that reflect actual user value, the script implements a sophisticated weighted
scoring system:

#### Token Pair Weighting

Token pairs are weighted based on their market importance across three tiers:

- **Tier 1 Tokens** (Highest volume): MON, WETH, WBTC, USDC, USDT
- **Tier 2 Tokens** (Medium volume): gMON, sMON, aprMON, shMON, CHOG
- **Tier 3 Tokens** (Lower volume): All other tokens

**Pair Weight Multipliers:**

- Tier 1 ↔ Tier 1: **10x** (e.g., USDC-USDT, WETH-WBTC)
- Tier 1 ↔ Tier 2: **5x** (e.g., MON-gMON, USDC-sMON)
- Tier 2 ↔ Tier 2: **3x** (e.g., gMON-sMON)
- Tier 1 ↔ Tier 3: **2x**
- Tier 2 ↔ Tier 3: **1x** (baseline)
- Tier 3 ↔ Tier 3: **1x** (baseline)

#### Trade Size Weighting

Trade sizes are categorized to reflect realistic trading volume distribution:

- **Small trades** (≤$100): **40%** weight - Represents retail user activity
- **Medium trades** ($100-$10,000): **50%** weight - Most common trading range
- **Large trades** (>$10,000): **10%** weight - Whale/institutional activity

#### Combined Weighted Score

The final weighted best quote percentage multiplies pair weight by trade size weight, ensuring that an aggregator's
score on a $100 USDC→USDT trade (Tier 1-1, Small) carries significantly more importance than a $50,000 obscure→obscure
trade (Tier 3-3, Large).

This weighting approach ensures that aggregators are evaluated based on where they matter most: the pairs and trade
sizes that real users actually transact.

## Features

- 🔄 Compare multiple DEX aggregators simultaneously
- ⚡ Measure response times and performance
- 💰 Compare output amounts and pricing efficiency
- 🧪 Optional transaction simulation on forked network
- 📊 Detailed CSV reports with results
- 📈 Summary statistics showing best performers
- 🎯 Interactive or command-line aggregator selection
- 🎲 Random sampling mode for quick testing
- 🔁 Automatic retry with exponential backoff for transient failures
- 🛡️ Comprehensive error handling and recovery
- ⏱️ Extended timeouts (up to 5 minutes for heavy operations)
- 🚦 Rate limiting to prevent API overload
- 🔍 Intelligent error detection (recoverable vs permanent failures)
- 💪 Graceful shutdown handling

## Supported Aggregators

- **Madhouse**
- **Monorail**
- **OpenOcean**
- **Eisen Finance**
- **Kuru** (requires Privy authentication token)
- **Mace**
- **Dirol**
- **0x** (requires API key)

## Prerequisites

- [Bun](https://bun.sh/) runtime (v1.0.0 or higher)
- [Anvil](https://book.getfoundry.sh/anvil/) (optional, for transaction simulation)
- Node.js 18+ (optional, as fallback)

## Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd compare-aggregators-monad
```

2. Install dependencies:

```bash
bun install
```

3. (Optional) Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your API keys if needed
```

## Usage

### Interactive Mode (Recommended)

Simply run:

```bash
bun start
```

You'll see an interactive menu where you can select which aggregators to test:

```
============================================================
AGGREGATOR SELECTION
============================================================

Use SPACE to select/deselect, ENTER to confirm

? Select aggregators to test: (Use arrow keys, space to select, enter to submit)
❯◯ madhouse
 ◯ monorail
 ◯ openocean
 ◯ eisenFinance
 ◯ kuru
 ◯ mace
 ◯ dirol
 ◯ 0x
 ◯ All aggregators
```

**How to use:**

- Use **arrow keys** to navigate
- Press **SPACE** to select/deselect aggregators
- Press **ENTER** to confirm and start testing
- Select "All aggregators" to test all at once
- You can select multiple individual aggregators

**Examples:**

- Select `madhouse` to run production environment
- Select `madhouse`, `monorail`, `openocean`, and `eisenFinance` to compare against competitors
- Select "All aggregators" to run a comprehensive comparison

### Command-Line Mode

For automation and scripting:

Compare specific aggregators:

```bash
bun start -- -a madhouse,monorail
# or
bun start -- --aggregators madhouse,monorail,openocean
```

Enable transaction simulation:

```bash
bun start -- --simulation
```

### Random Sampling Mode

Test with random pairs and amounts instead of the full test suite:

```bash
# Test with 10 random pair-amount combinations
bun start -- --random 10

# Test with 20 random samples using specific aggregators
bun start -- --random 20 -a madhouse,openocean

# Random sampling with simulation
bun start -- --random 15 --simulation
```

**Benefits of random sampling:**

- Quick spot checks without running all ~2,940 combinations
- Faster testing during development
- Representative sampling for quick performance assessment
- Useful for monitoring and health checks

Combine options:

```bash
bun start -- -a madhouse,monorail --simulation
```

Show help:

```bash
bun start -- --help
```

**Available aggregator names:**

- `madhouse`
- `monorail`
- `openocean`
- `eisenFinance`
- `kuru`
- `mace`
- `dirol`
- `0x`

### Transaction Simulation (Optional)

For more accurate testing with transaction simulation:

1. Start the Anvil fork in a separate terminal:

```bash
bun run fork
# or manually:
./scripts/sh/start-fork.sh
```

2. Run the comparison script with simulation:

```bash
bun start -- --simulation
```

**Important Notes:**

- When `--simulation` is enabled, the script automatically filters aggregators to only include those that support
  simulation
- Aggregators without transaction data (txData) in their responses will be excluded
- The script displays warnings for excluded aggregators during the selection phase
- Simulation support by aggregator:
  - ✅ Supported: Madhouse (all environments), Kuru, most major aggregators
  - ⚠️ Check aggregator documentation for specific simulation capabilities

## Output

The script generates:

1. **Console Output**: Real-time progress and results
2. **CSV File**: Detailed results in `comparison_results/DD_MM_YYYY_HH_MM_SS.csv` (timestamped)
3. **Summary Report**: Statistics showing which aggregator performed best

### CSV Columns

- `time`: Timestamp of the test
- `protocol`: Aggregator name
- `tokenFromSymbol` / `tokenToSymbol`: Token pair symbols
- `tokenIn` / `tokenOut`: Token addresses
- `amount`: USD amount tested
- `output`: Raw output amount from aggregator
- `duration`: Response time in milliseconds
- `status`: HTTP status code
- `url`: Request URL
- `routes`: Number of routes/paths found
- `durationResult`: Performance comparison
- `outputResult`: Price comparison
- `simulationStatus`: Transaction simulation result
- `simulationOutput`: Actual output from simulation
- `simulationError`: Any simulation errors

### Summary Report Example

```
============================================================
SUMMARY REPORT
============================================================
Mode: Random Sampling (20 samples)  // or "Mode: Full Test (all pairs × all amounts)"
Total Routes Tested: 20
Total Aggregators: 5
Total Tests: 100

BEST QUOTE PERCENTAGE (by aggregator):
--------------------------------------------------------------------------------
  madhouse           : 35.00%  (35/100 routes)
  monorail           : 28.00%  (28/100 routes)
  openocean          : 20.00%  (20/100 routes)
  eisenFinance       : 12.00%  (12/100 routes)
  0x                 : 5.00%   (5/100 routes)

FASTEST RESPONSE PERCENTAGE (by aggregator):
--------------------------------------------------------------------------------
  madhouse           : 45.00%  (45/100 routes)
  monorail           : 30.00%  (30/100 routes)
  openocean          : 15.00%  (15/100 routes)
  eisenFinance       : 8.00%   (8/100 routes)
  0x                 : 2.00%   (2/100 routes)
============================================================
```

## Configuration

### Test Parameters

Edit these in `src/consts.ts`:

```typescript
// Test amounts in USD
export const TEST_AMOUNTS = [
  1, 5, 10, 25, 50, 75, 100, 150, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000,
];

// Token pairs (147 pairs total)
export const HARDCODED_PAIRS: TokenPair[] = [
  // ... comprehensive list of token pairs
];
```

**Test Coverage:**

- **Full Test Mode**: Tests all 147 pairs × 20 amounts = 2,940 combinations per aggregator
- **Random Mode**: Tests n random pair-amount combinations (specified via --random flag)

### Utility Functions

The project includes several utility modules for robust operation:

**`src/utils.ts`** - Core utilities:

```typescript
// Sleep/wait for a duration
export function sleep(ms: number): Promise<void>;

// Calculate amountIn from USD amount, considering token price and decimals
export function calculateAmountIn(usdAmount: number, tokenAddress: string, tokenInDecimals: number): BigInt;

// Convert amountIn string back to token decimals
export function getAmountInTokenDecimals(amountIn: string, tokenInDecimals: number): string;

// Generate timestamped output filename
export function generateOutputFilename(outputDir: string): string;

// Check if token is a native token
export function isNativeToken(tokenAddress: string): boolean;
```

**`src/utils/client.ts`** - Robust RPC client utilities with retry logic:

```typescript
// Create HTTP transport with increased timeouts and retries
export function createRobustHttpTransport(url: string, options?: Partial<HttpTransportConfig>);

// Create test client with improved error handling
export function createRobustTestClient(chain: Chain, rpcUrl: string, options?: { timeout?: number }): TestClient;

// Create public client with improved error handling
export function createRobustPublicClient(chain: Chain, rpcUrl: string, options?: { timeout?: number }): PublicClient;

// Reset fork with retry logic (for Anvil operations)
export async function resetForkWithRetry(
  client: any,
  rpcUrl: string,
  blockNumber: bigint,
  options?: { maxAttempts?: number },
): Promise<void>;

// Execute transaction with retry logic
export async function executeTransactionWithRetry(
  client: any,
  transaction: any,
  options?: { maxAttempts?: number; timeout?: number },
): Promise<any>;

// Call contract with retry logic
export async function callContractWithRetry(
  client: any,
  request: any,
  options?: { maxAttempts?: number; timeout?: number },
): Promise<any>;

// Read contract with retry logic
export async function readContractWithRetry(
  client: any,
  request: any,
  options?: { maxAttempts?: number },
): Promise<any>;

// Check if Anvil is responding
export async function checkAnvilHealth(rpcUrl: string): Promise<boolean>;

// Wait for Anvil to be ready
export async function waitForAnvil(rpcUrl: string, maxWaitTime?: number): Promise<void>;
```

**`src/utils/retry.ts`** - Exponential backoff and retry mechanisms:

```typescript
// Retry a function with exponential backoff
export async function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;

// Create a timeout wrapper for async functions
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage?: string): Promise<T>;

// Batch operations with rate limiting
export async function batchWithRateLimit<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  options?: {
    batchSize?: number;
    delayBetweenBatches?: number;
    delayBetweenItems?: number;
  },
): Promise<R[]>;
```

**`src/utils/error-recovery.ts`** - Comprehensive error handling:

```typescript
// Wraps an async operation with comprehensive error recovery
export async function withErrorRecovery<T>(
  operation: () => Promise<T>,
  context: string,
  options?: ErrorRecoveryOptions,
): Promise<T | null>;

// Process items with error recovery for each item
export async function processWithRecovery<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options?: {
    continueOnItemError?: boolean;
    maxConcurrent?: number;
    onItemError?: (item: T, error: any, index: number) => void;
    onItemSuccess?: (item: T, result: R, index: number) => void;
  },
): Promise<Array<{ success: boolean; item: T; result?: R; error?: any }>>;

// Create a graceful shutdown handler
export function setupGracefulShutdown(cleanup: () => Promise<void>): void;
```

These utilities provide:

- **Automatic retry** with exponential backoff for transient failures
- **Extended timeouts** (up to 5 minutes for heavy operations like fork resets)
- **Intelligent error detection** to distinguish recoverable from permanent failures
- **Rate limiting** to prevent overwhelming APIs
- **Graceful shutdown** handling for clean termination
- **Health checks** for Anvil and other services

Edit chain configuration in `src/compare.ts`:

```typescript
// Chain configuration
const CHAIN_ID = 10143; // Monad testnet

// Slippage tolerance
const SLIPPAGE = 0.005; // 0.5%

// Output directory
const OUTPUT_DIR = "./comparison_results";
```

### Token Pairs

The script tests a comprehensive set of token pairs including:

- Native token (MON) to stablecoins (USDC, USDT)
- Major tokens (WETH, WBTC) pairs
- MON derivatives (aprMON, gMON, shMON, sMON)
- All combinations between major tokens

### Adding New Aggregators

To add a new aggregator:

1. **Create a new aggregator implementation** in `src/aggregators/`:

```typescript
// src/aggregators/yourAggregator.ts
import { BaseAggregator, type AggregatorOutput, type FetchOptions } from "./baseAggregator";
import type { QuoteRequest, SwapTransaction } from "../types";

export class YourAggregator extends BaseAggregator {
  buildQuoteUrl(request: QuoteRequest): string {
    // Build the API URL for your aggregator
    // Note: request contains chain, tokenIn, tokenOut, amountIn, tokenInDecimals, tokenOutDecimals, slippage
    return `${this.baseUrl}?tokenIn=${request.tokenIn}&tokenOut=${request.tokenOut}&amount=${request.amountIn}`;
  }

  addRequestData(request: QuoteRequest, options: FetchOptions): void {
    // Add headers, body, or other request options if needed
    options.headers = {
      "Content-Type": "application/json",
      // Add API keys or other headers
    };

    // For POST requests, you can add a body:
    // options.method = 'POST';
    // options.body = JSON.stringify({ ... });
  }

  getOutput(data: any): AggregatorOutput {
    // Parse the API response and return standardized output
    const txData: SwapTransaction | null = data.tx
      ? {
          to: data.tx.to,
          data: data.tx.data,
          value: data.tx.value,
          from: data.tx.from,
        }
      : null;

    return {
      outputAmount: data.amountOut || "0",
      txData: txData,
      routesCount: data.routes?.length || 0,
    };
  }
}
```

2. **Export and register the aggregator** in `src/aggregators/index.ts`:

```typescript
// Add to exports at the top
export { YourAggregator } from "./yourAggregator";

// Add import for factory function
import { YourAggregator } from "./yourAggregator";

// Add case to the createAggregator factory function
export function createAggregator(name: string, baseUrl: string): BaseAggregator {
  switch (name.toLowerCase()) {
    // ... existing cases (madhouseproductionapi, monorail, etc.)

    case "youraggregator":
      return new YourAggregator(name, baseUrl);

    default:
      // Default to MadhouseAggregator for unknown aggregators
      return new MadhouseAggregator(name, baseUrl);
  }
}
```

3. **Add the configuration** in `src/compare.ts`:

```typescript
const ALL_AGGREGATORS: AggregatorConfig[] = [
  // ... existing aggregators
  {
    name: "yourAggregator",
    baseUrl: "https://api.your-aggregator.com/quote",
  },
];
```

## Environment Variables

The script requires several environment variables. Create a `.env` file in the project root:

```bash
# Required: Monad Testnet RPC URL
MONAD_TESTNET_RPC_URL=<your_monad_testnet_rpc_url>

# Required for simulation: Anvil RPC URL (local)
ANVIL_RPC_URL=http://127.0.0.1:8545

# Required for simulation: Test account address
DEFAULT_SENDER_ACCOUNT=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Optional: Gas price configuration
DEFAULT_GAS_PRICE=<your_gas_price>

# API Keys (optional - some aggregators work without API keys)
ZEROX_API_KEY=<zerox_api_key>

# Required for Kuru: Privy authentication token
PRIVY_TOKEN=<privy_token>
```

### Getting API Keys and Tokens

**Kuru (Privy Token):**

Kuru uses Privy authentication and requires a browser-obtained token:

1. Open https://www.kuru.io/swap in your browser
2. Open DevTools (F12) → Console
3. Run: `console.log(document.cookie)`
4. Copy the `privy-token` value
5. Add to `.env`: `PRIVY_TOKEN=<token>`

Note: Privy tokens expire, so you may need to refresh them periodically.

**Eisen Finance:**

- Frontend API: Works without API key (uses public endpoint)
- API Key version: Contact Eisen Finance for API access

**0x Protocol:**

- Testnet API: Generally works with included public key
- Production: Get API key from https://0x.org/

**Other aggregators:**

- Madhouse, Monorail, OpenOcean, Mace, Dirol: No API keys required for testnet

## Scripts

- `bun start` - Run the comparison script (interactive mode)
- `bun start -- --simulation` - Run with transaction simulation enabled
- `bun start -- --random <n>` - Run with n random samples
- `bun start -- --help` - Show help message with all options
- `bun run fork` - Start Anvil fork for simulation
- `bun run lint` - Check code formatting
- `bun run lint:prettier:write` - Auto-format code
- `bun run typecheck` - TypeScript type checking

## Advanced Features

### Dynamic Token Discovery

The script automatically:

- Fetches token symbols and decimals from the blockchain
- Builds a token database on-the-fly from configured pairs
- Retrieves current token prices (in MON and USDC) for accurate amount calculations
- Handles native token (MON) conversions automatically

### Robust Error Handling

- **Automatic Retries**: Failed requests are retried with exponential backoff
- **Timeout Management**: Different timeout thresholds for different operations (2-5 minutes)
- **Intelligent Filtering**: Automatically excludes non-responsive aggregators
- **Graceful Degradation**: Continues testing even if individual aggregators fail
- **Fork Reset Recovery**: Automatically recovers from Anvil fork reset failures

### Simulation Features

When simulation is enabled:

- Automatically sets token balances for the test account
- Resets fork state between tests for consistency
- Simulates actual on-chain execution
- Captures real output amounts from simulated swaps
- Reports detailed simulation errors and reverts
- Tracks reverted transactions separately in results

## Troubleshooting

### "Anvil not found" Error

Install Foundry:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Transaction Simulation Fails

1. Ensure Anvil is running: `bun run fork`
2. Check the RPC URL in `.env`
3. Verify `DEFAULT_SENDER_ACCOUNT` is set correctly
4. Try running without the `--simulation` flag (simulation is disabled by default)
5. Check Anvil logs for errors: `tail -f <anvil-output>`

### API Rate Limits

If you hit rate limits:

1. Reduce the number of test amounts in `src/consts.ts`
2. Use `--random` mode to test fewer combinations
3. Use fewer aggregators in parallel
4. Add delays between tests (modify retry settings in `src/utils/retry.ts`)

### Kuru "PRIVY_TOKEN not set" Error

Follow the Kuru authentication steps in the Environment Variables section to obtain and set your Privy token.

### "Connection refused" or Timeout Errors

1. Check your `MONAD_TESTNET_RPC_URL` is correct and accessible
2. Verify network connectivity
3. The script will automatically retry transient failures
4. For persistent issues, check if the RPC endpoint is rate-limiting

## Development

### Project Structure

```
compare-aggregators-monad/
├── src/
│   ├── compare.ts                    # Main comparison logic and orchestration
│   ├── types.ts                      # TypeScript type definitions
│   ├── consts.ts                     # Constants (token pairs, prices, amounts)
│   ├── utils.ts                      # Core utility functions
│   ├── abis/
│   │   └── erc20.ts                  # ERC20 token ABI
│   ├── utils/                        # Advanced utility modules
│   │   ├── client.ts                 # Robust RPC client utilities with retry logic
│   │   ├── error-recovery.ts         # Comprehensive error handling and recovery
│   │   └── retry.ts                  # Exponential backoff and retry mechanisms
│   └── aggregators/                  # Aggregator implementations
│       ├── index.ts                  # Aggregator factory and exports
│       ├── baseAggregator.ts         # Abstract base class and interfaces
│       ├── madhouseAggregator.ts     # Madhouse aggregator
│       ├── monorailAggregator.ts     # Monorail aggregator
│       ├── openOceanAggregator.ts    # OpenOcean aggregator
│       ├── eisenFinanceAggregator.ts  # Eisen Finance API
│       ├── kuruAggregator.ts         # Kuru aggregator (requires Privy token)
│       ├── maceAggregator.ts         # Mace aggregator
│       ├── dirolAggregator.ts        # Dirol aggregator
│       └── zeroXAggregator.ts        # 0x aggregator
├── scripts/
│   └── sh/
│       └── start-fork.sh             # Anvil fork script
├── comparison_results/               # Output directory (auto-generated)
│   └── DD_MM_YYYY_HH_MM_SS.csv       # Timestamped results
├── .env.example                      # Example environment variables
├── .env                              # Your environment variables (create this)
├── package.json                      # Project dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
├── .prettierignore                   # Prettier ignore patterns
└── README.md                         # This file
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT
