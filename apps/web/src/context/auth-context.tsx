"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import { api } from "@/lib/api";
import { saveSession, getSession, clearSession } from "@/lib/auth";
import type { AuthUser } from "@/types/types";

interface AuthState {
	user: AuthUser | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<AuthUser>;
	logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const rehydrate = async () => {
			const cached = getSession();
			if (cached) {
				setUser(cached);
				setLoading(false);
				return;
			}
			try {
				const user = await api.getMe();
				setUser(user);
				saveSession(user);
			} catch {
			} finally {
				setLoading(false);
			}
		};
		rehydrate();
	}, []);

	const login = useCallback(async (email: string, password: string) => {
		const data = await api.login(email, password);
		setUser(data.user);
		saveSession(data.user);
		return data.user;
	}, []);

	// const register = useCallback(
	// 	async (formData: {
	// 		email: string;
	// 		password: string;
	// 		firstName: string;
	// 		lastName: string;
	// 	}) => {
	// 		const data = await api.register({
	// 			...formData,
	// 			planId: "fdfb9397-de6b-4977-a9b9-de2610881d8as",
	// 		});
	// 		setUser(data.user);
	// 		saveSession(data.user);
	// 		return data.user;
	// 	},
	// 	[],
	// );

	// const completeOnboarding = useCallback(
	// 	(orgData: { orgId: string; name: string }) => {
	// 		setUser((prev) => {
	// 			if (!prev) return prev;
	// 			const updated = {
	// 				...prev,
	// 				orgId: orgData.orgId,
	// 				orgName: orgData.name,
	// 				onboarded: true,
	// 			};
	// 			saveSession(updated);
	// 			return updated;
	// 		});
	// 	},
	// 	[token],
	// );

	const logout = useCallback(async () => {
		await api.logout();
		setUser(null);
		clearSession();
	}, []);

	return (
		<AuthCtx.Provider value={{ user, loading, login, logout }}>
			{children}
		</AuthCtx.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthCtx);
	if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
	return ctx;
}
