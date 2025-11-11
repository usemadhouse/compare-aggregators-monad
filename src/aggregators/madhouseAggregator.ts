import type { QuoteRequest } from "../types";
import { BaseAggregator, type AggregatorOutput, type FetchOptions } from "./baseAggregator";

export class MadhouseAggregator extends BaseAggregator {
  buildQuoteUrl(request: QuoteRequest): string {
    const params = new URLSearchParams({
      chain: request.chain.toString(),
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      amountIn: request.amountIn,
      slippage: (request.slippage || 0.005).toString(),
    });

    if (request.includePoolInfo !== undefined) {
      params.append("includePoolInfo", request.includePoolInfo.toString());
    }

    return `${this.baseUrl}?${params.toString()}`;
  }

  addRequestData(_request: QuoteRequest, _fetchOptions: FetchOptions): void {
    // Madhouse uses GET method, no additional options needed
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
    return true; // Madhouse provides transaction data for simulation
  }

  isBaseCompareAggregator(): boolean {
    return true; // Madhouse is the base aggregator for comparisons
  }
}
