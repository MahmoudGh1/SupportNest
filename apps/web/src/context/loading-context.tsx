"use client";

import { createContext, useContext, useCallback, useRef, useState } from "react";

interface LoadingState {
	show: () => void;
	hide: () => void;
	isLoading: boolean;
}

const LoadingCtx = createContext<LoadingState | null>(null);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
	const [isLoading, setIsLoading] = useState(false);
	const counter = useRef(0);

	const show = useCallback(() => {
		counter.current += 1;
		setIsLoading(true);
	}, []);

	const hide = useCallback(() => {
		counter.current = Math.max(0, counter.current - 1);
		if (counter.current === 0) setIsLoading(false);
	}, []);

	return (
		<LoadingCtx.Provider value={{ show, hide, isLoading }}>
			{children}
		</LoadingCtx.Provider>
	);
}

export function useLoading() {
	const ctx = useContext(LoadingCtx);
	if (!ctx) throw new Error("useLoading must be used inside <LoadingProvider>");
	return ctx;
}