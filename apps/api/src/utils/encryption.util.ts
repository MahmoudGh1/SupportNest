import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
	const key = process.env.ENCRYPTION_KEY;
	if (!key) throw new Error("ENCRYPTION_KEY is not set");
	if (key.length !== 64) throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
	return Buffer.from(key, "hex");
}

export function encrypt(plaintext: string): string {
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

	const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

	const authTag = cipher.getAuthTag();

	return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(encryptedString: string): string {
	const parts = encryptedString.split(":");
	if (parts.length !== 3) throw new Error("Invalid encrypted string format");

	const [ivHex, authTagHex, encryptedHex] = parts;

	const iv = Buffer.from(ivHex, "hex");
	const authTag = Buffer.from(authTagHex, "hex");
	const encryptedData = Buffer.from(encryptedHex, "hex");

	const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
	decipher.setAuthTag(authTag);

	const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

	return decrypted.toString("utf8");
}
