import { mapApiUser } from "@/lib/map-user";
import type { AuthUser, LoginResponse } from "@/types/types";
import { BASE_URL } from "./client";

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function login(
	email: string,
	password: string,
): Promise<LoginResponse> {
	const res = await fetch(`${BASE_URL}/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
		credentials: "include",
	});
	const data = await res.json();
	if (!res.ok) {
		const err = new Error(
			data.error ?? data.message ?? "Login failed",
		) as Error & {
			code?: string;
			userId?: string;
		};
		err.code = data.code;
		err.userId = data.userId;
		throw err;
	}
	return { user: mapApiUser(data.result) };
}

export async function register(data: {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	businessName: string;
	planId: string;
}): Promise<LoginResponse> {
	const res = await fetch(`${BASE_URL}/auth/register`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
		credentials: "include",
	});
	const body = await res.json();
	if (!res.ok) throw new Error(body.error ?? "Registration failed");
	return body;
}

export async function registerInitial(data: {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
}): Promise<{ userId: string; email: string; alreadyExists: boolean }> {
	const res = await fetch(`${BASE_URL}/auth/register`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
		credentials: "include",
	});
	const body = await res.json();
	if (!res.ok) throw new Error(body.error ?? "Registration failed");
	return body;
}

export async function registerPaid(data: {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	businessName: string;
	planId: string;
	amount: number;
	currency?: string;
	isAnnual: boolean;
}): Promise<LoginResponse> {
	const res = await fetch(`${BASE_URL}/auth/register-paid`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
		credentials: "include",
	});
	const body = await res.json();
	if (!res.ok) throw new Error(body.error ?? "Checkout registration failed");
	return { user: mapApiUser(body.result) };
}

export async function registerWithGoogle(
	idToken: string,
): Promise<{ userId: string; email: string; isNewUser: boolean }> {
	console.log(BASE_URL);
	const res = await fetch(`${BASE_URL}/auth/google-register`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ idToken }),
		credentials: "include",
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.error ?? "Google registration failed");
	return data;
}

export async function loginWithGoogle(
	idToken: string,
): Promise<LoginResponse> {
	const res = await fetch(`${BASE_URL}/auth/google`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ idToken }),
		credentials: "include",
	});
	const data = await res.json();
	if (!res.ok)
		throw new Error(data.error ?? data.message ?? "Google login failed");
	return { user: mapApiUser(data.result) };
}

export async function sendVerification(
	userId: string,
	email: string,
): Promise<void> {
	const res = await fetch(`${BASE_URL}/auth/send-verification`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ userId, email }),
		credentials: "include",
	});
	const body = await res.json();
	if (!res.ok)
		throw new Error(body.error ?? "Failed to send verification code");
}

export async function verifyEmail(
	userId: string,
	code: string,
): Promise<void> {
	const res = await fetch(`${BASE_URL}/auth/verify-email`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ userId, code }),
		credentials: "include",
	});
	const body = await res.json();
	if (!res.ok) throw new Error(body.error ?? "Invalid or expired code");
}

export async function completeRegistration(data: {
	userId: string;
	businessName: string;
	planId: string;
	amount: number;
	currency?: string;
	isAnnual: boolean;
}): Promise<LoginResponse> {
	const res = await fetch(`${BASE_URL}/auth/complete-registration`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
		credentials: "include",
	});
	const body = await res.json();
	if (!res.ok)
		throw new Error(body.error ?? "Failed to complete registration");
	return { user: mapApiUser(body.result) };
}

export async function getMe(): Promise<AuthUser> {
	const res = await fetch(`${BASE_URL}/auth/me`, { credentials: "include" });
	if (!res.ok) throw new Error("No active session");
	const data = await res.json();
	return mapApiUser(data.result);
}

export async function refreshToken(): Promise<void> {
	const res = await fetch(`${BASE_URL}/auth/refresh`, {
		method: "POST",
		credentials: "include",
	});
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new Error(data.error ?? "Session expired");
	}
}

export async function forgotPassword(email: string): Promise<void> {
	const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email }),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.error ?? "Failed to send reset email");
}

export async function resetPassword(
	token: string,
	newPassword: string,
): Promise<void> {
	const res = await fetch(`${BASE_URL}/auth/reset-password`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ token, newPassword }),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.error ?? "Failed to reset password");
}

export async function logout(): Promise<void> {
	await fetch(`${BASE_URL}/auth/logout`, {
		method: "POST",
		credentials: "include",
	});
}
