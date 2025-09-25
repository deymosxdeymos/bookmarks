"use client";

import type { QueryKey } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import Image from "next/image";
import {
	type FormEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { BookmarkContextMenu } from "@/components/dashboard/bookmark-context-menu";
import type { ListResult } from "@/lib/bookmarks-repo";
import { fallbackIcon } from "@/lib/metadata";
import {
	useDeleteBookmark,
	useSetBookmarkCategory,
	useUpdateBookmarkTitle,
} from "@/lib/queries/bookmarks";
import type { Bookmark, Category } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type BookmarksSectionProps = {
	initialItems: Bookmark[];
	queryKey: QueryKey;
	categories: Category[];
	filteredItems?: Bookmark[];
	searchTerm?: string;
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
	categories,
	filteredItems,
	searchTerm = "",
}: BookmarksSectionProps) {
	const rootRef = useRef<HTMLUListElement>(null);
	const queryClient = useQueryClient();
	const { mutate: mutateBookmark } = useDeleteBookmark();
	const updateBookmarkMutation = useUpdateBookmarkTitle();
	const setBookmarkCategoryMutation = useSetBookmarkCategory();
	const [undoStackVersion, setUndoStackVersion] = useState(0);
	const latestInitialItemsRef = useRef(initialItems);
	const [activeEditId, setActiveEditId] = useState<string | null>(null);
	const [editDraft, setEditDraft] = useState("");
	const [pendingEditId, setPendingEditId] = useState<string | null>(null);
	const [isInitialEdit, setIsInitialEdit] = useState(false);
	const editDraftRef = useRef("");
	const [feedback, setFeedback] = useState<{
		id: string;
		type: "copied" | "renamed";
	} | null>(null);
	const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastFocusedBookmarkIdRef = useRef<string | null>(null);
	const inlineEditInputRef = useRef<HTMLInputElement | null>(null);
	const previousActiveEditIdRef = useRef<string | null>(null);

	useEffect(() => {
		latestInitialItemsRef.current = initialItems;
	}, [initialItems]);

	useEffect(() => {
		if (!activeEditId) return;
		const frame = requestAnimationFrame(() => {
			const input = inlineEditInputRef.current;
			if (input) {
				input.focus({ preventScroll: true });
				input.select();
			}
		});
		return () => cancelAnimationFrame(frame);
	}, [activeEditId]);

	useEffect(() => {
		return () => {
			if (feedbackTimeoutRef.current) {
				clearTimeout(feedbackTimeoutRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (previousActiveEditIdRef.current && activeEditId === null) {
			const activeId = lastFocusedBookmarkIdRef.current;
			if (activeId) {
				const selector = `[data-bookmark-link][data-bookmark-id="${activeId}"]`;
				const target =
					rootRef.current?.querySelector<HTMLAnchorElement>(selector);
				target?.focus({ preventScroll: true });
			}
		}
		previousActiveEditIdRef.current = activeEditId;
	}, [activeEditId]);

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
		const baseItems = filteredItems ?? getCurrentItems();
		const pendingDeleteIds = new Set(
			undoStackRef.current.map((item) => item.bookmark.id),
		);
		return baseItems.filter((item) => !pendingDeleteIds.has(item.id));
	}, [filteredItems, getCurrentItems]);

	const triggerFeedback = useCallback(
		(bookmarkId: string, type: "copied" | "renamed") => {
			if (feedbackTimeoutRef.current) {
				clearTimeout(feedbackTimeoutRef.current);
			}
			setFeedback({ id: bookmarkId, type });
			feedbackTimeoutRef.current = setTimeout(() => {
				setFeedback(null);
				feedbackTimeoutRef.current = null;
			}, 1400);
		},
		[],
	);

	const handleCopyBookmark = useCallback(
		async (bookmark: Bookmark) => {
			lastFocusedBookmarkIdRef.current = bookmark.id;
			try {
				if (navigator?.clipboard?.writeText) {
					await navigator.clipboard.writeText(bookmark.url);
				} else if (typeof document !== "undefined") {
					const textarea = document.createElement("textarea");
					textarea.value = bookmark.url;
					textarea.setAttribute("readonly", "");
					textarea.style.position = "absolute";
					textarea.style.left = "-9999px";
					document.body.appendChild(textarea);
					textarea.select();
					document.execCommand("copy");
					document.body.removeChild(textarea);
				} else {
					throw new Error("Clipboard API unavailable");
				}
				triggerFeedback(bookmark.id, "copied");
				toast.success("Copied");
			} catch (error) {
				console.error("copy bookmark failed", error);
				toast.error("Could not copy link.");
			}
		},
		[triggerFeedback],
	);

	const startInlineRename = useCallback((bookmark: Bookmark) => {
		lastFocusedBookmarkIdRef.current = bookmark.id;
		setActiveEditId(bookmark.id);
		setEditDraft(bookmark.title);
		editDraftRef.current = bookmark.title;
		setIsInitialEdit(true);
	}, []);

	const cancelInlineRename = useCallback(() => {
		setActiveEditId(null);
		setEditDraft("");
		editDraftRef.current = "";
		setPendingEditId(null);
		setIsInitialEdit(false);
	}, []);

	const commitInlineRename = useCallback(async () => {
		if (!activeEditId) return;
		const currentValue =
			inlineEditInputRef.current?.value || editDraftRef.current;
		const trimmed = currentValue.trim();
		if (!trimmed) {
			toast.error("Title cannot be empty.");
			return;
		}
		try {
			setPendingEditId(activeEditId);
			await updateBookmarkMutation.mutateAsync({
				bookmarkId: activeEditId,
				title: trimmed,
			});
			triggerFeedback(activeEditId, "renamed");
			toast.success("Updated title");
			setActiveEditId(null);
			setEditDraft("");
			setIsInitialEdit(false);
			lastFocusedBookmarkIdRef.current = activeEditId;
		} catch (error) {
			console.error("rename bookmark failed", error);
			toast.error("Could not update title.");
		} finally {
			setPendingEditId(null);
		}
	}, [activeEditId, triggerFeedback, updateBookmarkMutation]);

	const handleInlineEditSubmit = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			void commitInlineRename();
		},
		[commitInlineRename],
	);

	const handleMoveBookmark = useCallback(
		async (bookmark: Bookmark, categoryId: string | null) => {
			if (bookmark.categoryId === categoryId) return;
			lastFocusedBookmarkIdRef.current = bookmark.id;
			try {
				await setBookmarkCategoryMutation.mutateAsync({
					bookmarkId: bookmark.id,
					categoryId,
				});
				const targetLabel =
					categoryId == null
						? "No group"
						: (categories.find((category) => category.id === categoryId)
								?.name ?? "Selected group");
				toast.success(`Moved to ${targetLabel}`);
			} catch (error) {
				console.error("move bookmark failed", error);
				toast.error("Could not move bookmark.");
			}
		},
		[categories, setBookmarkCategoryMutation],
	);

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
			const currentId = event.currentTarget.getAttribute("data-bookmark-id");
			if (currentId) {
				lastFocusedBookmarkIdRef.current = currentId;
			}

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
				event.key.toLowerCase() === "c"
			) {
				event.preventDefault();
				const bookmarkId = event.currentTarget.getAttribute("data-bookmark-id");
				const bookmark = items.find((item) => item.id === bookmarkId);
				if (bookmark) {
					void handleCopyBookmark(bookmark);
				}
			} else if (
				(event.metaKey || event.ctrlKey) &&
				event.key.toLowerCase() === "e"
			) {
				event.preventDefault();
				const bookmarkId = event.currentTarget.getAttribute("data-bookmark-id");
				const bookmark = items.find((item) => item.id === bookmarkId);
				if (bookmark) {
					startInlineRename(bookmark);
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
		[
			queryLinks,
			items,
			deleteBookmark,
			undoDelete,
			getVisibleItems,
			handleCopyBookmark,
			startInlineRename,
		],
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
			const modifier = event.metaKey || event.ctrlKey;
			if (!modifier) {
				return;
			}

			if (activeEditId) {
				return;
			}

			const target = event.target as HTMLElement | null;
			if (target) {
				if (
					target.isContentEditable ||
					target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.tagName === "SELECT"
				) {
					return;
				}
			}

			const key = event.key.toLowerCase();
			if (
				(event.metaKey || event.ctrlKey) &&
				!event.shiftKey &&
				(key === "c" || key === "e")
			) {
				const activeId = lastFocusedBookmarkIdRef.current;
				if (!activeId) return;
				const currentItems = getVisibleItems();
				const bookmark = currentItems.find((item) => item.id === activeId);
				if (!bookmark) return;
				event.preventDefault();
				event.stopPropagation();
				if (key === "c") {
					void handleCopyBookmark(bookmark);
				} else {
					startInlineRename(bookmark);
				}
				return;
			}

			if ((event.metaKey || event.ctrlKey) && key === "z" && !event.shiftKey) {
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
	}, [
		undoDelete,
		drainDeletionQueue,
		getVisibleItems,
		handleCopyBookmark,
		startInlineRename,
		activeEditId,
	]);

	if (items.length === 0) {
		const trimmedSearch = searchTerm.trim();
		const hasSearchQuery = trimmedSearch.length > 0;
		return (
			<div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
				{hasSearchQuery
					? `No bookmarks match "${trimmedSearch}".`
					: "No bookmarks yet. Paste a link above to create one instantly."}
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
			{items.map((bookmark, index) => {
				const isFeedbackTarget = feedback?.id === bookmark.id;
				const isEditing = activeEditId === bookmark.id;
				const shouldDim = activeEditId !== null && !isEditing;
				const showCopyFeedback =
					isFeedbackTarget && feedback?.type === "copied";
				const showRenameFeedback =
					isFeedbackTarget && feedback?.type === "renamed";

				const listItemClassName = cn(
					"group relative flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-[var(--ease-out-quart)]",
					!isEditing && "hover:bg-accent focus-within:bg-accent",
					showRenameFeedback &&
						!isEditing &&
						"motion-safe:animate-in motion-safe:fade-in-0",
					shouldDim && "opacity-40 motion-safe:blur-[2px]",
				);

				const listItemChildren = (
					<>
						{isEditing ? (
							<form
								className="flex w-full items-center justify-between gap-3"
								onSubmit={handleInlineEditSubmit}
								onKeyDown={(event) => {
									if (event.key === "Escape") {
										event.preventDefault();
										cancelInlineRename();
									}
								}}
							>
								<div className="flex flex-1 items-center gap-3">
									<Image
										src={bookmark.iconUrl ?? fallbackIcon(bookmark.domain)}
										alt=""
										height={32}
										width={32}
										className="size-8 shrink-0 rounded-md border bg-muted object-cover"
										unoptimized
										referrerPolicy="no-referrer"
									/>
									<div className="flex flex-1 flex-col gap-1">
										<div className="relative">
											{isInitialEdit && (
												<span
													className="absolute left-0 top-0 z-0 bg-yellow-200 px-1 text-sm font-medium text-black opacity-100 pointer-events-none"
													aria-hidden="true"
												>
													{editDraftRef.current}
												</span>
											)}
											<input
												ref={inlineEditInputRef}
												defaultValue={editDraft}
												onChange={(event) => {
													editDraftRef.current = event.target.value;
													if (isInitialEdit) {
														setIsInitialEdit(false);
													}
												}}
												onFocus={() => {
													lastFocusedBookmarkIdRef.current = bookmark.id;
												}}
												onKeyDown={(event) => {
													if (event.key === "Escape") {
														event.preventDefault();
														cancelInlineRename();
													}
												}}
												aria-label={`Edit title for ${bookmark.domain}`}
												disabled={pendingEditId === bookmark.id}
												maxLength={100}
												className={cn(
													"relative z-10 h-auto w-full min-w-0 border-none bg-transparent text-sm font-medium outline-none [&::selection]:bg-transparent [&::-moz-selection]:bg-transparent",
													isInitialEdit
														? "text-transparent caret-foreground"
														: "text-foreground",
												)}
											/>
										</div>
										<span className="truncate text-xs text-muted-foreground">
											{bookmark.domain}
										</span>
									</div>
								</div>
							</form>
						) : (
							<div className="flex w-full items-center justify-between gap-3">
								<div className="relative flex flex-1 items-center gap-3 overflow-hidden">
									<a
										data-bookmark-link
										data-bookmark-id={bookmark.id}
										href={bookmark.url}
										target="_blank"
										rel="noreferrer"
										onKeyDown={handleItemKeyDown}
										onFocus={() => {
											lastFocusedBookmarkIdRef.current = bookmark.id;
										}}
										onPointerDown={() => {
											lastFocusedBookmarkIdRef.current = bookmark.id;
										}}
										onMouseEnter={() => {
											lastFocusedBookmarkIdRef.current = bookmark.id;
										}}
										className={cn(
											"flex max-w-[75%] items-center gap-3 rounded-md outline-none focus-visible:bg-transparent focus:bg-transparent",
											isEditing && "pointer-events-none opacity-0",
										)}
										style={{ touchAction: "manipulation" }}
									>
										<span className="relative size-8 shrink-0 overflow-hidden rounded-md border bg-muted">
											<Image
												src={bookmark.iconUrl ?? fallbackIcon(bookmark.domain)}
												alt=""
												height={32}
												width={32}
												className={cn(
													"size-full object-cover motion-safe:transition-transform motion-safe:duration-[220ms] motion-safe:ease-[var(--ease-in-out-quart)]",
													showCopyFeedback
														? "translate-y-full"
														: "translate-y-0",
												)}
												unoptimized
												referrerPolicy="no-referrer"
											/>
											<span
												aria-hidden
												className={cn(
													"absolute inset-0 flex items-center justify-center bg-background/95 text-foreground motion-safe:transition-transform motion-safe:duration-[220ms] motion-safe:ease-[var(--ease-in-out-quart)]",
													showCopyFeedback
														? "translate-y-0"
														: "-translate-y-full",
												)}
											>
												<Check className="size-4" />
											</span>
										</span>
										<span className="relative flex min-h-[2.25rem] flex-col justify-center overflow-hidden">
											<span
												className={cn(
													"flex flex-col gap-1 motion-safe:transition-transform motion-safe:duration-[220ms] motion-safe:ease-[var(--ease-in-out-quart)]",
													showCopyFeedback
														? "translate-y-full"
														: "translate-y-0",
												)}
											>
												<span className="truncate text-sm font-medium text-foreground">
													{bookmark.title}
												</span>
												<span className="truncate text-xs text-muted-foreground">
													{bookmark.domain}
												</span>
											</span>
											<span
												className={cn(
													"absolute inset-0 flex items-center text-sm font-medium text-foreground motion-safe:transition-transform motion-safe:duration-[220ms] motion-safe:ease-[var(--ease-in-out-quart)]",
													showCopyFeedback
														? "translate-y-0"
														: "-translate-y-full",
												)}
												aria-hidden={!showCopyFeedback}
											>
												Copied
											</span>
										</span>
									</a>
								</div>
								<div
									className={cn(
										"relative ml-3 flex min-h-[1.5rem] min-w-[8.5rem] justify-end text-right",
										isEditing && "opacity-0",
									)}
								>
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
							</div>
						)}
					</>
				);

				if (isEditing) {
					return (
						<li
							key={bookmark.id}
							className={listItemClassName}
							data-editing="true"
						>
							{listItemChildren}
						</li>
					);
				}

				return (
					<BookmarkContextMenu
						key={bookmark.id}
						bookmark={bookmark}
						categories={categories}
						onCopy={() => {
							void handleCopyBookmark(bookmark);
						}}
						onRename={() => startInlineRename(bookmark)}
						onDelete={() => {
							if (activeEditId === bookmark.id) {
								cancelInlineRename();
							}
							lastFocusedBookmarkIdRef.current = bookmark.id;
							deleteBookmark(bookmark, index, true);
						}}
						onMove={(categoryId) => {
							void handleMoveBookmark(bookmark, categoryId);
						}}
					>
						<li className={listItemClassName}>{listItemChildren}</li>
					</BookmarkContextMenu>
				);
			})}
		</ul>
	);
}
