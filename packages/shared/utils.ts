export function formatDate(date: Date | string | number): string {
	return new Date(date).toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

export function capitalize(str: string): string {
	if (!str) return "";
	return str.charAt(0).toUpperCase() + str.slice(1);
}
