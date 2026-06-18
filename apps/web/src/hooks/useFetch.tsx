"use client";

import { useCallback } from "react";
import { useLoading } from "@/context/loading-context";

export function useFetch() {
	const { show, hide } = useLoading();

	const fetchWithSpinner = useCallback(
		async <T,>(fn: () => Promise<T>): Promise<T> => {
			show();
			try {
				return await fn();
			} finally {
				hide();
			}
		},
		[show, hide],
	);

	return fetchWithSpinner;
}