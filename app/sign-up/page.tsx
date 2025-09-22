import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ModeToggle } from "@/components/mode-toggle";
import { SignUpForm } from "@/components/sign-up-form";
import { TextEntranceAnimation } from "@/components/text-entrance-animation";
import { Asterisk } from "@/components/ui/asterisk";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export default async function Page() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (session) {
		redirect("/dashboard");
	}

	return (
		<>
			<TextEntranceAnimation delay={100}>
				<header className="fixed top-0 left-0 right-0 z-20 bg-background">
					<div className="flex items-center justify-between px-4 py-2">
						<Link href="/">
							<Asterisk />
						</Link>
						<div className="flex items-center gap-2">
							<Link href="/login">
								<Button
									size="sm"
									variant="default"
									className="text-xs font-bold"
								>
									Log in
								</Button>
							</Link>
							<ModeToggle />
						</div>
					</div>
				</header>
			</TextEntranceAnimation>
			<div className="flex h-screen w-full items-center justify-center p-6 md:p-10 pt-20">
				<div className="w-full h-screen">
					<SignUpForm />
				</div>
			</div>
		</>
	);
}
