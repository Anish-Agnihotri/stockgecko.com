import { authenticatedCronWorkflow } from "$lib/cron";
import { aggregateMarkets } from "$workflows/aggregate";

// Job: collect market data, aggregate, store snapshot
export const GET = authenticatedCronWorkflow(aggregateMarkets);
