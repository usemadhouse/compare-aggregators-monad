import type { QuoteRequest } from "../types";
import { getAmountInTokenDecimals } from "../utils";
import { BaseAggregator, type AggregatorOutput, type FetchOptions } from "./baseAggregator";

export class DirolAggregator extends BaseAggregator {
  buildQuoteUrl(request: QuoteRequest): string {
    const params = new URLSearchParams({
      inputMint: request.tokenIn,
      outputMint: request.tokenOut,
      amount: getAmountInTokenDecimals(request.amountIn, request.tokenInDecimals),
      slippageBps: Math.floor((request.slippage || 0.005) * 10000).toString(),
      excludeAmms: "",
    });
    return `${this.baseUrl}?${params.toString()}`;
  }

  addRequestData(_request: QuoteRequest, _fetchOptions: FetchOptions): void {
    // Dirol uses GET method, no additional options needed
  }

  getOutput(data: any): AggregatorOutput {
    return {
      outputAmount: data.quote?.outAmount || "0",
      txData: null, // Dirol doesn't provide transaction data in standard format
      routesCount: data.quote?.routePlan?.length || 0,
      fullData: data,
    };
  }

  isSimulationSupported(): boolean {
    return false; // Dirol does not provide transaction data for simulation
  }

  isBaseCompareAggregator(): boolean {
    return false; // Not the base aggregator for comparisons
  }
}
