import {
  createTestClient,
  createPublicClient,
  http,
  publicActions,
  walletActions,
  type Chain,
  type TestClient,
  type PublicClient,
  type HttpTransportConfig,
} from "viem";
import { retryWithBackoff } from "./retry";

// Extended timeout configuration
const DEFAULT_TIMEOUT = 120_000; // 120 seconds
const LONG_TIMEOUT = 300_000; // 5 minutes for heavy operations

// HTTP Transport configuration with increased timeouts and retry
export function createRobustHttpTransport(url: string, options: Partial<HttpTransportConfig> = {}) {
  return http(url, {
    timeout: DEFAULT_TIMEOUT,
    retryCount: 3,
    retryDelay: 1000,
    batch: {
      wait: 100, // Wait 100ms before sending batch
      batchSize: 100, // Max 100 requests per batch
    },
    ...options,
  });
}

/**
 * Create a test client with improved error handling and timeouts
 */
export function createRobustTestClient(chain: Chain, rpcUrl: string, options: { timeout?: number } = {}): TestClient {
  const timeout = options.timeout || DEFAULT_TIMEOUT;

  return createTestClient({
    chain,
    mode: "anvil",
    transport: createRobustHttpTransport(rpcUrl, { timeout }),
  })
    .extend(publicActions)
    .extend(walletActions) as TestClient;
}

/**
 * Create a public client with improved error handling and timeouts
 */
export function createRobustPublicClient(
  chain: Chain,
  rpcUrl: string,
  options: { timeout?: number } = {},
): PublicClient {
  const timeout = options.timeout || DEFAULT_TIMEOUT;

  return createPublicClient({
    chain,
    transport: createRobustHttpTransport(rpcUrl, { timeout }),
  });
}

/**
 * Reset fork with retry logic
 */
export async function resetForkWithRetry(
  client: any,
  rpcUrl: string,
  blockNumber: bigint,
  options: { maxAttempts?: number } = {},
): Promise<void> {
  const maxAttempts = options.maxAttempts || 5;

  await retryWithBackoff(
    async () => {
      // Use longer timeout for fork reset
      const resetPromise = client.reset({
        jsonRpcUrl: rpcUrl,
        blockNumber: blockNumber,
      });

      // Add custom timeout for fork reset operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Fork reset timed out after 5 minutes")), LONG_TIMEOUT);
      });

      await Promise.race([resetPromise, timeoutPromise]);
    },
    {
      maxAttempts,
      initialDelay: 2000,
      maxDelay: 60000,
      onRetry: (attempt, error) => {
        console.log(`       Retry attempt ${attempt}/${maxAttempts} for fork reset:`, error.message);
      },
      shouldRetry: (error) => {
        const message = error?.message?.toLowerCase() || "";
        // Always retry fork reset errors unless it's a permanent failure
        return !message.includes("invalid block") && !message.includes("not found");
      },
    },
  );
}

/**
 * Execute a transaction with retry logic
 */
export async function executeTransactionWithRetry(
  client: any,
  transaction: any,
  options: { maxAttempts?: number; timeout?: number } = {},
): Promise<any> {
  const maxAttempts = options.maxAttempts || 3;
  const timeout = options.timeout || DEFAULT_TIMEOUT;

  return retryWithBackoff(
    async () => {
      // Create a promise for the transaction
      const txPromise = client.sendTransaction(transaction);

      // Race against timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Transaction timed out after ${timeout}ms`)), timeout);
      });

      const hash = await Promise.race([txPromise, timeoutPromise]);

      // Wait for receipt with timeout
      const receiptPromise = client.waitForTransactionReceipt({ hash });
      const receiptTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Receipt wait timed out after ${timeout}ms`)), timeout);
      });

      return Promise.race([receiptPromise, receiptTimeoutPromise]);
    },
    {
      maxAttempts,
      initialDelay: 2000,
      maxDelay: 30000,
      onRetry: (attempt, error) => {
        console.log(`       Retry attempt ${attempt}/${maxAttempts} for transaction:`, error.message);
      },
    },
  );
}

/**
 * Call a contract with retry logic
 */
export async function callContractWithRetry(
  client: any,
  request: any,
  options: { maxAttempts?: number; timeout?: number } = {},
): Promise<any> {
  const maxAttempts = options.maxAttempts || 3;
  const timeout = options.timeout || DEFAULT_TIMEOUT;

  return retryWithBackoff(
    async () => {
      const callPromise = client.call(request);

      // Race against timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Contract call timed out after ${timeout}ms`)), timeout);
      });

      return Promise.race([callPromise, timeoutPromise]);
    },
    {
      maxAttempts,
      initialDelay: 1000,
      maxDelay: 15000,
      onRetry: (attempt, error) => {
        console.log(`       Retry attempt ${attempt}/${maxAttempts} for contract call:`, error.message);
      },
    },
  );
}

/**
 * Read contract with retry logic
 */
export async function readContractWithRetry(
  client: any,
  request: any,
  options: { maxAttempts?: number } = {},
): Promise<any> {
  const maxAttempts = options.maxAttempts || 3;

  return retryWithBackoff(() => client.readContract(request), {
    maxAttempts,
    initialDelay: 1000,
    maxDelay: 10000,
    onRetry: (attempt, error) => {
      console.log(`       Retry attempt ${attempt}/${maxAttempts} for contract read:`, error.message);
    },
  });
}

/**
 * Helper to check if Anvil is responding
 */
export async function checkAnvilHealth(rpcUrl: string): Promise<boolean> {
  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "web3_clientVersion",
        params: [],
        id: 1,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data: any = await response.json();
    return !!data.result;
  } catch {
    return false;
  }
}

/**
 * Wait for Anvil to be ready
 */
export async function waitForAnvil(rpcUrl: string, maxWaitTime: number = 30000): Promise<void> {
  const startTime = Date.now();
  const checkInterval = 1000;

  while (Date.now() - startTime < maxWaitTime) {
    const isHealthy = await checkAnvilHealth(rpcUrl);
    if (isHealthy) {
      console.log("       Anvil is ready");
      return;
    }

    console.log("       Waiting for Anvil to be ready...");
    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  throw new Error("Anvil did not become ready within the timeout period");
}
