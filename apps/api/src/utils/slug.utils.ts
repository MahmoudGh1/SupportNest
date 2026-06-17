/**
 * Converts a business name into a URL-friendly slug.
 *
 * @param name - The original business name.
 * @returns The slugified string.
 */
export default function slugify(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-");
}

export function sanitizeForStoragePath(input: string): string {
	return input
		.normalize("NFKD") // split accented chars from their diacritics
		.replace(/[\u0300-\u036f]/g, "") // strip diacritics
		.replace(/[^a-zA-Z0-9-_ ]/g, "") // drop anything not alphanumeric/dash/underscore/space
		.trim()
		.replace(/\s+/g, "-") // spaces -> dashes
		.toLowerCase()
		.slice(0, 100); // cap length
}
