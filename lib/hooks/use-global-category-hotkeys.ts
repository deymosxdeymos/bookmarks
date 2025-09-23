"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Category } from "@/lib/schemas";

const HOTKEY_SEQUENCE = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

interface UseGlobalCategoryHotkeysOptions {
	categories: Category[];
	onCategoryChange: (categoryId: string | null) => void;
	enabled?: boolean;
}

export function useGlobalCategoryHotkeys({
	categories,
	onCategoryChange,
	enabled = true,
}: UseGlobalCategoryHotkeysOptions) {
	const totalCount = useMemo(() => {
		return categories.reduce(
			(sum, category) => sum + (category.bookmarkCount ?? 0),
			0,
		);
	}, [categories]);

	const options = useMemo(() => {
		return [
			{
				id: null,
				name: "All" as const,
				color: undefined,
				bookmarkCount: totalCount,
			},
			...categories,
		];
	}, [categories, totalCount]);

	const optionHotkeys = useMemo(() => {
		return options.map((option, index) => ({
			categoryId: option.id ?? null,
			hotkey: index < HOTKEY_SEQUENCE.length ? HOTKEY_SEQUENCE[index] : null,
		}));
	}, [options]);

	// Store latest values in refs to avoid recreating keyboard handler
	const optionHotkeysRef = useRef(optionHotkeys);
	const onCategoryChangeRef = useRef(onCategoryChange);

	useEffect(() => {
		optionHotkeysRef.current = optionHotkeys;
		onCategoryChangeRef.current = onCategoryChange;
	}, [optionHotkeys, onCategoryChange]);

	// Create stable keyboard handler that uses refs to access latest values
	const globalHotkeyHandler = useCallback(
		(event: KeyboardEvent) => {
			if (!enabled) return;
			if (event.defaultPrevented || event.isComposing) return;
			if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
				return;
			}

			const target = event.target;
			if (target instanceof HTMLElement) {
				if (target.isContentEditable) return;
				const tagName = target.tagName;
				if (
					tagName === "INPUT" ||
					tagName === "TEXTAREA" ||
					tagName === "SELECT"
				) {
					return;
				}
			}

			const pressed = event.key;
			const binding = optionHotkeysRef.current.find(
				(entry) => entry.hotkey === pressed,
			);
			if (!binding || binding.hotkey == null) {
				return;
			}

			event.preventDefault();
			onCategoryChangeRef.current(binding.categoryId);
		},
		[enabled],
	);

	useEffect(() => {
		if (!enabled) return;

		document.addEventListener("keydown", globalHotkeyHandler);
		return () => document.removeEventListener("keydown", globalHotkeyHandler);
	}, [globalHotkeyHandler, enabled]);
}
