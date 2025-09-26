"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { getQueryClient } from "@/lib/query-client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
	const queryClient = getQueryClient();

	return (
		<QueryClientProvider client={queryClient}>
			<QueryErrorBoundary>{children}</QueryErrorBoundary>
		</QueryClientProvider>
	);
}
