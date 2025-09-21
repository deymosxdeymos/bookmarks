import Image from "next/image";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Home() {
	return (
		<div className="bg-background font-sans mx-auto min-h-screen max-w-xl flex items-center justify-center p-8">
			<main className="flex flex-col w-full">
				<div className="flex gap-2 justify-between w-full items-center mb-16">
					<Image
						src="/logo.png"
						alt="bookmarks logo"
						width={38}
						height={38}
						priority
					/>
					<div className="flex gap-2 items-center">
						<Link href="/login">
							<Button
								variant="link"
								className="text-sm font-light text-neutral-400 underline"
							>
								Login
							</Button>
						</Link>
						<ModeToggle />
					</div>
				</div>
				<div className="space-y-6">
					<div className="flex flex-col gap-2">
						<h1 className="text-md text-foreground font-light">bookmarks</h1>
						<p className="text-md text-muted-foreground font-light text-justify">
							A home for collecting and retrieving the most precious hyperlinks.
							You should probably be using something else, though.
						</p>
					</div>
					<div className="flex flex-col gap-2">
						<h1 className="text-md text-foreground font-light">about</h1>
						<p className="text-md text-muted-foreground font-light text-justify">
							Built for personal usage, designed with personal preferences.
							Bare-featured, <span className="line-through">minimal</span>
							boring interface. Auto-detect input content type. Render links
							with page metadata. Keyboard-first design. Animated appropriately.
							Loads fast. No onboarding. No tracking. No ads, ever.
						</p>
					</div>
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
					<Separator />
					<footer className="flex justify-between items-center">
						<i className="text-xs text-muted-foreground font-light">v0.01</i>
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
				</div>
			</main>
		</div>
	);
}
