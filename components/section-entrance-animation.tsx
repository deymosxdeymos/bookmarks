"use client";

import type { ReactNode } from "react";

interface SectionEntranceAnimationProps {
	children: ReactNode;
	delay: number; // delay in seconds (e.g., 0.1, 0.2, etc.)
	className?: string;
}

export function SectionEntranceAnimation({
	children,
	delay,
	className,
}: SectionEntranceAnimationProps) {
	return (
		<div
			className={className}
			data-animate="true"
			style={
				{
					"--delay": `${delay}s`,
				} as React.CSSProperties & { "--delay": string }
			}
		>
			{children}
		</div>
	);
}
