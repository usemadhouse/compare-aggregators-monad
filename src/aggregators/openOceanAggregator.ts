import type { QuoteRequest } from "../types";
import { getAmountInTokenDecimals } from "../utils";
import { BaseAggregator, type AggregatorOutput, type FetchOptions } from "./baseAggregator";

export class OpenOceanAggregator extends BaseAggregator {
  constructor(name: string, baseUrl: string) {
    super(name, baseUrl);

    if (!process.env.DEFAULT_GAS_PRICE) {
      console.error(`Error: DEFAULT_GAS_PRICE is not set in environment variables.`);
      console.error(`This gas price is required for the ${name} aggregator.`);
      console.error(`Please set DEFAULT_GAS_PRICE in your .env file.`);
      process.exit(1);
    }
  }

  buildQuoteUrl(request: QuoteRequest): string {
    const params = new URLSearchParams({
      quoteType: "swap",
      inTokenAddress: request.tokenIn,
      outTokenAddress: request.tokenOut,
      amount: getAmountInTokenDecimals(request.amountIn, request.tokenInDecimals),
      gasPrice: process.env.DEFAULT_GAS_PRICE || "1",
      slippage: ((request.slippage || 0.005) * 100).toString(), // Convert to percentage (1 = 1%)
      account: process.env.DEFAULT_SENDER_ACCOUNT || "",
    });
    return `${this.baseUrl}?${params.toString()}`;
  }

  addRequestData(_request: QuoteRequest, _fetchOptions: FetchOptions): void {
    // OpenOcean uses GET method, no additional options needed
  }

  getOutput(data: any): AggregatorOutput {
    // OpenOcean format: data.data contains both output and transaction info
    return {
      outputAmount: data.data?.outAmount || "0",
      txData: data.data
        ? {
            to: data.data.to,
            data: data.data.data,
            value: data.data.value,
          }
        : null, // The data object itself contains to, data, value
      routesCount: 0, // OpenOcean doesn't expose route count in the same way
      fullData: data,
    };
  }

  isSimulationSupported(): boolean {
    return true; // OpenOcean provides transaction data for simulation
  }

  isBaseCompareAggregator(): boolean {
    return false; // Not the base aggregator for comparisons
  }
}
