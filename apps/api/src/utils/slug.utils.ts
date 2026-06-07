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
