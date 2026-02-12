import { collectMarkets } from "$workflows/collect";
import { authenticatedCronWorkflow } from "$lib/cron";

// Job: collect and store market data
export const GET = authenticatedCronWorkflow(collectMarkets);
