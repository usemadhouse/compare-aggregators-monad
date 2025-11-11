import type { QuoteRequest } from "../types";
import { zeroAddress } from "viem";
import { BaseAggregator, type AggregatorOutput, type FetchOptions } from "./baseAggregator";

export class EisenFinanceAggregator extends BaseAggregator {
  constructor(name: string, baseUrl: string) {
    super(name, baseUrl);

    if (!process.env.DEFAULT_SENDER_ACCOUNT) {
      console.error(`Error: DEFAULT_SENDER_ACCOUNT is not set in environment variables.`);
      console.error(`This account is required for the ${name} aggregator.`);
      console.error(`Please set DEFAULT_SENDER_ACCOUNT in your .env file.`);
      process.exit(1);
    }
  }

  buildQuoteUrl(_request: QuoteRequest): string {
    return this.baseUrl;
  }

  addRequestData(request: QuoteRequest, fetchOptions: FetchOptions): void {
    fetchOptions.method = "POST";
    fetchOptions.headers = {
      "Content-Type": "application/json",
    };
    fetchOptions.body = JSON.stringify({
      tokenInAddr: request.tokenIn === zeroAddress ? "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" : request.tokenIn,
      tokenOutAddr: request.tokenOut === zeroAddress ? "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" : request.tokenOut,
      from: process.env.DEFAULT_SENDER_ACCOUNT || "",
      amount: request.amountIn,
      maxEdge: "3",
      maxSplit: "3",
      withCycle: false,
    });
  }

  getOutput(data: any): AggregatorOutput {
    return {
      outputAmount: data.result?.dexAgg?.expectedAmountOut || "0",
      txData: null, // Transaction data not provided in this API version
      routesCount: data.result?.dexAgg?.splitInfos?.length || 0,
      fullData: data,
    };
  }

  isSimulationSupported(): boolean {
    return false; // EisenFinance does not provide transaction data for simulation
  }

  isBaseCompareAggregator(): boolean {
    return false; // Not the base aggregator for comparisons
  }
}
