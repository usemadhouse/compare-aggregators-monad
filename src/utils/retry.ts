import { sleep } from "../utils";

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, "shouldRetry" | "onRetry">> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

// Default error checker - retry on timeout and network errors
const defaultShouldRetry = (error: any): boolean => {
  const errorMessage = error?.message?.toLowerCase() || "";
  const errorDetails = error?.details?.toLowerCase() || "";

  // Retry on timeout errors
  if (errorMessage.includes("timeout") || errorDetails.includes("timeout")) {
    return true;
  }

  // Retry on connection errors
  if (errorMessage.includes("econnrefused") || errorMessage.includes("econnreset")) {
    return true;
  }

  // Retry on rate limit errors
  if (errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
    return true;
  }

  // Retry on temporary network errors
  if (errorMessage.includes("network") || errorMessage.includes("fetch failed")) {
    return true;
  }

  // Retry on "Block requested not found" errors (transient RPC sync issues)
  if (errorMessage.includes("block requested not found") || errorDetails.includes("block requested not found")) {
    return true;
  }

  // Don't retry on explicit revert errors or other permanent failures
  if (errorMessage.includes("revert") && !errorMessage.includes("timeout")) {
    return false;
  }

  return false;
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const opts = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
    shouldRetry: options.shouldRetry || defaultShouldRetry,
  };

  let lastError: any;
  let delay = opts.initialDelay;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === opts.maxAttempts || !opts.shouldRetry(error)) {
        throw error;
      }

      // Call retry callback if provided
      if (opts.onRetry) {
        opts.onRetry(attempt, error);
      }

      // Wait with exponential backoff
      await sleep(delay);

      // Calculate next delay with backoff
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  throw lastError;
}

/**
 * Create a timeout wrapper for async functions
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = "Operation timed out",
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs)),
  ]);
}

/**
 * Batch operations with rate limiting
 */
export async function batchWithRateLimit<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  options: {
    batchSize?: number;
    delayBetweenBatches?: number;
    delayBetweenItems?: number;
  } = {},
): Promise<R[]> {
  const { batchSize = 5, delayBetweenBatches = 1000, delayBetweenItems = 100 } = options;

  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    // Process batch items sequentially with delay
    for (const item of batch) {
      try {
        const result = await operation(item);
        results.push(result);

        if (delayBetweenItems > 0) {
          await sleep(delayBetweenItems);
        }
      } catch (error) {
        console.error("Batch operation failed:", error);
        throw error;
      }
    }

    // Delay between batches
    if (i + batchSize < items.length && delayBetweenBatches > 0) {
      await sleep(delayBetweenBatches);
    }
  }

  return results;
}
