"use client";

import { Check, ChevronsUpDown, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useCreateCategory, useDeleteCategory } from "@/lib/queries/categories";
import type { Category } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const HOTKEY_SEQUENCE = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const HOLD_DURATION_MS = 500;
const RESET_ANIMATION_DURATION_MS = 200;

type CategoryComboboxProps = {
	userId: string;
	categories: Category[];
	selectedId: string | null;
};

export function CategoryCombobox({
	userId,
	categories,
	selectedId,
}: CategoryComboboxProps) {
	const [open, setOpen] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [createValue, setCreateValue] = useState("");
	const [isHoldActive, setIsHoldActive] = useState(false);
	const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const holdProgressRef = useRef<HTMLDivElement>(null);
	const deleteItemRef = useRef<HTMLDivElement>(null);
	const reducedMotionRef = useRef(false);
	const router = useRouter();
	const searchParams = useSearchParams();
	const createFormRef = useRef<HTMLFormElement>(null);
	const createInputRef = useRef<HTMLInputElement>(null);
	const createCategoryMutation = useCreateCategory(userId);
	const deleteCategoryMutation = useDeleteCategory(userId);

	const totalCount = useMemo(() => {
		return categories.reduce(
			(sum, category) => sum + (category.bookmarkCount ?? 0),
			0,
		);
	}, [categories]);

	const options = useMemo(() => {
		return [
			{
				id: null,
				name: "All" as const,
				color: undefined,
				bookmarkCount: totalCount,
			},
			...categories,
		];
	}, [categories, totalCount]);

	const optionHotkeys = useMemo(() => {
		return options.map((option, index) => ({
			categoryId: option.id ?? null,
			hotkey: index < HOTKEY_SEQUENCE.length ? HOTKEY_SEQUENCE[index] : null,
		}));
	}, [options]);

	const current =
		options.find((category) => category.id === selectedId) ?? options[0];

	const applySelection = useCallback(
		(id: string | null) => {
			const params = new URLSearchParams(searchParams.toString());
			if (id) {
				params.set("category", id);
			} else {
				params.delete("category");
			}
			params.delete("cursor");
			router.replace(`?${params.toString()}`, { scroll: false });
		},
		[router, searchParams],
	);

	const optionHotkeysRef = useRef(optionHotkeys);
	const applySelectionRef = useRef(applySelection);

	const resetHoldState = useCallback(() => {
		setIsHoldActive(false);
		if (holdTimeoutRef.current) {
			clearTimeout(holdTimeoutRef.current);
			holdTimeoutRef.current = null;
		}
		if (holdProgressRef.current) {
			if (reducedMotionRef.current) {
				holdProgressRef.current.style.transition = "none";
				holdProgressRef.current.style.width = "0%";
			} else {
				holdProgressRef.current.style.transition = `width ${RESET_ANIMATION_DURATION_MS}ms var(--ease-out-quart)`;
				holdProgressRef.current.style.width = "0%";
			}
		}

		// Reset text color progress
		if (deleteItemRef.current) {
			if (reducedMotionRef.current) {
				deleteItemRef.current.style.transition = "none";
				deleteItemRef.current.style.setProperty("--delete-text-progress", "0");
			} else {
				deleteItemRef.current.style.setProperty("--delete-text-progress", "0");
			}
		}

		// Reset clip-path transitions
		const clipElements = document.querySelectorAll("[data-delete-clip]");
		clipElements.forEach((el) => {
			if (reducedMotionRef.current) {
				(el as HTMLElement).style.transition = "none";
			} else {
				(el as HTMLElement).style.transition =
					`clip-path ${RESET_ANIMATION_DURATION_MS}ms var(--ease-out-quart)`;
			}
		});
	}, []);

	const handleDelete = useCallback(async () => {
		if (!current?.id) return;
		try {
			await deleteCategoryMutation.mutateAsync(current.id);
			setOpen(false);
			applySelection(null);
		} catch (error) {
			console.error("delete category failed", error);
			toast.error("Could not delete group.");
		} finally {
			resetHoldState();
		}
	}, [applySelection, current?.id, deleteCategoryMutation, resetHoldState]);

	const startHold = useCallback(() => {
		if (!current?.id || deleteCategoryMutation.isPending || isHoldActive)
			return;
		resetHoldState();
		setIsHoldActive(true);

		const progressEl = holdProgressRef.current;
		const deleteEl = deleteItemRef.current;

		if (progressEl) {
			progressEl.style.transition = "none";
			progressEl.style.width = "2%";

			requestAnimationFrame(() => {
				if (progressEl) {
					if (reducedMotionRef.current) {
						progressEl.style.transition = "none";
						progressEl.style.width = "100%";
						// Instantly set text to destructive color for reduced motion
						if (deleteEl) {
							deleteEl.style.transition = "none";
							deleteEl.style.setProperty("--delete-text-progress", "1");
						}
					} else {
						progressEl.style.transition = `width ${HOLD_DURATION_MS}ms linear`;
						progressEl.style.width = "100%";

						// Animate text clip progress
						if (deleteEl) {
							deleteEl.style.setProperty("--delete-text-progress", "1");
						}
					}
				}
			});
		}

		const holdDuration = reducedMotionRef.current ? 300 : HOLD_DURATION_MS;
		holdTimeoutRef.current = setTimeout(async () => {
			holdTimeoutRef.current = null;
			setIsHoldActive(false);
			await handleDelete();
		}, holdDuration);
	}, [
		current?.id,
		deleteCategoryMutation.isPending,
		handleDelete,
		isHoldActive,
		resetHoldState,
	]);

	const cancelHold = useCallback(() => {
		if (!isHoldActive) return;
		resetHoldState();
	}, [isHoldActive, resetHoldState]);

	useEffect(() => {
		optionHotkeysRef.current = optionHotkeys;
		applySelectionRef.current = applySelection;
	}, [optionHotkeys, applySelection]);

	useEffect(() => {
		if (isCreating) {
			createInputRef.current?.focus();
		}
	}, [isCreating]);

	useEffect(() => {
		if (!open) {
			setIsCreating(false);
			setCreateValue("");
			resetHoldState();
		}
	}, [open, resetHoldState]);

	useEffect(() => {
		const updateReducedMotion = () => {
			const media = window.matchMedia("(prefers-reduced-motion: reduce)");
			reducedMotionRef.current = media.matches;
		};

		updateReducedMotion();
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		media.addEventListener("change", updateReducedMotion);

		return () => media.removeEventListener("change", updateReducedMotion);
	}, []);

	const globalHotkeyHandler = useCallback((event: KeyboardEvent) => {
		if (event.defaultPrevented || event.isComposing) return;
		if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
			return;
		}

		const target = event.target;
		if (target instanceof HTMLElement) {
			if (target.isContentEditable) return;
			const tagName = target.tagName;
			if (
				tagName === "INPUT" ||
				tagName === "TEXTAREA" ||
				tagName === "SELECT"
			) {
				return;
			}
		}

		const pressed = event.key;
		const binding = optionHotkeysRef.current.find(
			(entry) => entry.hotkey === pressed,
		);
		if (!binding || binding.hotkey == null) {
			return;
		}

		event.preventDefault();
		applySelectionRef.current(binding.categoryId);
		setOpen(false);
	}, []);

	useEffect(() => {
		document.addEventListener("keydown", globalHotkeyHandler);
		return () => document.removeEventListener("keydown", globalHotkeyHandler);
	}, [globalHotkeyHandler]);

	const handleCreateSubmit: React.FormEventHandler<HTMLFormElement> = async (
		event,
	) => {
		event.preventDefault();
		const trimmed = createValue.trim();
		if (!trimmed) return;
		try {
			const category = await createCategoryMutation.mutateAsync(trimmed);
			setOpen(false);
			applySelection(category.id);
		} catch (error) {
			console.error("create category failed", error);
			toast.error("Could not create group. Try again.");
		} finally {
			setIsCreating(false);
			setCreateValue("");
		}
	};

	const handleCreateInputKeyDown: React.KeyboardEventHandler<
		HTMLInputElement
	> = (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			event.stopPropagation();
			if (createCategoryMutation.isPending) {
				return;
			}
			const form = createFormRef.current;
			if (!form) {
				return;
			}
			form.requestSubmit();
		} else if (event.key === "Escape") {
			event.preventDefault();
			event.stopPropagation();
			setIsCreating(false);
			setCreateValue("");
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					className="flex h-10 items-center gap-2 px-3 text-sm rounded-sm font-medium transition focus-visible:ring-2 focus-visible:ring-ring"
					role="combobox"
					aria-expanded={open}
					aria-label="Select category"
				>
					<ColorSwatch color={current?.color} className="size-4" />
					<span className="truncate max-w-[8rem] sm:max-w-[12rem]">
						{current?.name ?? "All"}
					</span>
					<ChevronsUpDown
						className="size-4 text-muted-foreground"
						aria-hidden
					/>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="w-64 rounded-xl border border-border/70 bg-popover/95 p-1 shadow-xl motion-safe:duration-150 motion-safe:ease-[var(--ease-out-quart)]"
			>
				<Command className="border-none bg-transparent shadow-none">
					<CommandList className="max-h-[320px] overflow-y-auto px-1 py-1">
						{options.map((categoryOption, index) => {
							const isSelected =
								categoryOption.id === selectedId ||
								(!categoryOption.id && !selectedId);
							const hotkey = optionHotkeys[index]?.hotkey;
							return (
								<CommandItem
									key={categoryOption.id ?? "__all"}
									value={categoryOption.id ?? "all"}
									onSelect={(value) => {
										const nextId = value === "all" ? null : value;
										applySelection(nextId);
										setOpen(false);
									}}
									className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors aria-selected:bg-accent aria-selected:text-foreground"
								>
									<ColorSwatch
										color={categoryOption.color}
										className="size-4"
									/>
									<span className="truncate">{categoryOption.name}</span>
									<div className="ml-auto flex items-center gap-2">
										{hotkey && !isSelected ? (
											<span className="flex h-5 min-w-5 items-center justify-center rounded-md border border-border/60 px-1 text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground">
												{hotkey}
											</span>
										) : null}
										{isSelected ? (
											<Check className="size-4 text-primary" />
										) : null}
									</div>
								</CommandItem>
							);
						})}
						<CommandSeparator className="my-1" />
						{isCreating ? (
							<form
								ref={createFormRef}
								onSubmit={handleCreateSubmit}
								className="flex items-center gap-3 rounded-lg px-3 py-2.5"
							>
								<Plus className="size-4 text-muted-foreground" aria-hidden />
								<Input
									ref={createInputRef}
									value={createValue}
									onChange={(event) => setCreateValue(event.target.value)}
									onKeyDown={handleCreateInputKeyDown}
									placeholder="New group name"
									className="h-8 flex-1 border-none bg-transparent px-0 text-sm focus-visible:ring-0"
									autoComplete="off"
									spellCheck={false}
									disabled={createCategoryMutation.isPending}
								/>
								{createCategoryMutation.isPending && (
									<Loader2
										className="size-4 animate-spin text-muted-foreground"
										aria-hidden
									/>
								)}
							</form>
						) : (
							<CommandItem
								value="__new"
								onSelect={() => {
									setIsCreating(true);
									setCreateValue("");
								}}
								className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
							>
								<Plus className="size-4" aria-hidden />
								<span>New Group</span>
							</CommandItem>
						)}
						{current.id ? (
							<CommandItem
								ref={deleteItemRef}
								value="__delete"
								onSelect={(value) => {
									if (value === "__delete") {
										return;
									}
								}}
								onPointerDown={(event) => {
									if (event.button !== 0) return;
									event.preventDefault();
									event.stopPropagation();
									startHold();
								}}
								onPointerUp={(event) => {
									event.preventDefault();
									event.stopPropagation();
									cancelHold();
								}}
								onPointerLeave={() => cancelHold()}
								onPointerCancel={() => cancelHold()}
								onMouseDown={(event) => {
									if (event.button !== 0) return;
									event.preventDefault();
									event.stopPropagation();
									startHold();
								}}
								onMouseUp={(event) => {
									event.preventDefault();
									event.stopPropagation();
									cancelHold();
								}}
								onMouseLeave={() => cancelHold()}
								onKeyDown={(event) => {
									if (event.key === " " || event.key === "Enter") {
										event.preventDefault();
										event.stopPropagation();
										if (!isHoldActive) startHold();
									}
								}}
								onKeyUp={(event) => {
									if (event.key === " " || event.key === "Enter") {
										event.preventDefault();
										event.stopPropagation();
										cancelHold();
									}
								}}
								className="group relative mt-1 flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-all duration-100 hover:bg-destructive/10 focus:bg-destructive/10 active:scale-[0.98] active:bg-destructive/15 touch-manipulation"
								style={{ "--delete-text-progress": "0" } as React.CSSProperties}
							>
								<div
									ref={holdProgressRef}
									className={cn(
										"pointer-events-none absolute inset-0 w-0 rounded-lg bg-destructive/30 transition-shadow duration-100",
										isHoldActive &&
											"shadow-[inset_0_0_0_1px_hsl(var(--destructive)/0.4)]",
									)}
								/>
								<Trash2 className="size-4 text-muted-foreground" aria-hidden />
								<span className="relative z-10 text-sm font-medium">
									<span className="block transition-opacity duration-100 group-hover:opacity-0 group-focus-visible:opacity-0 group-active:opacity-0">
										<span className="relative inline-block text-muted-foreground">
											Delete Group
											<span
												className="absolute inset-0 text-destructive motion-reduce:transition-none"
												data-delete-clip
												style={{
													clipPath: `inset(0 calc(100% - (var(--delete-text-progress, 0) * 100%)) 0 0)`,
													transition: `clip-path ${HOLD_DURATION_MS}ms linear`,
												}}
											>
												Delete Group
											</span>
										</span>
									</span>
									<span className="absolute inset-0 w-26 opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus-visible:opacity-100">
										<span className="relative inline-block text-muted-foreground">
											Hold to confirm
											<span
												className="absolute inset-0 text-destructive motion-reduce:transition-none"
												data-delete-clip
												style={{
													clipPath: `inset(0 calc(100% - (var(--delete-text-progress, 0) * 100%)) 0 0)`,
													transition: `clip-path ${HOLD_DURATION_MS}ms linear`,
												}}
											>
												Hold to confirm
											</span>
										</span>
									</span>
								</span>
							</CommandItem>
						) : null}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

type ColorSwatchProps = {
	color?: string | null;
	className?: string;
};

function ColorSwatch({ color, className }: ColorSwatchProps) {
	const style = color
		? { background: color }
		: {
				background:
					"linear-gradient(135deg, hsl(27, 99%, 64%) 0%, hsl(348, 83%, 47%) 100%)",
			};
	return (
		<span
			aria-hidden
			className={cn(
				"flex size-4 shrink-0 rounded-full border border-white/60 shadow-sm",
				className,
			)}
			style={style}
		/>
	);
}
