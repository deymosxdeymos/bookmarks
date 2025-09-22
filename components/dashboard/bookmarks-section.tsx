"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { fallbackIcon } from "@/lib/metadata";
import { useDeleteBookmark } from "@/lib/queries/bookmarks";
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
	const rootRef = useRef<HTMLUListElement>(null);
	const queryClient = useQueryClient();
	const deleteBookmarkMutation = useDeleteBookmark();
	const [undoStackVersion, setUndoStackVersion] = useState(0);

	useEffect(() => {
		const existingData = queryClient.getQueryData<Bookmark[]>(["bookmarks"]);
		if (
			!existingData ||
			JSON.stringify(existingData) !== JSON.stringify(initialItems)
		) {
			queryClient.setQueryData<Bookmark[]>(["bookmarks"], initialItems);
		}
	}, [queryClient, initialItems]);

	const deleteIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const isKeyHeldRef = useRef(false);
	const initialDelayRef = useRef<NodeJS.Timeout | null>(null);
	const undoStackRef = useRef<
		Array<{ bookmark: Bookmark; index: number; toastId?: string | number }>
	>([]);
	const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const items = useMemo(() => {
		void undoStackVersion;
		const currentBookmarks =
			queryClient.getQueryData<Bookmark[]>(["bookmarks"]) ?? initialItems;
		const pendingDeleteIds = new Set(
			undoStackRef.current.map((item) => item.bookmark.id),
		);
		return currentBookmarks.filter((item) => !pendingDeleteIds.has(item.id));
	}, [queryClient, initialItems, undoStackVersion]);

	const queryLinks = useCallback(() => {
		return rootRef.current?.querySelectorAll<HTMLAnchorElement>(
			"[data-bookmark-link]",
		);
	}, []);

	const drainDeletionQueue = useCallback(() => {
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
				setUndoStackVersion((v) => v + 1);
			}
		};

		for (const toDelete of itemsToDelete) {
			deleteBookmarkMutation.mutate(toDelete.bookmark.id, {
				onSuccess: () => {
					checkCompletion();
				},
				onError: () => {
					checkCompletion();
				},
			});
		}
	}, [deleteBookmarkMutation.mutate]);

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

	const handleDeleteClick = useCallback(
		(bookmark: Bookmark, event: React.MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
			const index = items.findIndex((item) => item.id === bookmark.id);
			deleteBookmark(bookmark, index, true);
		},
		[items, deleteBookmark],
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

								const currentBookmarks =
									queryClient.getQueryData<Bookmark[]>(["bookmarks"]) ??
									initialItems;
								const pendingDeleteIds = new Set(
									undoStackRef.current.map((item) => item.bookmark.id),
								);
								const currentItems = currentBookmarks.filter(
									(item) => !pendingDeleteIds.has(item.id),
								);

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
					case "ArrowUp":
						focusIndex(currentIndex - 1);
						break;
					case "Home":
						focusIndex(0);
						break;
					case "End":
						focusIndex(links.length - 1);
						break;
					case "Enter":
						if (event.metaKey || event.ctrlKey) {
							event.preventDefault();
							const href = event.currentTarget.href;
							if (href) window.open(href, "_blank", "noopener,noreferrer");
						} else {
							const href = event.currentTarget.href;
							if (href) window.location.href = href;
						}
						break;
					default:
						break;
				}
			}
		},
		[queryLinks, items, deleteBookmark, undoDelete, initialItems, queryClient],
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
			if (undoTimeoutRef.current) {
				clearTimeout(undoTimeoutRef.current);
			}
			drainDeletionQueue();
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
					className="group flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-accent focus-within:bg-accent"
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
					<div className="ml-3 flex items-center gap-2">
						<time className="text-xs text-muted-foreground group-hover:hidden group-focus-within:hidden">
							{formatCreatedAt(bookmark.createdAt)}
						</time>
						<div className="hidden items-center gap-1 group-hover:flex group-focus-within:flex text-xs text-muted-foreground">
							<span className="rounded border px-1.5 py-0.5 leading-none">
								⌘
							</span>
							<span className="rounded border px-1.5 py-0.5 leading-none">
								Enter
							</span>
						</div>
						<button
							type="button"
							onClick={(e) => handleDeleteClick(bookmark, e)}
							className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 p-2 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all focus-visible:opacity-100 outline-none"
							style={{ touchAction: "manipulation" }}
							aria-label="Delete bookmark"
						>
							<Trash2 size={16} />
						</button>
					</div>
				</li>
			))}
		</ul>
	);
}
