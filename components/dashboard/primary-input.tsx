"use client";

import { useEffect, useRef } from "react";
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
			const first = document.querySelector<HTMLAnchorElement>(
				"[data-bookmarks-root] [data-bookmark-link]",
			);
			first?.focus();
		}
	};

	return (
		<form
			ref={formRef}
			onSubmit={onSubmit}
			className="relative flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm"
		>
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
			<span className="ml-auto flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground">
				⌘<span className="text-[0.625rem]">F</span>
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
