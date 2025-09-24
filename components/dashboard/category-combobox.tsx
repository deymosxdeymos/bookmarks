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
const HOLD_DURATION_MS = 1000;

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
	const [isHolding, setIsHolding] = useState(false);
	const holdStartRef = useRef<number | null>(null);
	const holdActiveRef = useRef(false);
	const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const router = useRouter();
	const searchParams = useSearchParams();
	const createFormRef = useRef<HTMLFormElement>(null);
	const createInputRef = useRef<HTMLInputElement>(null);
	const createCategoryMutation = useCreateCategory(userId);
	const deleteCategoryMutation = useDeleteCategory(userId);
	const commandRef = useRef<HTMLDivElement>(null);

	const focusCommandList = useCallback(() => {
		const commandElement = commandRef.current;
		if (!commandElement) return;

		// Allow natural tab navigation within the command list
		const selectedItem = commandElement.querySelector<HTMLElement>(
			"[cmdk-item][aria-selected='true']",
		);
		const firstItem = commandElement.querySelector<HTMLElement>("[cmdk-item]");
		const targetItem = selectedItem ?? firstItem;

		if (targetItem) {
			// Only focus if no other element within the command has focus
			const activeElement = document.activeElement;
			const isCommandFocused = commandElement.contains(activeElement);
			if (!isCommandFocused) {
				targetItem.focus({ preventScroll: true });
			}
		}
	}, []);

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
		setIsHolding(false);
		holdStartRef.current = null;
		holdActiveRef.current = false;
		if (holdTimeoutRef.current) {
			clearTimeout(holdTimeoutRef.current);
			holdTimeoutRef.current = null;
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

	const beginHold = useCallback(() => {
		if (
			!current?.id ||
			deleteCategoryMutation.isPending ||
			holdActiveRef.current
		)
			return;
		holdActiveRef.current = true;
		holdStartRef.current = performance.now();
		setIsHolding(true);
		holdTimeoutRef.current = setTimeout(() => {
			if (!holdActiveRef.current) return;
			handleDelete();
		}, HOLD_DURATION_MS);
	}, [current?.id, deleteCategoryMutation.isPending, handleDelete]);

	const cancelHold = useCallback(() => {
		resetHoldState();
	}, [resetHoldState]);

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
			return;
		}
		const frame = requestAnimationFrame(() => {
			focusCommandList();
		});
		return () => cancelAnimationFrame(frame);
	}, [open, focusCommandList, resetHoldState]);

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
				<Command
					ref={commandRef}
					className="border-none bg-transparent shadow-none"
					onKeyDown={(e) => {
						// Allow tab navigation to work naturally
						if (e.key === "Tab") {
							return;
						}
					}}
				>
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
									tabIndex={0}
									onSelect={(value) => {
										const nextId = value === "all" ? null : value;
										applySelection(nextId);
										setOpen(false);
									}}
									className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors aria-selected:bg-accent aria-selected:text-foreground focus:bg-accent focus:outline-none"
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
								tabIndex={0}
								onSelect={() => {
									setIsCreating(true);
									setCreateValue("");
								}}
								onKeyDown={(event) => {
									if (event.key === "Enter" || event.key === " ") {
										event.preventDefault();
										event.stopPropagation();
										setIsCreating(true);
										setCreateValue("");
									}
								}}
								className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
							>
								<Plus className="size-4" aria-hidden />
								<span>New Group</span>
							</CommandItem>
						)}
						{current.id ? (
							<CommandItem
								value="__delete"
								tabIndex={0}
								onSelect={(value) => {
									if (value === "__delete") {
										return;
									}
								}}
								onPointerDown={(event) => {
									if (event.button !== 0) return;
									event.preventDefault();
									event.stopPropagation();
									beginHold();
								}}
								onPointerUp={(event) => {
									event.preventDefault();
									event.stopPropagation();
									cancelHold();
								}}
								onPointerLeave={() => cancelHold()}
								onPointerCancel={() => cancelHold()}
								onKeyDown={(event) => {
									if (event.key === " " || event.key === "Enter") {
										event.preventDefault();
										event.stopPropagation();
										beginHold();
									}
								}}
								onKeyUp={(event) => {
									if (event.key === " " || event.key === "Enter") {
										event.preventDefault();
										event.stopPropagation();
										cancelHold();
									}
								}}
								data-holding={isHolding ? "true" : undefined}
								aria-disabled={deleteCategoryMutation.isPending}
								className={cn(
									"group mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-100 hover:bg-destructive/10 focus-visible:bg-muted focus-visible:outline-none active:scale-[0.98] touch-manipulation holdable",
								)}
								style={
									{
										"--hold-duration": `${HOLD_DURATION_MS}ms`,
									} as React.CSSProperties
								}
							>
								<div className="holdable-label flex items-center gap-3 h-full text-muted-foreground group-hover:hidden group-focus-visible:hidden">
									<Trash2 className="size-4" aria-hidden />
									<span>Delete Group</span>
								</div>
								<div className="holdable-hint hidden items-center gap-3 h-full text-muted-foreground group-hover:flex group-focus-visible:flex">
									<Trash2 className="size-4" aria-hidden />
									<span>Hold to Confirm</span>
								</div>
								<div className="holdable-overlay" aria-hidden>
									<Trash2 className="size-4" aria-hidden />
									<span className="holdable-overlay-text holdable-overlay-label">
										Delete Group
									</span>
									<span className="holdable-overlay-text holdable-overlay-hint">
										Hold to Confirm
									</span>
								</div>
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
