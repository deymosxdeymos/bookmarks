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
const HOLD_DURATION_MS = 800;

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
	const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const holdProgressRef = useRef<HTMLDivElement>(null);
	const holdActiveRef = useRef(false);
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

	// Refs for stable keyboard handler
	const optionHotkeysRef = useRef(optionHotkeys);
	const applySelectionRef = useRef(applySelection);

	const resetHoldState = useCallback(() => {
		holdActiveRef.current = false;
		if (holdTimeoutRef.current) {
			clearTimeout(holdTimeoutRef.current);
			holdTimeoutRef.current = null;
		}
		if (holdProgressRef.current) {
			holdProgressRef.current.style.transition =
				"width 120ms var(--ease-out-quart)";
			holdProgressRef.current.style.width = "0%";
		}
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
		if (!current?.id || deleteCategoryMutation.isPending) return;
		resetHoldState();
		holdActiveRef.current = true;
		const progressEl = holdProgressRef.current;
		if (progressEl) {
			progressEl.style.transition = reducedMotionRef.current
				? "none"
				: `width ${HOLD_DURATION_MS}ms var(--ease-out-quart)`;
			requestAnimationFrame(() => {
				progressEl.style.width = "100%";
			});
		}
		holdTimeoutRef.current = setTimeout(async () => {
			holdTimeoutRef.current = null;
			holdActiveRef.current = false;
			await handleDelete();
		}, HOLD_DURATION_MS);
	}, [
		current?.id,
		deleteCategoryMutation.isPending,
		handleDelete,
		resetHoldState,
	]);

	const cancelHold = useCallback(() => {
		if (!holdActiveRef.current) return;
		resetHoldState();
	}, [resetHoldState]);

	// Store latest values in refs to avoid recreating keyboard handler
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
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		const update = () => {
			reducedMotionRef.current = media.matches;
		};
		update();
		media.addEventListener("change", update);
		return () => media.removeEventListener("change", update);
	}, []);

	// Create stable keyboard handler that uses refs to access latest values
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
		if (event.key !== "Enter") {
			return;
		}
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
								/>
								<div className="flex items-center gap-2 text-xs font-medium">
									<button
										type="button"
										onClick={() => {
											setIsCreating(false);
											setCreateValue("");
										}}
										className="text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={createCategoryMutation.isPending}
										className="flex items-center gap-1 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70"
									>
										{createCategoryMutation.isPending ? (
											<Loader2 className="size-3 animate-spin" aria-hidden />
										) : null}
										Add
									</button>
								</div>
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
								value="__delete"
								onSelect={() => {}}
								onPointerDown={(event) => {
									if (event.button !== 0) return;
									event.preventDefault();
									startHold();
								}}
								onPointerUp={(event) => {
									event.preventDefault();
									cancelHold();
								}}
								onPointerLeave={() => cancelHold()}
								onPointerCancel={() => cancelHold()}
								onKeyDown={(event) => {
									if (event.key === " " || event.key === "Enter") {
										event.preventDefault();
										if (!holdActiveRef.current) startHold();
									}
								}}
								onKeyUp={(event) => {
									if (event.key === " " || event.key === "Enter") {
										event.preventDefault();
										cancelHold();
									}
								}}
								className="group relative mt-1 flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus:bg-destructive/10"
							>
								<div
									ref={holdProgressRef}
									className="pointer-events-none absolute inset-0 w-0 rounded-lg bg-destructive/20"
								/>
								<Trash2 className="size-4" aria-hidden />
								<span className="relative z-10 text-sm font-medium">
									<span className="block transition-opacity duration-150 group-hover:opacity-0 group-focus-visible:opacity-0 group-active:opacity-0">
										Delete Group
									</span>
									<span className="absolute inset-0 block text-destructive opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
										Hold to confirm
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
