"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function LoginForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const emailId = useId();
	const passwordId = useId();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [isSignUp, setIsSignUp] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			if (isSignUp) {
				await authClient.signUp.email({
					email,
					password,
					name: email.split("@")[0], // Use email prefix as name
				});
			} else {
				await authClient.signIn.email({
					email,
					password,
				});
			}
			router.push("/dashboard");
		} catch (_err) {
			setError(
				isSignUp
					? "Failed to create account. Please try again."
					: "Invalid email or password",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader>
					<CardTitle>
						{isSignUp ? "Create an account" : "Login to your account"}
					</CardTitle>
					<CardDescription>
						{isSignUp
							? "Enter your email below to create your account"
							: "Enter your email below to login to your account"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit}>
						<div className="flex flex-col gap-6">
							{error && (
								<div className="text-sm text-red-600 text-center">{error}</div>
							)}
							<div className="grid gap-3">
								<Label htmlFor={emailId}>Email</Label>
								<Input
									id={emailId}
									type="email"
									placeholder="m@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
								/>
							</div>
							<div className="grid gap-3">
								<div className="flex items-center">
									<Label htmlFor={passwordId}>Password</Label>
									<button
										type="button"
										className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
									>
										Forgot your password?
									</button>
								</div>
								<Input
									id={passwordId}
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
							</div>
							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading
									? isSignUp
										? "Creating account..."
										: "Signing in..."
									: isSignUp
										? "Create account"
										: "Login"}
							</Button>
							<div className="mt-4 text-center text-sm">
								{isSignUp
									? "Already have an account? "
									: "Don't have an account? "}
								<button
									type="button"
									onClick={() => {
										setIsSignUp(!isSignUp);
										setError("");
									}}
									className="underline underline-offset-4"
								>
									{isSignUp ? "Sign in" : "Sign up"}
								</button>
							</div>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
