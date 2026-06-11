"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	useRef,
} from "react";
import { api } from "@/lib/api";
import { saveSession, getSession, clearSession } from "@/lib/auth";
import type { AuthUser } from "@/types/types";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

interface AuthState {
	user: AuthUser | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<AuthUser>;
	logout: () => Promise<void>;
	refreshUser: () => Promise<AuthUser | null>;
}

const AuthCtx = createContext<AuthState | null>(null);

async function fetchCurrentUser(): Promise<AuthUser | null> {
	try {
		const user = await api.getMe();
		saveSession(user);
		return user;
	} catch {
		try {
			await api.refreshToken();
			const user = await api.getMe();
			saveSession(user);
			return user;
		} catch {
			clearSession();
			return null;
		}
	}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);
	const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

	const refreshUser = useCallback(async () => {
		const current = await fetchCurrentUser();
		setUser(current);
		return current;
	}, []);

	useEffect(() => {
		const rehydrate = async () => {
			const cached = getSession();
			if (cached) setUser(cached);

			const current = await fetchCurrentUser();
			setUser(current);
			setLoading(false);
		};
		rehydrate();
	}, []);

	useEffect(() => {
		if (!user) {
			if (refreshTimer.current) {
				clearInterval(refreshTimer.current);
				refreshTimer.current = null;
			}
			return;
		}

		const tick = async () => {
			try {
				await api.refreshToken();
				const updated = await api.getMe();
				setUser(updated);
				saveSession(updated);
			} catch {
				setUser(null);
				clearSession();
			}
		};

		refreshTimer.current = setInterval(tick, REFRESH_INTERVAL_MS);
		return () => {
			if (refreshTimer.current) clearInterval(refreshTimer.current);
		};
	}, [user?.id]);

	const login = useCallback(async (email: string, password: string) => {
		await api.login(email, password);
		const current = await api.getMe();
		setUser(current);
		saveSession(current);
		return current;
	}, []);

	const logout = useCallback(async () => {
		await api.logout();
		setUser(null);
		clearSession();
	}, []);

	return (
		<AuthCtx.Provider value={{ user, loading, login, logout, refreshUser }}>
			{children}
		</AuthCtx.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthCtx);
	if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
	return ctx;
}
