"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateBookmark } from "@/lib/queries/bookmarks";

type PrimaryInputProps = {
	categoryId: string | null;
};

export function PrimaryInput({ categoryId }: PrimaryInputProps) {
	const formRef = useRef<HTMLFormElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const createBookmarkMutation = useCreateBookmark();

	const focusFirstBookmark = useCallback(() => {
		const first = document.querySelector<HTMLAnchorElement>(
			"[data-bookmarks-root] [data-bookmark-link]",
		);
		if (!first) {
			return false;
		}
		first.focus({ preventScroll: true });
		return true;
	}, []);

	const handleSubmit = async (rawUrl: string) => {
		let url = rawUrl.trim();
		if (!/^\w[\w+.-]*:/.test(url)) {
			url = `https://${url}`;
		}
		await createBookmarkMutation.mutateAsync({ url, categoryId });
		formRef.current?.reset();
	};

	useEffect(() => {
		const handler = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
				event.preventDefault();
				inputRef.current?.focus();
			}
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, []);

	useEffect(() => {
		const handleArrowDown = (event: KeyboardEvent) => {
			if (event.key !== "ArrowDown") {
				return;
			}
			if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
				return;
			}

			const eventTarget = event.target;
			const activeElement = document.activeElement;
			const focusContext =
				eventTarget instanceof HTMLElement
					? eventTarget
					: activeElement instanceof HTMLElement
						? activeElement
						: null;

			if (focusContext) {
				if (focusContext.closest("[data-bookmarks-root]")) {
					return;
				}

				const tagName = focusContext.tagName;
				if (
					focusContext.isContentEditable ||
					tagName === "INPUT" ||
					tagName === "TEXTAREA" ||
					tagName === "SELECT"
				) {
					return;
				}
			}

			const focused = focusFirstBookmark();
			if (focused) {
				event.preventDefault();
			}
		};

		document.addEventListener("keydown", handleArrowDown);
		return () => document.removeEventListener("keydown", handleArrowDown);
	}, [focusFirstBookmark]);

	const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
		e.preventDefault();
		const form = e.currentTarget;
		const formData = new FormData(form);
		const url = formData.get("url");
		if (!url) {
			return;
		}
		await handleSubmit(String(url));
	};

	const onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
		event,
	) => {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			focusFirstBookmark();
		}
	};

	return (
		<form
			ref={formRef}
			onSubmit={onSubmit}
			className="relative flex items-center gap-3 rounded-sm border bg-card px-2 shadow-sm"
		>
			<Plus className="h-5 w-5 text-muted-foreground" />
			<Input
				name="url"
				data-command-target
				placeholder="Insert a link, color, or just plain text…"
				type="text"
				autoComplete="off"
				ref={inputRef}
				disabled={createBookmarkMutation.isPending}
				onKeyDown={onInputKeyDown}
				className="h-11 border-none bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
			/>
			<span className="ml-auto flex items-center gap-1">
				<span className="bg-muted rounded-sm px-2 py-1 text-xs font-medium text-muted-foreground">
					⌘
				</span>
				<span className="bg-muted rounded-sm px-2 py-1 text-xs font-medium text-muted-foreground">
					<span className="text-[0.625rem]">F</span>
				</span>
			</span>
			<Button
				type="submit"
				disabled={createBookmarkMutation.isPending}
				className="hidden"
			>
				Add
			</Button>
		</form>
	);
}
