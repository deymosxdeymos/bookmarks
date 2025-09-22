"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef } from "react";
import { fallbackIcon } from "@/lib/metadata";
import type { Bookmark } from "@/lib/schemas";

type BookmarksSectionProps = {
	initialItems: Bookmark[];
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
	month: "short",
	day: "numeric",
});

function formatCreatedAt(value: unknown): string {
	const d = value instanceof Date ? value : new Date(String(value));
	return Number.isNaN(d.getTime()) ? "" : dateFormatter.format(d);
}

export function BookmarksSection({ initialItems }: BookmarksSectionProps) {
	if (initialItems.length === 0) {
		return (
			<div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
				No bookmarks yet. Paste a link above to create one instantly.
			</div>
		);
	}

	const rootRef = useRef<HTMLDivElement>(null);

	const queryLinks = useCallback(() => {
		return rootRef.current?.querySelectorAll<HTMLAnchorElement>(
			"[data-bookmark-link]",
		);
	}, []);

	const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
		const active = document.activeElement as HTMLElement | null;
		const links = queryLinks();
		if (!links || links.length === 0) return;

		const toIndex = (delta: number) => {
			const currentIndex = Array.from(links).findIndex((el) => el === active);
			const nextIndex = Math.max(0, Math.min(links.length - 1, (currentIndex === -1 ? -1 : currentIndex) + delta));
			const target = links[nextIndex];
			if (target) {
				event.preventDefault();
				target.focus();
			}
		};

		switch (event.key) {
			case "ArrowDown": {
				toIndex(1);
				break;
			}
			case "ArrowUp": {
				toIndex(-1);
				break;
			}
			case "Home": {
				event.preventDefault();
				links[0]?.focus();
				break;
			}
			case "End": {
				event.preventDefault();
				links[links.length - 1]?.focus();
				break;
			}
			case "Enter": {
				if (event.metaKey || event.ctrlKey) {
					event.preventDefault();
					const anchor = active?.closest("a[href]") as HTMLAnchorElement | null;
					if (anchor?.href) {
						window.open(anchor.href, "_blank", "noopener,noreferrer");
					}
				}
				break;
			}
			default:
				break;
		}
	}, [queryLinks]);

	const items = useMemo(() => initialItems, [initialItems]);

	return (
		<div
			ref={rootRef}
			data-bookmarks-root
			onKeyDown={handleKeyDown}
			className="flex flex-col gap-1"
		>
			{items.map((bookmark) => (
				<article
					key={bookmark.id}
					className="group flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-accent focus-within:bg-accent"
				>
					<a
						data-bookmark-link
						href={bookmark.url}
						target="_blank"
						rel="noreferrer"
						className="flex max-w-[75%] items-center gap-3 rounded-md outline-none focus:bg-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					>
						<Image
							src={bookmark.iconUrl ?? fallbackIcon(bookmark.domain)}
							alt=""
							height={32}
							width={32}
							className="size-8 rounded-md border bg-muted object-cover"
							unoptimized
							referrerPolicy="no-referrer"
						/>
						<div className="flex flex-col gap-1">
							<span className="truncate text-sm font-medium text-foreground">
								{bookmark.title}
							</span>
							<span className="truncate text-xs text-muted-foreground">
								{bookmark.domain}
							</span>
						</div>
					</a>
					<time className="text-xs text-muted-foreground">
						{formatCreatedAt(bookmark.createdAt)}
					</time>
				</article>
			))}
		</div>
	);
}
