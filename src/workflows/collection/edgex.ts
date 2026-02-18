import { Decimal } from "decimal.js";
import { stepFetchJSON } from "$workflows/shared/fetch";
import type { MarketEntryCreateInput } from "$prisma/models";
import { stepInsertMarketEntries } from "$workflows/shared/db";
import { stepValidateMarkets } from "$workflows/shared/validate";

// edgeX public API url
const E_API_URL = "https://pro.edgex.exchange/api/v1/public";

// `/meta/getMetaData` response subset
type MetaDataResponse = {
	data: {
		contractList: {
			contractId: string;
			contractName: string;
			riskTierList: {
				maxLeverage: string;
			}[];
		}[];
	};
};

// `/quote/getTicker` response
type GetTickerResponse = {
	data: {
		contractName: string;
		value: string;
		lastPrice: string;
		markPrice: string;
		oraclePrice: string;

		// Denominated in contract units
		openInterest: string;
	}[];
};

/**
 * Collects relevant edgeX market data
 */
export async function collectEdgeXMarkets(batchId: string) {
	"use workflow";

	// Fetch all EdgeX contracts
	const {
		data: { contractList: contracts }
	} = await stepFetchJSON<MetaDataResponse>(`${E_API_URL}/meta/getMetaData`);

	// Validate config
	const filteredContracts = await stepValidateMarkets(
		"edgex",
		new Set(contracts.map(({ contractName }) => contractName))
	);

	// Create lookup from contractName
	const nameToMeta = new Map(
		contracts
			// Filter for only relevant contracts so we don't fan-out for all markets
			.filter(({ contractName }) => filteredContracts.has(contractName))
			.map((c) => [
				c.contractName,
				{ id: c.contractId, maxLeverage: Number(c.riskTierList[0].maxLeverage) }
			])
	);

	// Fanout: fetch 24h snapshot data for each filtered relevant market in parallel
	// @dev: note that we can avoid this by grabbing kLine data in bulk via `getMultiContractKline`
	// a la: https://pro.edgex.exchange/api/v1/public/quote/getMultiContractKline?contractIdList=10000278,10000234&klineType=MINUTE_15&filterEndKlineTimeExclusive=1771428659000&priceType=LAST_PRICE&size=100
	// but this will not include open interest data.
	const response = await Promise.all(
		[...nameToMeta.values()].map(({ id }) =>
			stepFetchJSON<GetTickerResponse>(
				`${E_API_URL}/quote/getTicker?period=LAST_DAY_1&contractId=${id}`
			)
		)
	);

	// Iterate over responses
	const rows: MarketEntryCreateInput[] = response.map((resp) => {
		const mkt = resp.data[0];

		// Else, parse row
		return {
			batchId,
			venue: "edgex",
			namespace: "",
			ticker: mkt.contractName,
			refPx: Number(mkt.lastPrice),
			volume: Number(mkt.value),
			oi: new Decimal(mkt.openInterest).mul(new Decimal(mkt.lastPrice)).toNumber(),
			maxLeverage: nameToMeta.get(mkt.contractName)?.maxLeverage ?? 0
		};
	});

	// Insert collected data to database
	await stepInsertMarketEntries(rows);
}
