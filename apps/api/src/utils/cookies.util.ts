import type { CookieOptions } from "express";

const isProd = process.env.NODE_ENV === "production";

export const accessCookieOptions: CookieOptions = {
	httpOnly: true,
	secure: isProd,
	sameSite: isProd ? "none" : "lax",
	maxAge: 1000 * 60 * 15, // 15 minutes
};

export const refreshCookieOptions: CookieOptions = {
	httpOnly: true,
	secure: isProd,
	sameSite: isProd ? "none" : "lax",
	maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};