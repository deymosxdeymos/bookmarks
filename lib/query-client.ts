"use client";

import { QueryClient } from "@tanstack/react-query";

let queryClient: QueryClient | undefined;

export function getQueryClient() {
	if (typeof window === "undefined") {
		return new QueryClient({
			defaultOptions: {
				queries: {
					staleTime: 60 * 1000,
				},
			},
		});
	}

	if (!queryClient) {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					staleTime: 60 * 1000,
				},
			},
		});
	}

	return queryClient;
}
