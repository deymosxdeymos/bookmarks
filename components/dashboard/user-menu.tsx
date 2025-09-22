"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth-client";

type SessionUser = {
	id: string;
	email?: string | null;
	name?: string | null;
	avatar_url?: string | null;
	image?: string | null;
};

function initialsFromName(name?: string | null, email?: string | null) {
	const source = name ?? email ?? "?";
	return source
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");
}

export function UserMenu({ user }: { user: SessionUser }) {
	const [pending, startTransition] = useTransition();
	const router = useRouter();

	const handleSignOut = () => {
		startTransition(async () => {
			await signOut();
			router.replace("/login");
			router.refresh();
		});
	};

	const initials = initialsFromName(user.name, user.email);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="flex items-center gap-2 rounded-full px-2"
					aria-label="Open user menu"
				>
					<span className="hidden text-sm font-medium sm:inline">
						{user.name ?? user.email}
					</span>
					<span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase">
						{initials}
					</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>
					<div className="flex flex-col gap-1 text-sm">
						<span className="font-medium leading-none">
							{user.name ?? "Account"}
						</span>
						{user.email ? (
							<span className="text-xs text-muted-foreground">
								{user.email}
							</span>
						) : null}
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onSelect={(event) => {
						event.preventDefault();
						handleSignOut();
					}}
					className="gap-2"
				>
					<LogOut className="size-4" />
					Sign out
					{pending ? (
						<span className="ml-auto text-xs text-muted-foreground">…</span>
					) : null}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
