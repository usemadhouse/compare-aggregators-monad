import type { QuoteRequest } from "../types";
import { zeroAddress } from "viem";
import { BaseAggregator, type AggregatorOutput, type FetchOptions } from "./baseAggregator";

export class ZeroXAggregator extends BaseAggregator {
  constructor(name: string, baseUrl: string) {
    super(name, baseUrl);

    if (!process.env.ZEROX_API_KEY) {
      console.error(`Error: ZEROX_API_KEY is not set in environment variables.`);
      console.error(`This API key is required for the ${name} aggregator.`);
      console.error(`Please set ZEROX_API_KEY in your .env file.`);
      process.exit(1);
    }
    if (!process.env.DEFAULT_SENDER_ACCOUNT) {
      console.error(`Error: DEFAULT_SENDER_ACCOUNT is not set in environment variables.`);
      console.error(`This account is required for the ${name} aggregator.`);
      console.error(`Please set DEFAULT_SENDER_ACCOUNT in your .env file.`);
      process.exit(1);
    }
  }

  buildQuoteUrl(request: QuoteRequest): string {
    // 0x uses 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee for native tokens
    const sellToken = request.tokenIn === zeroAddress ? "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" : request.tokenIn;
    const buyToken = request.tokenOut === zeroAddress ? "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" : request.tokenOut;

    const params = new URLSearchParams({
      chainId: request.chain.toString(),
      sellToken: sellToken,
      buyToken: buyToken,
      sellAmount: request.amountIn,
      taker: process.env.DEFAULT_SENDER_ACCOUNT || "",
      slippageBps: Math.floor((request.slippage || 0.005) * 10000).toString(),
    });
    return `${this.baseUrl}?${params.toString()}`;
  }

  addRequestData(_request: QuoteRequest, fetchOptions: FetchOptions): void {
    fetchOptions.headers = {
      "0x-api-key": process.env.ZEROX_API_KEY || "",
      "0x-version": "v2",
    };
  }

  getOutput(data: any): AggregatorOutput {
    // 0x format: buyAmount for output, transaction data in top level
    const txData = data.transaction
      ? {
          to: data.transaction.to,
          data: data.transaction.data,
          value: data.transaction.value,
        }
      : null;

    return {
      outputAmount: data.buyAmount || "0",
      txData,
      routesCount: data.route?.fills?.length || 0,
      fullData: data,
    };
  }

  isSimulationSupported(): boolean {
    return true; // 0x provides transaction data for simulation
  }

  isBaseCompareAggregator(): boolean {
    return false; // Not the base aggregator for comparisons
  }
}
