import type { QuoteRequest, SwapTransaction } from "../types";

export interface AggregatorOutput {
  outputAmount: string;
  txData: SwapTransaction | null;
  routesCount: number;
  fullData: any; // Full response data from the aggregator
}

export interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export abstract class BaseAggregator {
  constructor(
    public readonly name: string,
    public readonly baseUrl: string,
  ) {}

  abstract buildQuoteUrl(request: QuoteRequest): string;

  abstract addRequestData(request: QuoteRequest, fetchOptions: FetchOptions): void;

  abstract getOutput(data: any): AggregatorOutput;

  /**
   * Indicates whether this aggregator supports simulation.
   * Aggregators that return transaction data (txData) in their output
   * can be simulated. Others cannot.
   * Override this method in each aggregator implementation.
   */
  abstract isSimulationSupported(): boolean;

  /**
   * Indicates whether this aggregator is the base for comparison.
   * When true, this aggregator's quotes will be used as the baseline
   * to compare against all other aggregators.
   * Override this method in each aggregator implementation.
   */
  abstract isBaseCompareAggregator(): boolean;
}
