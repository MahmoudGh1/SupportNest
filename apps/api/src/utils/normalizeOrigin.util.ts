const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

const ALLOW_LOOPBACK_ALIASES = process.env.NODE_ENV !== "production";

export function normalizeOrigin(
	origin: string | undefined | null,
): string | null {
	if (!origin) return null;
	try {
		const url = new URL(origin);
		const hostname =
			ALLOW_LOOPBACK_ALIASES && LOOPBACK_HOSTS.has(url.hostname)
				? "localhost"
				: url.hostname.toLowerCase();
		const port = url.port ? `:${url.port}` : "";
		return `${url.protocol}//${hostname}${port}`;
	} catch {
		return null;
	}
}
