"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Asterisk } from "@/components/ui/asterisk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function LoginForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const emailId = useId();
	const passwordId = useId();
	const emailErrorId = `${emailId}-error`;
	const passwordErrorId = `${passwordId}-error`;
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState<{
		email?: string;
		password?: string;
	}>({});
	const emailRef = useRef<HTMLInputElement>(null);
	const passwordRef = useRef<HTMLInputElement>(null);
	const errorRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const isDirty = email.length > 0 || password.length > 0;

	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (!isDirty || isLoading) {
				return;
			}
			event.preventDefault();
			event.returnValue = "";
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [isDirty, isLoading]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (isLoading) {
			return;
		}

		const trimmedEmail = email.trim();
		const sanitizedPassword = password.replace(/\s+$/, "");
		const nextFieldErrors: { email?: string; password?: string } = {};

		if (!trimmedEmail) {
			nextFieldErrors.email = "Enter your email address.";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
			nextFieldErrors.email = "Enter a valid email address.";
		}

		if (!sanitizedPassword) {
			nextFieldErrors.password = "Enter your password.";
		}

		if (Object.keys(nextFieldErrors).length > 0) {
			setFieldErrors(nextFieldErrors);

			const [firstField] = Object.keys(nextFieldErrors);
			requestAnimationFrame(() => {
				if (firstField === "email") {
					emailRef.current?.focus();
					return;
				}
				if (firstField === "password") {
					passwordRef.current?.focus();
				}
			});
			return;
		}

		setFieldErrors({});
		setEmail(trimmedEmail);
		setPassword(sanitizedPassword);
		setIsLoading(true);

		try {
			await authClient.signIn.email({
				email: trimmedEmail,
				password: sanitizedPassword,
			});
			router.push("/dashboard");
		} catch (_err) {
			setError("Invalid email or password");
			requestAnimationFrame(() => {
				errorRef.current?.focus();
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div
			className={cn(
				"flex h-full flex-col bg-background text-foreground",
				className,
			)}
			style={{
				touchAction: "manipulation",
				WebkitTapHighlightColor: "transparent",
			}}
			{...props}
		>
			<header className="flex items-center justify-between px-4 py-4">
				<Asterisk />
				<Button
					size="sm"
					variant="default"
					className="text-xs font-bold"
					asChild
				>
					<Link href="/sign-up">Sign up</Link>
				</Button>
			</header>
			<main className="flex flex-1 items-center justify-center px-4 pb-8">
				<div className="w-full max-w-md space-y-8">
					<div className="flex justify-center items-center gap-x-2">
						<h1 className="font-medium">Welcome</h1>
						<Asterisk />
					</div>
					<form onSubmit={handleSubmit} className="space-y-6" noValidate>
						{error && (
							<div
								ref={errorRef}
								className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-sm font-medium text-destructive"
								role="alert"
								aria-live="polite"
								tabIndex={-1}
							>
								{error}
							</div>
						)}
						<div className="space-y-2">
							<Input
								ref={emailRef}
								id={emailId}
								type="email"
								placeholder="Enter your email"
								value={email}
								onChange={(event) => {
									setEmail(event.target.value);
									if (fieldErrors.email) {
										setFieldErrors((prev) => ({ ...prev, email: undefined }));
									}
								}}
								autoComplete="email"
								name="email"
								spellCheck={false}
								aria-invalid={Boolean(fieldErrors.email)}
								aria-describedby={fieldErrors.email ? emailErrorId : undefined}
								className="w-full rounded-md border-0 bg-muted text-base"
							/>
							{fieldErrors.email && (
								<p
									id={emailErrorId}
									className="text-sm font-medium text-destructive"
									aria-live="polite"
								>
									{fieldErrors.email}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<div className="relative">
								<Input
									ref={passwordRef}
									id={passwordId}
									type={showPassword ? "text" : "password"}
									placeholder="Enter your password"
									value={password}
									onChange={(event) => {
										setPassword(event.target.value);
										if (fieldErrors.password) {
											setFieldErrors((prev) => ({
												...prev,
												password: undefined,
											}));
										}
									}}
									autoComplete="current-password"
									name="password"
									aria-invalid={Boolean(fieldErrors.password)}
									aria-describedby={
										fieldErrors.password ? passwordErrorId : undefined
									}
									className="w-full rounded-md border-0 bg-muted pr-10 text-base"
								/>
								<button
									type="button"
									onClick={() => setShowPassword((previous) => !previous)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									aria-label={showPassword ? "Hide password" : "Show password"}
									aria-pressed={showPassword}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
							{fieldErrors.password && (
								<p
									id={passwordErrorId}
									className="text-sm font-medium text-destructive"
									aria-live="polite"
								>
									{fieldErrors.password}
								</p>
							)}
						</div>
						<div className="flex items-center justify-between pt-2">
							<Link
								href="/forgot-password"
								className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
							>
								Forgot password?
							</Link>
							<Button type="submit" disabled={isLoading} className="px-6">
								{isLoading && (
									<Loader2
										className="mr-2 h-4 w-4 animate-spin"
										aria-hidden="true"
									/>
								)}
								Log in
							</Button>
						</div>
					</form>
				</div>
			</main>
		</div>
	);
}
