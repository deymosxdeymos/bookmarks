"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface LoadingBarProps {
	className?: string;
}

export function LoadingBar({ className }: LoadingBarProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [showBar, setShowBar] = useState(false);
	const pathname = usePathname();
	const prevPathname = useRef(pathname);

	useEffect(() => {
		if (
			prevPathname.current !== pathname &&
			prevPathname.current !== undefined
		) {
			setIsLoading(true);
			setShowBar(true);

			const timer = setTimeout(() => {
				setIsLoading(false);
			}, 1500);

			return () => clearTimeout(timer);
		}
		prevPathname.current = pathname;
	}, [pathname]);

	useEffect(() => {
		if (!isLoading && showBar) {
			const timer = setTimeout(() => {
				setShowBar(false);
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [isLoading, showBar]);

	if (!showBar) return null;

	return (
		<div
			className={cn(
				"fixed top-0 left-0 right-0 z-50 h-0.5 bg-muted-foreground/30 transition-all duration-300 ease-out",
				isLoading
					? "animate-[loading-sweep_1.5s_ease-in-out_infinite]"
					: "translate-x-full",
				className,
			)}
		/>
	);
}
