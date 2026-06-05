import crypto from "crypto";

function generateApiKey() {
	const randomBytes = crypto.randomBytes(32).toString("hex");
	return `"sk_${randomBytes}`;
}

function hashApiKey(apiKey: string) {
	return crypto.createHash("sha256").update(apiKey).digest("hex");
}

export { generateApiKey, hashApiKey };
