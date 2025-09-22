"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TextEntranceAnimationProps {
	children: ReactNode;
	delay?: number;
	className?: string;
}

export function TextEntranceAnimation({
	children,
	delay = 0,
	className,
}: TextEntranceAnimationProps) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsVisible(true);
		}, delay);

		return () => clearTimeout(timer);
	}, [delay]);

	return (
		<div
			className={cn(
				"transition-all duration-800 ease-out",
				isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5",
				className,
			)}
			style={{
				transitionTimingFunction: "var(--ease-out-cubic)",
			}}
		>
			{children}
		</div>
	);
}
