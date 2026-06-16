import bcrypt from "bcrypt";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });


export async function hashPassword(password: string): Promise<any> {
	return bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS));
}

export async function comparePassword(password: string, hash: string): Promise<any> {
	return bcrypt.compare(password, hash);
}

export async function generateSecret(length: number): Promise<any> {
	return crypto.randomBytes(length).toString("hex");
}
