"use client";

import { QueryClient } from "@tanstack/react-query";

let queryClient: QueryClient | undefined;

type QueryError = {
	status?: number;
};

export function getQueryClient() {
	if (typeof window === "undefined") {
		return new QueryClient({
			defaultOptions: {
				queries: {
					staleTime: 60 * 1000,
					gcTime: 10 * 60 * 1000,
					refetchOnWindowFocus: true,
					refetchOnReconnect: true,
					retry: (failureCount, error: unknown) => {
						const queryError = error as QueryError;
						if (queryError?.status === 401 || queryError?.status === 403)
							return false;
						return failureCount < 3;
					},
				},
				mutations: {
					retry: false,
				},
			},
		});
	}

	if (!queryClient) {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					staleTime: 60 * 1000,
					gcTime: 10 * 60 * 1000,
					refetchOnWindowFocus: true,
					refetchOnReconnect: true,
					retry: (failureCount, error: unknown) => {
						const queryError = error as QueryError;
						if (queryError?.status === 401 || queryError?.status === 403)
							return false;
						return failureCount < 3;
					},
				},
				mutations: {
					retry: false,
				},
			},
		});
	}

	return queryClient;
}
