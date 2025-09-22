import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { TextEntranceAnimation } from "@/components/text-entrance-animation";
import { Asterisk } from "@/components/ui/asterisk";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/login-form";

export default function Page() {
	return (
		<>
			<TextEntranceAnimation delay={100}>
				<header className="fixed top-0 left-0 right-0 z-20 bg-background">
					<div className="flex items-center justify-between px-4 py-2">
						<Link href="/">
							<Asterisk />
						</Link>
						<div className="flex items-center gap-2">
							<Link href="/sign-up">
								<Button
									size="sm"
									variant="default"
									className="text-xs font-bold"
								>
									Sign up
								</Button>
							</Link>
							<ModeToggle />
						</div>
					</div>
				</header>
			</TextEntranceAnimation>
			<div className="flex h-screen w-full items-center justify-center p-6 md:p-10 pt-20">
				<div className="w-full h-screen">
					<LoginForm />
				</div>
			</div>
		</>
	);
}
