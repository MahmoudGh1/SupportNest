import crypto from "crypto";

function generateApiKey() {
	const randomBytes = crypto.randomBytes(32).toString("hex");
	return `sk_${randomBytes}`;
}

function hashApiKey(apiKey: string) {
	return crypto.createHash("sha256").update(apiKey).digest("hex");
}

function generateInviteToken(): string {
	const randomBytes = crypto.randomBytes(32).toString("hex");
	return `${randomBytes}`
}

function generateResetToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

export { generateApiKey, hashApiKey, generateInviteToken, generateResetToken };
