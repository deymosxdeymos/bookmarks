"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createCategoryAction,
	deleteCategoryAction,
} from "@/app/actions/categories";
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

export function useCreateCategory(userId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (name: string) => createCategoryAction({ name }),
		onSuccess: (category) => {
			queryClient.cancelQueries({ queryKey: ["categories", { userId }] });
			queryClient.setQueryData<Category[] | undefined>(
				["categories", { userId }],
				(existing) => {
					if (!existing) return existing;
					return [...existing, category].sort((a, b) =>
						a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
					);
				},
			);
			queryClient.invalidateQueries({ queryKey: ["categories", { userId }] });
			queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
		},
	});
}

export function useDeleteCategory(userId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (categoryId: string) => {
			await deleteCategoryAction(categoryId);
			return categoryId;
		},
		onSuccess: (categoryId) => {
			queryClient.cancelQueries({ queryKey: ["categories", { userId }] });
			queryClient.setQueryData<Category[] | undefined>(
				["categories", { userId }],
				(existing) =>
					existing?.filter((category) => category.id !== categoryId),
			);
			queryClient.invalidateQueries({ queryKey: ["categories", { userId }] });
			queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
		},
	});
}
