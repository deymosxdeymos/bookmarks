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
	const authErrorId = useId();
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
	const errorRef = useRef<HTMLParagraphElement>(null);
	const router = useRouter();
	const isDirty = email.length > 0 || password.length > 0;
	const passwordDescribedBy = [
		fieldErrors.password ? passwordErrorId : undefined,
		error ? authErrorId : undefined,
	]
		.filter(Boolean)
		.join(" ");
	const passwordDescribedByAttr =
		passwordDescribedBy.length > 0 ? passwordDescribedBy : undefined;

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
			const { error: signInError } = await authClient.signIn.email({
				email: trimmedEmail,
				password: sanitizedPassword,
			});

			if (signInError) {
				let serverMessage: string | undefined;
				const directMessage =
					typeof signInError.message === "string"
						? signInError.message.trim()
						: "";
				if (directMessage.length > 0) {
					serverMessage = directMessage;
				} else {
					const nestedError = (signInError as { error?: unknown }).error;
					if (typeof nestedError === "string") {
						const nestedText = nestedError.trim();
						if (nestedText.length > 0) {
							serverMessage = nestedText;
						}
					} else if (typeof nestedError === "object" && nestedError !== null) {
						const nestedRecord = nestedError as Record<string, unknown>;
						const nestedMessage = nestedRecord.message;
						if (typeof nestedMessage === "string") {
							const trimmed = nestedMessage.trim();
							if (trimmed.length > 0) {
								serverMessage = trimmed;
							}
						}
					}
				}
				const fallbackMessage =
					signInError.status === 401
						? "Invalid email or password."
						: "Unable to log in right now. Try again in a moment.";

				setError(serverMessage ?? fallbackMessage);
				requestAnimationFrame(() => {
					errorRef.current?.focus();
				});
				return;
			}

			router.push("/dashboard");
		} catch (unknownError) {
			const message =
				unknownError instanceof Error && unknownError.message
					? unknownError.message
					: "Unable to log in right now. Try again in a moment.";
			setError(message);
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
			<main className="flex flex-1 items-center justify-center px-4 pb-8">
				<div className="w-full max-w-md space-y-8">
					<div className="flex justify-center items-center gap-x-2">
						<h1 className="font-semibold text-lg">Welcome</h1>
						<Asterisk />
					</div>
					<form onSubmit={handleSubmit} className="space-y-6" noValidate>
						<div className="space-y-2">
							<Input
								ref={emailRef}
								id={emailId}
								type="email"
								placeholder="Enter your email…"
								value={email}
								onChange={(event) => {
									setEmail(event.target.value);
									if (fieldErrors.email) {
										setFieldErrors((prev) => ({ ...prev, email: undefined }));
									}
									if (error) {
										setError("");
									}
								}}
								autoComplete="email"
								name="email"
								spellCheck={false}
								aria-invalid={Boolean(fieldErrors.email)}
								aria-describedby={fieldErrors.email ? emailErrorId : undefined}
								className="w-full bg-muted text-base"
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
									placeholder="Enter your password…"
									value={password}
									onChange={(event) => {
										setPassword(event.target.value);
										if (fieldErrors.password) {
											setFieldErrors((prev) => ({
												...prev,
												password: undefined,
											}));
										}
										if (error) {
											setError("");
										}
									}}
									autoComplete="current-password"
									name="password"
									aria-invalid={Boolean(fieldErrors.password)}
									aria-describedby={passwordDescribedByAttr}
									className="w-full bg-muted pr-10 text-base"
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
							{error && (
								<p
									ref={errorRef}
									id={authErrorId}
									className="text-sm font-medium text-destructive"
									role="alert"
									aria-live="polite"
									tabIndex={-1}
								>
									{error}
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
							<Button
								size="sm"
								type="submit"
								disabled={isLoading}
								className="px-4 py-3 text-sm font-bold"
							>
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
