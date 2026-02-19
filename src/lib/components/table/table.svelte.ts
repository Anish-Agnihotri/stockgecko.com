/**
 * Table column definition
 */
export type Column<K> = {
	// Column title
	title: string;
	// Optional column width (none: full width)
	width: number | null;
	// Optional sort key (null: not sortable)
	sortKey: K | null;
};

/**
 * Creates reactive sort state with toggle behaviour:
 *  1. Clicking the active column reverses direction
 *  2. Clicking a new column sets it as descending
 * @param {K} initKey initially sorted column key
 * @param {-1 | 1} initDirection initially sorted direction
 * @returns sort state helpers
 */
export function createSortState<K>(initKey: K, initDirection: -1 | 1 = -1) {
	let sortKey = $state(initKey);
	let sortDirection: -1 | 1 = $state(initDirection);

	/**
	 * Toggle column sort direction
	 * @param {K} key to sort on
	 */
	function toggle(key: K) {
		if (sortKey == key) {
			// Reverse direction
			sortDirection *= -1;
		} else {
			// Else, set new sort key
			sortKey = key;
			sortDirection = -1;
		}
	}

	return {
		get key() {
			return sortKey;
		},
		get direction() {
			return sortDirection;
		},
		toggle
	};
}

/**
 * Generic sort over table rows
 * @dev Handles numeric and string sort
 */
export function sortRows<T, K>(
	items: T[],
	getValue: (item: T, key: K) => string | number,
	key: K,
	direction: 1 | -1
): T[] {
	return [...items].sort((a, b) => {
		// Gets value by sort key
		const valA = getValue(a, key);
		const valB = getValue(b, key);

		// Compares values
		const cmp =
			typeof valA === "string"
				? (valA as string).localeCompare(valB as string)
				: (valA as number) - (valB as number);

		// Returns values with correct sort direction
		return cmp * direction;
	});
}
