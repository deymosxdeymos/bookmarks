"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { createBookmarkAction } from "@/app/actions/bookmarks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PrimaryInputProps = {
	categoryId: string | null;
};

export function PrimaryInput({ categoryId }: PrimaryInputProps) {
	const [pending, startTransition] = useTransition();
	const formRef = useRef<HTMLFormElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const router = useRouter();

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
		try {
			await createBookmarkAction({
				url: String(url),
				categoryId,
			});
		} finally {
			startTransition(() => {
				formRef.current?.reset();
				router.refresh();
			});
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
				type="url"
				autoComplete="off"
				ref={inputRef}
				disabled={pending}
				className="h-11 border-none bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
			/>
			<span className="ml-auto flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground">
				⌘<span className="text-[0.625rem]">F</span>
			</span>
			<Button type="submit" disabled={pending} className="hidden">
				Add
			</Button>
		</form>
	);
}
