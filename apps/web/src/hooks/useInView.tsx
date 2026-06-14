import { useRef } from "react";

/** Lightweight stub — avoids IntersectionObserver cost; content renders immediately. */
export function useInView(_threshold = 0.12) {
	const ref = useRef<HTMLDivElement>(null);
	return { ref, visible: true };
}
