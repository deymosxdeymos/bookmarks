"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { authClient, useSession } from "@/lib/auth-client";

export default function Dashboard() {
	const { data: session, isPending } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (!isPending && !session) {
			router.push("/login");
		}
	}, [session, isPending, router]);

	const handleLogout = async () => {
		await authClient.signOut();
		router.push("/login");
	};

	if (isPending) {
		return (
			<div className="flex min-h-svh w-full items-center justify-center">
				<div className="text-lg">Loading...</div>
			</div>
		);
	}

	if (!session) {
		return null;
	}

	return (
		<div className="flex min-h-svh w-full items-center justify-center p-6">
			<div className="w-full max-w-md">
				<Card>
					<CardHeader className="text-center">
						<CardTitle>Welcome to Bookmarks</CardTitle>
						<CardDescription>You are successfully logged in</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="text-center">
							<p className="text-sm text-muted-foreground">Logged in as:</p>
							<p className="font-medium">
								{session.user.name || session.user.email}
							</p>
						</div>
						<Button onClick={handleLogout} variant="default" className="w-full">
							Log Out
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
