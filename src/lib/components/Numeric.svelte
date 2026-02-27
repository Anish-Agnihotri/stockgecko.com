<script module>
	// Setup denominators
	const [BILLION, MILLION, THOUSAND] = [1e9, 1e6, 1e3];

	/**
	 * Format number as US-denominated currency (2 fixed decimals, commas)
	 * @param {number} n to format
	 * @return {string} formatted string
	 */
	function formatNumeric(n: number): string {
		return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	/**
	 * Format number as US-denominated currency but with suffix
	 * @param {number} n to format
	 * @return {string} formatted string
	 */
	export function truncateCurrency(n: number): string {
		const abs = Math.abs(n);
		if (abs >= BILLION) return formatNumeric(n / BILLION) + "B";
		if (abs >= MILLION) return formatNumeric(n / MILLION) + "M";
		if (abs >= THOUSAND) return formatNumeric(n / THOUSAND) + "K";
		return formatNumeric(n);
	}

	/**
	 * Quote currency, normalized by configuration
	 * @param {string} exchange `venue:namespace`
	 * @param {string?} quote optional base quote currency
	 * @param {Record<string, string>?} quotes optional venue-specific currency override
	 */
	export function getNormalizedCurrency(
		exchange: string,
		quote?: string,
		quotes?: Record<string, string>
	): string {
		// If venue-specific quote exists, return indexed
		if (quotes && Object.keys(quotes).includes(exchange)) {
			return quotes[exchange];
		}

		// Otherwise, if base quote exists, return base
		if (quote) return quote;

		// Else, return USD
		return "USD";
	}
</script>

<script lang="ts">
	let {
		value,
		class: extraClass = "",
		currency = null,
		change = false,
		format = "none",
		percentage = false
	}: {
		value: number;
		class?: string;
		currency?: string | null;
		change?: boolean;
		format?: "none" | "numeric" | "currency";
		percentage?: boolean;
	} = $props();

	// Setup currency symbols
	const CURRENCY_SYMBOLS: Record<string, string> = {
		USD: "$",
		EUR: "€",
		HKD: "HK$",
		GBP: "£",
		JPY: "¥",
		CAD: "CA$",
		KRW: "₩",
		CHF: "₣",
		MXN: "MX$"
	};

	/**
	 * Number render based on parameterized options
	 * @param {number} n to format
	 * @return {string} formatted number
	 */
	function formatValue(n: number): string {
		let f: string = "";

		// If positive change, prefix `+`
		if (change && value > 0) f += "+";

		// If currency, prefix based on type
		if (currency) {
			f += CURRENCY_SYMBOLS[currency];
		}

		// Format based on `format` type
		switch (format) {
			case "currency":
				f += truncateCurrency(n);
				break;
			case "numeric":
				f += formatNumeric(n);
				break;
			case "none":
				f += n == 0 ? "-" : n.toString();
				break;
		}

		// If percentage, postfix percentage sign
		if (percentage) f += "%";
		return f;
	}

	// Color render
	const colorClass = $derived(
		// If want to render change + non-0 change
		change && value !== 0
			? // Red/green rendering
				value > 0
				? "text-gecko-green"
				: "text-gecko-red"
			: // Default muted
				"text-gecko-muted"
	);
</script>

<span class="{colorClass} {extraClass}">
	{formatValue(value)}
</span>
