import meta from "$config/meta.json";
import type { Thing, WithContext, Organization, BreadcrumbList } from "schema-dts";

// Setup schema.org type
export type Schema = Thing | WithContext<Thing> | WithContext<Thing>[];

/**
 * Serializes schema.org typed definition to injected application/ld+json string
 * @param {Schema} thing schema
 */
export const serializeSchema = (thing: Schema): string => {
	return `<script type="application/ld+json">${JSON.stringify(thing, null, 2)}</script>`;
};

// Default schema (organization)
export const DEFAULT_SCHEMA: [WithContext<Organization>, WithContext<BreadcrumbList>] = [
	{
		"@context": "https://schema.org",
		"@type": "Organization",
		url: meta.url,
		name: meta.title,
		description: meta.description,
		logo: meta.favicon
	},
	{
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{ "@type": "ListItem", position: 1, name: "Home", item: meta.url },
			{ "@type": "ListItem", position: 1, name: "Markets", item: `${meta.url}/markets` },
			{ "@type": "ListItem", position: 1, name: "Venues", item: `${meta.url}/venues` }
		]
	}
];
