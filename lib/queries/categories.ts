"use client";

import { useQuery } from "@tanstack/react-query";
import type { Category } from "@/lib/schemas";

async function fetchCategories(): Promise<Category[]> {
	const response = await fetch("/api/categories", {
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch categories: ${response.statusText}`);
	}

	return response.json();
}

export function useCategories(userId: string) {
	return useQuery({
		queryKey: ["categories", { userId }],
		queryFn: fetchCategories,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
}
