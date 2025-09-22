"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { Category } from "@/lib/schemas";

type CategoryComboboxProps = {
	categories: Category[];
	selectedId: string | null;
};

export function CategoryCombobox({
	categories,
	selectedId,
}: CategoryComboboxProps) {
	const [open, setOpen] = useState(false);
	const router = useRouter();
	const searchParams = useSearchParams();

	const options = useMemo(() => {
		return [{ id: null, name: "All" as const }, ...categories];
	}, [categories]);

	const current =
		options.find((category) => category.id === selectedId) ?? options[0];

	const applySelection = (id: string | null) => {
		const params = new URLSearchParams(searchParams.toString());
		if (id) {
			params.set("category", id);
		} else {
			params.delete("category");
		}
		params.delete("cursor");
		router.replace(`?${params.toString()}`, { scroll: false });
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					className="flex items-center gap-2 text-sm"
					role="combobox"
					aria-expanded={open}
				>
					<span className="truncate max-w-[8rem] sm:max-w-[12rem]">
						{current?.name ?? "All"}
					</span>
					<ChevronsUpDown
						className="size-4 text-muted-foreground"
						aria-hidden
					/>
				</Button>
			</DialogTrigger>
			<DialogContent className="w-full max-w-md overflow-hidden p-0">
				<Command>
					<CommandInput placeholder="Filter categories…" autoFocus />
					<CommandEmpty>No categories found.</CommandEmpty>
					<CommandList>
						{options.map((category) => (
							<CommandItem
								key={category?.id ?? "__all"}
								value={category?.id ?? "all"}
								onSelect={(value) => {
									applySelection(value === "all" ? null : value);
									setOpen(false);
								}}
							>
								<span>{category?.name ?? "All"}</span>
								{category?.id === selectedId ||
								(!category?.id && !selectedId) ? (
									<Check className="ml-auto size-4" />
								) : null}
							</CommandItem>
						))}
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	);
}
