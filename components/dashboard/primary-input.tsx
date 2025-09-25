"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PrimaryInputProps = {
	value: string;
	onValueChange: (nextValue: string) => void;
	onSubmit: (url: string) => Promise<void>;
	isSubmitting: boolean;
};

export function PrimaryInput({
	value,
	onValueChange,
	onSubmit,
	isSubmitting,
}: PrimaryInputProps) {
	const inputRef = useRef<HTMLInputElement>(null);

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

	const handleSubmit = useCallback(
		(rawUrl: string): Promise<void> => {
			let normalized = rawUrl.trim();
			if (!normalized) {
				return Promise.resolve();
			}
			if (!/^\w[\w+.-]*:/.test(normalized)) {
				normalized = `https://${normalized}`;
			}
			return onSubmit(normalized);
		},
		[onSubmit],
	);

	useEffect(() => {
		const handler = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
				event.preventDefault();
				inputRef.current?.focus();
				return;
			}

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

		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [focusFirstBookmark]);

	useEffect(() => {
		const handlePaste = (event: ClipboardEvent) => {
			const target = event.target as HTMLElement | null;
			if (target) {
				const editable = target.closest(
					'input, textarea, [contenteditable="true"], [contenteditable=""], [role="textbox"]',
				);
				if (editable) {
					return;
				}
			}

			if (isSubmitting) {
				return;
			}

			const clipboardText = event.clipboardData?.getData("text") ?? "";
			const trimmed = clipboardText.trim();
			if (!trimmed) {
				return;
			}

			const firstLine = trimmed.split(/\r?\n/)[0]?.trim();
			if (!firstLine) {
				return;
			}

			event.preventDefault();
			void handleSubmit(firstLine);
		};

		document.addEventListener("paste", handlePaste);
		return () => {
			document.removeEventListener("paste", handlePaste);
		};
	}, [handleSubmit, isSubmitting]);

	const onSubmitForm: React.FormEventHandler<HTMLFormElement> = (event) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const url = formData.get("url");
		if (!url) {
			return;
		}
		void handleSubmit(String(url));
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
			onSubmit={onSubmitForm}
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
				disabled={isSubmitting}
				value={value}
				onChange={(event) => {
					onValueChange(event.target.value);
				}}
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
			<Button type="submit" disabled={isSubmitting} className="hidden">
				Add
			</Button>
		</form>
	);
}
