// Export base class and interfaces
export { BaseAggregator, type AggregatorOutput, type FetchOptions } from "./baseAggregator";

// Export all aggregator classes
export { MadhouseAggregator } from "./madhouseAggregator";
export { MonorailAggregator } from "./monorailAggregator";
export { OpenOceanAggregator } from "./openOceanAggregator";
export { EisenFinanceAggregator } from "./eisenFinanceAggregator";
export { KuruAggregator } from "./kuruAggregator";
export { MaceAggregator } from "./maceAggregator";
export { DirolAggregator } from "./dirolAggregator";
export { ZeroXAggregator } from "./zeroXAggregator";

// Import for factory function
import { BaseAggregator } from "./baseAggregator";
import { MadhouseAggregator } from "./madhouseAggregator";
import { MonorailAggregator } from "./monorailAggregator";
import { OpenOceanAggregator } from "./openOceanAggregator";
import { EisenFinanceAggregator } from "./eisenFinanceAggregator";
import { KuruAggregator } from "./kuruAggregator";
import { MaceAggregator } from "./maceAggregator";
import { DirolAggregator } from "./dirolAggregator";
import { ZeroXAggregator } from "./zeroXAggregator";

// Factory function to create aggregators
export function createAggregator(name: string, baseUrl: string): BaseAggregator {
  switch (name.toLowerCase()) {
    case "madhouse":
      return new MadhouseAggregator(name, baseUrl);

    case "monorail":
      return new MonorailAggregator(name, baseUrl);

    case "openocean":
      return new OpenOceanAggregator(name, baseUrl);

    case "eisenfinance":
    case "eisen":
      return new EisenFinanceAggregator(name, baseUrl);

    case "kuru":
      return new KuruAggregator(name, baseUrl);

    case "mace":
      return new MaceAggregator(name, baseUrl);

    case "dirol":
      return new DirolAggregator(name, baseUrl);

    case "0x":
      return new ZeroXAggregator(name, baseUrl);

    default:
      // Default to Madhouse aggregator for unknown aggregators
      return new MadhouseAggregator(name, baseUrl);
  }
}
