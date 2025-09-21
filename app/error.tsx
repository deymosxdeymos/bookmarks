"use client";
import { useEffect } from "react";

export default function AppError({
	error,
}: {
	error: Error & { digest?: string };
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="p-6">
			<h2 className="text-red-600 font-semibold">Something went wrong</h2>
			<p className="text-sm text-gray-500">Please try again.</p>
		</div>
	);
}
