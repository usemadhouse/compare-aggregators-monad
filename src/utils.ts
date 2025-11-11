import { NATIVE_TOKEN_ADDRESS } from "./consts";
import { TOKEN_PRICES_IN_USDC } from "./compare";

// Helper function to wait/sleep for a specified duration
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper function to calculate amountIn from USD amount
export function calculateAmountIn(usdAmount: number, tokenAddress: string, tokenInDecimals: number): BigInt {
  const price = TOKEN_PRICES_IN_USDC[tokenAddress.toLowerCase()] ?? 1.0;
  const tokenAmount = usdAmount * price;
  const amountIn = BigInt(Math.floor(tokenAmount * 10 ** tokenInDecimals));
  return amountIn;
}

export function getAmountInTokenDecimals(amountIn: string, tokenInDecimals: number): string {
  return (BigInt(amountIn) / BigInt(10 ** tokenInDecimals)).toString();
}

// Helper function to generate timestamped filename
export function generateOutputFilename(outputDir: string): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${outputDir}/${day}_${month}_${year}_${hours}_${minutes}_${seconds}.csv`;
}

// Helper function to check if token is native
export function isNativeToken(tokenAddress: string): boolean {
  return tokenAddress === NATIVE_TOKEN_ADDRESS;
}
