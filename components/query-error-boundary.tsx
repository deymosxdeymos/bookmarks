"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface State {
	hasError: boolean;
	error?: Error;
}

interface Props {
	children: ReactNode;
	fallback?: (error: Error, retry: () => void) => ReactNode;
}

export class QueryErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("Query error boundary caught an error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError && this.state.error) {
			const retry = () => {
				this.setState({ hasError: false, error: undefined });
			};

			if (this.props.fallback) {
				return this.props.fallback(this.state.error, retry);
			}

			return (
				<div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center">
					<div className="space-y-2">
						<h3 className="text-lg font-semibold">Something went wrong</h3>
						<p className="text-sm text-muted-foreground">
							There was an error loading your data.
						</p>
					</div>
					<Button onClick={retry} variant="outline" size="sm">
						Try again
					</Button>
				</div>
			);
		}

		return this.props.children;
	}
}
