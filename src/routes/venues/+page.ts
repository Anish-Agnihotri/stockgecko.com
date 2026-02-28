import type { DiffedSnapshot } from "@/transform";
import type { PageLoad } from "./$types";
import exchanges from "$config/exchanges.json";

export const load: PageLoad = async ({ fetch }) => {
	const data = await fetch("/api/snapshot");
	const snapshot: DiffedSnapshot = await data.json();

	const venues = snapshot.aggregates.exchangeStats.map((x) => ({
		...x,
		...exchanges[x.id as keyof typeof exchanges]
	}));

	return { venues };
};
