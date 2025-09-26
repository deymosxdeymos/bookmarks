"use client";

import Link from "next/link";

import { Asterisk } from "@/components/ui/asterisk";
import type { BookmarkFilter, Category } from "@/lib/schemas";

import { CategoryCombobox } from "./category-combobox";
import { UserMenu } from "./user-menu";

type SessionUser = {
	id: string;
	email?: string | null;
	name?: string | null;
};

type DashboardNavProps = {
	user: SessionUser;
	categories: Category[];
	filter: BookmarkFilter;
	onCategoryChange: (categoryId: string | null) => void;
};

export function DashboardNav({
	user,
	categories,
	filter,
	onCategoryChange,
}: DashboardNavProps) {
	return (
		<nav className="flex items-center justify-between gap-4">
			<div className="flex items-center gap-3 text-sm text-muted-foreground">
				<Link
					href="/"
					className="flex items-center gap-1 text-foreground hover:text-foreground"
					aria-label="Go to home"
				>
					<Asterisk />
				</Link>
				<span className="text-lg text-muted-foreground">/</span>
				<CategoryCombobox
					userId={user.id}
					categories={categories}
					selectedId={filter.categoryId ?? null}
					onCategoryChange={onCategoryChange}
				/>
			</div>
			<UserMenu user={user} />
		</nav>
	);
}
