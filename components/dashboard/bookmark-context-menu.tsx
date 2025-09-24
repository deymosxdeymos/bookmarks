"use client";

import { ArrowRight, Copy, Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuRadioGroup,
	ContextMenuRadioItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { Bookmark, Category } from "@/lib/schemas";

const UNCATEGORIZED_VALUE = "__uncategorized";

type BookmarkContextMenuProps = {
	bookmark: Bookmark;
	categories: Category[];
	onCopy: () => void;
	onRename: () => void;
	onDelete: () => void;
	onMove: (categoryId: string | null) => void;
	children: ReactNode;
};

export function BookmarkContextMenu({
	bookmark,
	categories,
	onCopy,
	onRename,
	onDelete,
	onMove,
	children,
}: BookmarkContextMenuProps) {
	const currentCategoryValue = bookmark.categoryId ?? UNCATEGORIZED_VALUE;

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent className="w-56 p-1">
				<ContextMenuItem
					onSelect={() => {
						onCopy();
					}}
				>
					<Copy className="size-4" />
					Copy
					<ContextMenuShortcut>⌘ + C</ContextMenuShortcut>
				</ContextMenuItem>
				<ContextMenuItem
					onSelect={() => {
						onRename();
					}}
				>
					<Pencil className="size-4" />
					Rename…
					<ContextMenuShortcut>⌘ + E</ContextMenuShortcut>
				</ContextMenuItem>
				<ContextMenuItem
					variant="destructive"
					onSelect={() => {
						onDelete();
					}}
				>
					<Trash2 className="size-4" />
					Delete
					<ContextMenuShortcut>⌘ + ⌫</ContextMenuShortcut>
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<ArrowRight className="size-4" />
						Move to…
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-56 p-1">
						<ContextMenuLabel>Choose a group</ContextMenuLabel>
						<ContextMenuSeparator />
						<ContextMenuRadioGroup
							value={currentCategoryValue}
							onValueChange={(value) => {
								const next = value === UNCATEGORIZED_VALUE ? null : value;
								onMove(next);
							}}
						>
							<ContextMenuRadioItem value={UNCATEGORIZED_VALUE}>
								No group
							</ContextMenuRadioItem>
							{categories.map((category) => (
								<ContextMenuRadioItem key={category.id} value={category.id}>
									{category.name}
								</ContextMenuRadioItem>
							))}
						</ContextMenuRadioGroup>
					</ContextMenuSubContent>
				</ContextMenuSub>
			</ContextMenuContent>
		</ContextMenu>
	);
}
