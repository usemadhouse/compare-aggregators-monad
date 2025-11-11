import type { QuoteRequest } from "../types";
import { getAmountInTokenDecimals } from "../utils";
import { BaseAggregator, type AggregatorOutput, type FetchOptions } from "./baseAggregator";

export class MonorailAggregator extends BaseAggregator {
  constructor(name: string, baseUrl: string) {
    super(name, baseUrl);

    if (!process.env.DEFAULT_SENDER_ACCOUNT) {
      console.error(`Error: DEFAULT_SENDER_ACCOUNT is not set in environment variables.`);
      console.error(`This account is required for the ${name} aggregator.`);
      console.error(`Please set DEFAULT_SENDER_ACCOUNT in your .env file.`);
      process.exit(1);
    }
  }

  buildQuoteUrl(request: QuoteRequest): string {
    const params = new URLSearchParams({
      source: "TestApp", // App ID
      sender: process.env.DEFAULT_SENDER_ACCOUNT || "",
      from: request.tokenIn,
      to: request.tokenOut,
      amount: getAmountInTokenDecimals(request.amountIn, request.tokenInDecimals),
      max_slippage: Math.floor((request.slippage || 0.005) * 10000).toString(), // Convert to basis points
    });
    return `${this.baseUrl}?${params.toString()}`;
  }

  addRequestData(_request: QuoteRequest, _fetchOptions: FetchOptions): void {
    // Monorail uses GET method, no additional options needed
  }

  getOutput(data: any): AggregatorOutput {
    return {
      outputAmount: data.output || data.amountOut || "0",
      txData: data.transaction || data.tx || null,
      routesCount: data.routes?.length || data.hops || 0,
      fullData: data,
    };
  }

  isSimulationSupported(): boolean {
    return true; // Monorail provides transaction data for simulation
  }

  isBaseCompareAggregator(): boolean {
    return false; // Not the base aggregator for comparisons
  }
}
