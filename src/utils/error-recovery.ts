export interface ErrorRecoveryOptions {
  maxGlobalRetries?: number;
  onError?: (error: any, context: string) => void;
  onRecovery?: (context: string) => void;
  continueOnError?: boolean;
}

/**
 * Wraps an async operation with comprehensive error recovery
 */
export async function withErrorRecovery<T>(
  operation: () => Promise<T>,
  context: string,
  options: ErrorRecoveryOptions = {},
): Promise<T | null> {
  const {
    maxGlobalRetries = 3,
    onError = (error, ctx) => console.error(`Error in ${ctx}:`, error.message),
    onRecovery = (ctx) => console.log(`Recovering from error in ${ctx}...`),
    continueOnError = true,
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxGlobalRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      onError(error, context);

      // Check if error is recoverable
      if (!isRecoverableError(error)) {
        if (continueOnError) {
          console.error(`Non-recoverable error in ${context}, continuing...`);
          return null;
        }
        throw error;
      }

      if (attempt < maxGlobalRetries) {
        onRecovery(context);
        // Exponential backoff between global retries
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  if (continueOnError) {
    console.error(`Failed after ${maxGlobalRetries} attempts in ${context}, continuing...`);
    return null;
  }

  throw lastError;
}

/**
 * Check if an error is recoverable
 */
function isRecoverableError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || "";

  // Unrecoverable errors
  const unrecoverablePatterns = [
    "insufficient funds",
    "invalid signature",
    "unauthorized",
    "forbidden",
    "invalid api key",
    "malformed",
    "syntaxerror",
    "typeerror",
    "referenceerror",
  ];

  for (const pattern of unrecoverablePatterns) {
    if (errorMessage.includes(pattern)) {
      return false;
    }
  }

  // Recoverable errors
  const recoverablePatterns = [
    "timeout",
    "network",
    "econnrefused",
    "econnreset",
    "rate limit",
    "too many requests",
    "temporary",
    "service unavailable",
    "bad gateway",
    "gateway timeout",
  ];

  for (const pattern of recoverablePatterns) {
    if (errorMessage.includes(pattern)) {
      return true;
    }
  }

  // Default to recoverable for unknown errors
  return true;
}

/**
 * Process items with error recovery for each item
 */
export async function processWithRecovery<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: {
    continueOnItemError?: boolean;
    maxConcurrent?: number;
    onItemError?: (item: T, error: any, index: number) => void;
    onItemSuccess?: (item: T, result: R, index: number) => void;
  } = {},
): Promise<Array<{ success: boolean; item: T; result?: R; error?: any }>> {
  const { continueOnItemError = true, maxConcurrent = 1, onItemError = () => {}, onItemSuccess = () => {} } = options;

  const results: Array<{ success: boolean; item: T; result?: R; error?: any }> = [];

  if (maxConcurrent === 1) {
    // Sequential processing
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const result = await processor(item, i);
        results.push({ success: true, item, result });
        onItemSuccess(item, result, i);
      } catch (error: any) {
        onItemError(item, error, i);
        if (continueOnItemError) {
          results.push({ success: false, item, error });
        } else {
          throw error;
        }
      }
    }
  } else {
    // Concurrent processing with limit
    const queue = [...items.map((item, index) => ({ item, index }))];
    const inProgress = new Set<Promise<void>>();

    while (queue.length > 0 || inProgress.size > 0) {
      // Start new tasks up to the concurrent limit
      while (queue.length > 0 && inProgress.size < maxConcurrent) {
        const { item, index } = queue.shift()!;

        const task = processor(item, index)
          .then((result) => {
            results[index] = { success: true, item, result };
            onItemSuccess(item, result, index);
          })
          .catch((error) => {
            onItemError(item, error, index);
            if (continueOnItemError) {
              results[index] = { success: false, item, error };
            } else {
              throw error;
            }
          })
          .finally(() => {
            inProgress.delete(task);
          });

        inProgress.add(task);
      }

      // Wait for at least one task to complete
      if (inProgress.size > 0) {
        await Promise.race(inProgress);
      }
    }
  }

  return results;
}

/**
 * Create a graceful shutdown handler
 */
export function setupGracefulShutdown(cleanup: () => Promise<void>): void {
  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    console.log(`\nReceived ${signal}, shutting down gracefully...`);

    try {
      await cleanup();
      console.log("Cleanup completed successfully");
      process.exit(0);
    } catch (error) {
      console.error("Error during cleanup:", error);
      process.exit(1);
    }
  };

  // Handle different termination signals
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Handle uncaught errors
  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    shutdown("unhandledRejection");
  });
}
