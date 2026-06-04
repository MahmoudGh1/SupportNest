import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

export async function hashPassword(password: string): Promise<any> {
	return bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS));
}

export async function comparePassword(
	password: string,
	hash: string,
): Promise<any> {
	return bcrypt.compare(password, hash);
}
