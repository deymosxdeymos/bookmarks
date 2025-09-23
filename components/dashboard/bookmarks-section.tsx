"use client";

import type { QueryKey } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { ListResult } from "@/lib/bookmarks-repo";
import { fallbackIcon } from "@/lib/metadata";
import { useDeleteBookmark } from "@/lib/queries/bookmarks";
import type { Bookmark } from "@/lib/schemas";

type BookmarksSectionProps = {
	initialItems: Bookmark[];
	queryKey: QueryKey;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
	month: "short",
	day: "numeric",
});

function formatCreatedAt(value: unknown): string {
	const d = value instanceof Date ? value : new Date(String(value));
	return Number.isNaN(d.getTime()) ? "" : dateFormatter.format(d);
}

export function BookmarksSection({
	initialItems,
	queryKey,
}: BookmarksSectionProps) {
	const rootRef = useRef<HTMLUListElement>(null);
	const queryClient = useQueryClient();
	const { mutate: mutateBookmark } = useDeleteBookmark();
	const [undoStackVersion, setUndoStackVersion] = useState(0);
	const latestInitialItemsRef = useRef(initialItems);

	useEffect(() => {
		latestInitialItemsRef.current = initialItems;
	}, [initialItems]);

	const deleteIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const isKeyHeldRef = useRef(false);
	const initialDelayRef = useRef<NodeJS.Timeout | null>(null);
	const undoStackRef = useRef<
		Array<{ bookmark: Bookmark; index: number; toastId?: string | number }>
	>([]);
	const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const getCurrentItems = useCallback(() => {
		const result = queryClient.getQueryData<ListResult>(queryKey);
		return result?.items ?? latestInitialItemsRef.current;
	}, [queryClient, queryKey]);

	const getVisibleItems = useCallback(() => {
		const baseItems = getCurrentItems();
		const pendingDeleteIds = new Set(
			undoStackRef.current.map((item) => item.bookmark.id),
		);
		return baseItems.filter((item) => !pendingDeleteIds.has(item.id));
	}, [getCurrentItems]);

	const items = useMemo(() => {
		void undoStackVersion;
		return getVisibleItems();
	}, [getVisibleItems, undoStackVersion]);

	const queryLinks = useCallback(() => {
		return rootRef.current?.querySelectorAll<HTMLAnchorElement>(
			"[data-bookmark-link]",
		);
	}, []);

	const drainDeletionQueue = useCallback(
		(options?: { suppressStateUpdates?: boolean }) => {
			if (undoStackRef.current.length === 0) {
				return;
			}

			if (undoTimeoutRef.current) {
				clearTimeout(undoTimeoutRef.current);
				undoTimeoutRef.current = null;
			}

			const suppressStateUpdates = options?.suppressStateUpdates ?? false;
			const itemsToDelete = [...undoStackRef.current];
			let completedMutations = 0;
			const totalMutations = itemsToDelete.length;

			const checkCompletion = () => {
				completedMutations++;
				if (completedMutations === totalMutations) {
					for (const toDelete of itemsToDelete) {
						if (toDelete.toastId) {
							toast.dismiss(toDelete.toastId);
						}
					}

					undoStackRef.current = undoStackRef.current.filter(
						(item) =>
							!itemsToDelete.some(
								(toDelete) => toDelete.bookmark.id === item.bookmark.id,
							),
					);

					if (!suppressStateUpdates) {
						setUndoStackVersion((v) => v + 1);
					}
				}
			};

			for (const toDelete of itemsToDelete) {
				mutateBookmark(toDelete.bookmark.id, {
					onSuccess: () => {
						checkCompletion();
					},
					onError: () => {
						checkCompletion();
					},
				});
			}
		},
		[mutateBookmark],
	);

	const undoDelete = useCallback(() => {
		const lastDeleted = undoStackRef.current.pop();
		if (lastDeleted) {
			if (lastDeleted.toastId) {
				toast.dismiss(lastDeleted.toastId);
			}

			setUndoStackVersion((v) => v + 1);
			if (undoTimeoutRef.current) {
				clearTimeout(undoTimeoutRef.current);
				undoTimeoutRef.current = null;
			}
		}
	}, []);

	const deleteBookmark = useCallback(
		(bookmark: Bookmark, index: number, _immediate = false) => {
			if (undoTimeoutRef.current) {
				clearTimeout(undoTimeoutRef.current);
			}

			const undoThisBookmark = () => {
				const itemIndex = undoStackRef.current.findIndex(
					(item) => item.bookmark.id === bookmark.id,
				);
				if (itemIndex !== -1) {
					const deletedItem = undoStackRef.current.splice(itemIndex, 1)[0];
					if (deletedItem?.toastId) {
						toast.dismiss(deletedItem.toastId);
					}
					setUndoStackVersion((v) => v + 1);
					if (undoTimeoutRef.current) {
						clearTimeout(undoTimeoutRef.current);
						undoTimeoutRef.current = null;
					}
				}
			};

			const toastId = toast(`Deleted "${bookmark.title}"`, {
				action: {
					label: "Undo",
					onClick: undoThisBookmark,
				},
				duration: 5000,
			});

			undoStackRef.current.push({ bookmark, index, toastId });
			setUndoStackVersion((v) => v + 1);

			undoTimeoutRef.current = setTimeout(() => {
				drainDeletionQueue();
			}, 5000);
		},
		[drainDeletionQueue],
	);

	const handleItemKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLAnchorElement>) => {
			const links = queryLinks();
			if (!links || links.length === 0) return;
			const currentIndex = Array.from(links).indexOf(event.currentTarget);

			const focusIndex = (index: number) => {
				const nextIndex = Math.max(0, Math.min(links.length - 1, index));
				const target = links[nextIndex];
				if (target) {
					event.preventDefault();
					target.focus();
				}
			};

			if ((event.metaKey || event.ctrlKey) && event.key === "Backspace") {
				event.preventDefault();
				const bookmarkId = event.currentTarget.getAttribute("data-bookmark-id");
				const bookmark = items.find((item) => item.id === bookmarkId);
				if (bookmark) {
					const bookmarkIndex = items.findIndex(
						(item) => item.id === bookmarkId,
					);

					if (!isKeyHeldRef.current) {
						isKeyHeldRef.current = true;

						deleteBookmark(bookmark, bookmarkIndex, true);

						const focusNext = () => {
							const links = queryLinks();
							if (links && links.length > 0) {
								const nextIndex = Math.min(currentIndex, links.length - 1);
								const nextLink = links[nextIndex];
								if (nextLink) {
									nextLink.focus();
								}
							}
						};
						focusNext();
						setTimeout(focusNext, 0);

						initialDelayRef.current = setTimeout(() => {
							deleteIntervalRef.current = setInterval(() => {
								if (!isKeyHeldRef.current) return;

								const focusedElement =
									document.activeElement as HTMLAnchorElement;
								if (!focusedElement?.getAttribute("data-bookmark-link")) return;

								const currentBookmarkId =
									focusedElement.getAttribute("data-bookmark-id");
								if (!currentBookmarkId) return;

								const currentItems = getVisibleItems();

								const currentBookmark = currentItems.find(
									(item) => item.id === currentBookmarkId,
								);

								if (currentBookmark) {
									const currentBookmarkIndex = currentItems.findIndex(
										(item) => item.id === currentBookmarkId,
									);

									deleteBookmark(currentBookmark, currentBookmarkIndex, true);

									const focusNext = () => {
										const links = queryLinks();
										if (links && links.length > 0) {
											const focusIndex = Math.min(
												currentBookmarkIndex,
												links.length - 1,
											);
											const nextLink = links[focusIndex];
											if (nextLink) {
												nextLink.focus();
											}
										}
									};
									focusNext();
									setTimeout(focusNext, 0);
								}
							}, 50); // Even faster deletion rate
						}, 100); // Even shorter initial delay
					}
				}
			} else if (
				(event.metaKey || event.ctrlKey) &&
				event.key.toLowerCase() === "z" &&
				!event.shiftKey
			) {
				event.preventDefault();
				undoDelete();
			} else {
				switch (event.key) {
					case "ArrowDown":
						focusIndex(currentIndex + 1);
						break;
					case "ArrowUp": {
						if (currentIndex === 0) {
							const commandInput = document.querySelector<HTMLInputElement>(
								"[data-command-target]",
							);
							if (commandInput && !commandInput.disabled) {
								event.preventDefault();
								commandInput.focus({ preventScroll: true });
								return;
							}
						}
						focusIndex(currentIndex - 1);
						break;
					}
					case "Home":
						focusIndex(0);
						break;
					case "End":
						focusIndex(links.length - 1);
						break;
					case "Enter":
						event.preventDefault();
						if (event.metaKey || event.ctrlKey) {
							const href = event.currentTarget.href;
							if (href) window.open(href, "_blank", "noopener,noreferrer");
						}
						break;
					default:
						break;
				}
			}
		},
		[queryLinks, items, deleteBookmark, undoDelete, getVisibleItems],
	);

	useEffect(() => {
		const handleKeyUp = (event: KeyboardEvent) => {
			if (
				event.key === "Backspace" ||
				event.key === "Meta" ||
				event.key === "Control"
			) {
				isKeyHeldRef.current = false;
				if (deleteIntervalRef.current) {
					clearInterval(deleteIntervalRef.current);
					deleteIntervalRef.current = null;
				}
				if (initialDelayRef.current) {
					clearTimeout(initialDelayRef.current);
					initialDelayRef.current = null;
				}
			}
		};

		const handleGlobalKeyDown = (event: KeyboardEvent) => {
			if (
				(event.metaKey || event.ctrlKey) &&
				event.key.toLowerCase() === "z" &&
				!event.shiftKey
			) {
				if (undoStackRef.current.length > 0) {
					event.preventDefault();
					event.stopPropagation();
					undoDelete();
				}
			}
		};

		document.addEventListener("keyup", handleKeyUp);
		document.addEventListener("keydown", handleGlobalKeyDown, true);
		return () => {
			document.removeEventListener("keyup", handleKeyUp);
			document.removeEventListener("keydown", handleGlobalKeyDown, true);
			if (deleteIntervalRef.current) {
				clearInterval(deleteIntervalRef.current);
			}
			if (initialDelayRef.current) {
				clearTimeout(initialDelayRef.current);
			}
			drainDeletionQueue({ suppressStateUpdates: true });
		};
	}, [undoDelete, drainDeletionQueue]);

	if (items.length === 0) {
		return (
			<div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
				No bookmarks yet. Paste a link above to create one instantly.
			</div>
		);
	}

	return (
		<ul
			ref={rootRef}
			data-bookmarks-root
			aria-label="Bookmarks"
			className="flex flex-col gap-1"
		>
			{items.map((bookmark) => (
				<li
					key={bookmark.id}
					className="group flex items-center justify-between rounded-lg px-3 py-2 focus-within:bg-accent hover:bg-accent motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-[var(--ease-out-quart)]"
				>
					<a
						data-bookmark-link
						data-bookmark-id={bookmark.id}
						href={bookmark.url}
						target="_blank"
						rel="noreferrer"
						onKeyDown={handleItemKeyDown}
						className="flex max-w-[75%] items-center gap-3 rounded-md outline-none focus-visible:bg-transparent focus:bg-transparent"
						style={{ touchAction: "manipulation" }}
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
					<div className="relative ml-3 flex min-h-[1.5rem] min-w-[8.5rem] justify-end text-right">
						<time className="self-center text-xs text-muted-foreground tabular-nums transition-opacity motion-safe:duration-150 motion-safe:ease-[var(--ease-out-quart)] group-hover:opacity-0 group-focus-within:opacity-0">
							{formatCreatedAt(bookmark.createdAt)}
						</time>
						<div
							aria-hidden
							className="pointer-events-none absolute inset-0 flex items-center justify-end gap-2 text-xs text-muted-foreground opacity-0 transition-opacity motion-safe:duration-150 motion-safe:ease-[var(--ease-out-quart)] group-hover:opacity-100 group-focus-within:opacity-100"
						>
							<span className="rounded border px-1.5 py-0.5 leading-none">
								⌘
							</span>
							<span className="rounded border px-1.5 py-0.5 leading-none">
								Enter
							</span>
						</div>
					</div>
				</li>
			))}
		</ul>
	);
}
