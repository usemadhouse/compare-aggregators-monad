import type { QuoteRequest } from "../types";
import { BaseAggregator, type AggregatorOutput, type FetchOptions } from "./baseAggregator";

export class KuruAggregator extends BaseAggregator {
  constructor(name: string, baseUrl: string) {
    super(name, baseUrl);

    // Kuru uses Privy authentication - need PRIVY_TOKEN from browser
    if (!process.env.PRIVY_TOKEN) {
      console.error(`Error: PRIVY_TOKEN is not set in environment variables.`);
      console.error(`Kuru uses Privy authentication. To get the token:`);
      console.error(`1. Open https://www.kuru.io/swap in your browser`);
      console.error(`2. Open DevTools (F12) → Console`);
      console.error(`3. Run: console.log(document.cookie)`);
      console.error(`4. Copy the privy-token value and add to .env: PRIVY_TOKEN=<token>`);
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
      Cookie: `privy-token=${process.env.PRIVY_TOKEN}`,
      Origin: "https://www.kuru.io",
      Referer: "https://www.kuru.io/",
    };
    fetchOptions.body = JSON.stringify({
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      amount: request.amountIn,
      autoSlippage: false,
      slippageTolerance: Math.floor((request.slippage || 0.005) * 10000), // Convert to basis points
    });
  }

  getOutput(data: any): AggregatorOutput {
    // Kuru format: nested data structure
    const kuruTx = data.data?.data?.transaction;
    const txData = kuruTx
      ? {
          to: kuruTx.to,
          data: "0x" + kuruTx.calldata,
          value: kuruTx.value,
        }
      : null;

    // Count total pools across all hops
    const hops = data.data?.data?.path?.hops || [];
    const routesCount = hops.reduce((total: number, hop: any) => total + (hop.pools?.length || 0), 0);

    return {
      outputAmount: data.data?.data?.output || "0",
      txData,
      routesCount,
      fullData: data,
    };
  }

  isSimulationSupported(): boolean {
    return true; // Kuru provides transaction data for simulation
  }

  isBaseCompareAggregator(): boolean {
    return false; // Not the base aggregator for comparisons
  }
}
