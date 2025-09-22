import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { TextEntranceAnimation } from "@/components/text-entrance-animation";
import { Asterisk } from "@/components/ui/asterisk";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";

export default async function Home() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (session) {
		redirect("/dashboard");
	}
	return (
		<>
			<TextEntranceAnimation delay={100}>
				<header className="fixed top-0 left-0 right-0 z-20 bg-background">
					<div className="flex items-center justify-between px-4 py-2">
						<Asterisk />
						<div className="flex items-center gap-2">
							<Link href="/login">
								<Button size="sm" className="text-xs font-bold">
									Log in
								</Button>
							</Link>
							<ModeToggle />
						</div>
					</div>
				</header>
			</TextEntranceAnimation>
			<div className="bg-background font-sans min-h-screen max-w-xl flex items-center justify-center p-8 pt-20 mx-auto">
				<main className="flex flex-col w-full">
					<div className="space-y-6">
						<TextEntranceAnimation delay={200}>
							<div className="flex flex-col gap-2">
								<h1 className="text-md text-foreground font-light">
									bookmarks
								</h1>
								<p className="text-md text-muted-foreground font-light text-justify">
									A home for collecting and retrieving the most precious
									hyperlinks. You should probably be using something else,
									though.
								</p>
							</div>
						</TextEntranceAnimation>
						<TextEntranceAnimation delay={300}>
							<div className="flex flex-col gap-2">
								<h1 className="text-md text-foreground font-light">about</h1>
								<p className="text-md text-muted-foreground font-light text-justify">
									Built for personal usage, designed with personal preferences.
									Bare-featured, <span className="line-through">minimal</span>{" "}
									boring interface. Auto-detect input content type. Render links
									with page metadata. Keyboard-first design. Animated
									appropriately. Loads fast. No onboarding. No tracking. No ads,
									ever.
								</p>
							</div>
						</TextEntranceAnimation>
						<TextEntranceAnimation delay={500}>
							<div className="flex flex-col gap-2">
								<h1 className="text-md text-foreground font-light">credits</h1>
								<p className="text-md text-muted-foreground font-light text-justify">
									Thank you for{" "}
									<a href="https://rauno.me" className="underline">
										rauno
									</a>{" "}
									for inspiring me to made this.
								</p>
							</div>
						</TextEntranceAnimation>
						<Separator />
						<TextEntranceAnimation delay={600}>
							<footer className="flex justify-between items-center">
								<i className="text-xs text-muted-foreground font-light">
									v0.01
								</i>
								<Link
									href="https://deymos.me"
									target="_blank"
									rel="noopener noreferrer"
								>
									<Button
										variant="link"
										className="text-xs font-light cursor-pointer hover:underline"
									>
										@deymos
									</Button>
								</Link>
							</footer>
						</TextEntranceAnimation>
					</div>
				</main>
			</div>
		</>
	);
}
