"use client";

import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs: number): T {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		if (delayMs <= 0) {
			setDebouncedValue(value);
			return;
		}
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delayMs);
		return () => {
			clearTimeout(timer);
		};
	}, [value, delayMs]);

	return debouncedValue;
}
