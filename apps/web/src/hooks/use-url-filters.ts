"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function useUrlFilters() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const updateFilters = (key: string, value: string | number | null) => {
		const params = new URLSearchParams(searchParams.toString());

		if (value === "" || value === null || value === undefined) {
			params.delete(key);
		} else {
			params.set(key, String(value));
		}

		router.replace(`?${params.toString()}`);
	};

	return {
		searchParams,
		updateFilters,
	};
}
