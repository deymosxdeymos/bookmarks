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

export function SignUpForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const emailId = useId();
	const usernameId = useId();
	const passwordId = useId();
	const confirmId = useId();

	const emailErrorId = `${emailId}-error`;
	const usernameErrorId = `${usernameId}-error`;
	const passwordErrorId = `${passwordId}-error`;
	const confirmErrorId = `${confirmId}-error`;

	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState<{
		email?: string;
		username?: string;
		password?: string;
		confirmPassword?: string;
	}>({});

	const emailRef = useRef<HTMLInputElement>(null);
	const usernameRef = useRef<HTMLInputElement>(null);
	const passwordRef = useRef<HTMLInputElement>(null);
	const confirmRef = useRef<HTMLInputElement>(null);
	const errorRef = useRef<HTMLDivElement>(null);

	const router = useRouter();

	const isDirty =
		email.length > 0 ||
		username.length > 0 ||
		password.length > 0 ||
		confirmPassword.length > 0;

	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (!isDirty || isLoading) return;
			event.preventDefault();
			event.returnValue = "";
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [isDirty, isLoading]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		if (isLoading) return;

		const trimmedEmail = email.trim();
		const trimmedUsername = username.trim();
		const sanitizedPassword = password.replace(/\s+$/, "");
		const sanitizedConfirm = confirmPassword.replace(/\s+$/, "");

		const nextFieldErrors: {
			email?: string;
			username?: string;
			password?: string;
			confirmPassword?: string;
		} = {};

		if (!trimmedEmail) {
			nextFieldErrors.email = "Enter your email address.";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
			nextFieldErrors.email = "Enter a valid email address.";
		}

		if (!trimmedUsername) {
			nextFieldErrors.username = "Enter a username (3+ characters).";
		} else if (trimmedUsername.length < 3) {
			nextFieldErrors.username = "Username must be at least 3 characters.";
		}

		if (!sanitizedPassword) {
			nextFieldErrors.password = "Enter your password.";
		} else if (sanitizedPassword.length < 8) {
			nextFieldErrors.password = "Password must be at least 8 characters.";
		}

		if (!sanitizedConfirm) {
			nextFieldErrors.confirmPassword = "Confirm your password.";
		} else if (sanitizedConfirm !== sanitizedPassword) {
			nextFieldErrors.confirmPassword = "Passwords do not match.";
		}

		if (Object.keys(nextFieldErrors).length > 0) {
			setFieldErrors(nextFieldErrors);
			const [firstField] = Object.keys(nextFieldErrors);
			requestAnimationFrame(() => {
				if (firstField === "email") emailRef.current?.focus();
				else if (firstField === "username") usernameRef.current?.focus();
				else if (firstField === "password") passwordRef.current?.focus();
				else if (firstField === "confirmPassword") confirmRef.current?.focus();
			});
			return;
		}

		setFieldErrors({});
		setEmail(trimmedEmail);
		setUsername(trimmedUsername);
		setPassword(sanitizedPassword);
		setConfirmPassword(sanitizedConfirm);
		setIsLoading(true);

		try {
			await authClient.signUp.email({
				email: trimmedEmail,
				password: sanitizedPassword,
				name: trimmedUsername,
			});
			router.push("/dashboard");
		} catch (_err) {
			setError("Unable to sign up with those details");
			requestAnimationFrame(() => errorRef.current?.focus());
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
						<h1 className="font-semibold text-lg">Create your account</h1>
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
								placeholder="Enter your email…"
								value={email}
								onChange={(event) => {
									setEmail(event.target.value);
									if (fieldErrors.email)
										setFieldErrors((prev) => ({ ...prev, email: undefined }));
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
							<Input
								ref={usernameRef}
								id={usernameId}
								type="text"
								placeholder="Choose a username…"
								value={username}
								onChange={(event) => {
									setUsername(event.target.value);
									if (fieldErrors.username)
										setFieldErrors((prev) => ({
											...prev,
											username: undefined,
										}));
								}}
								autoComplete="username"
								name="username"
								spellCheck={false}
								aria-invalid={Boolean(fieldErrors.username)}
								aria-describedby={
									fieldErrors.username ? usernameErrorId : undefined
								}
								className="w-full bg-muted text-base"
							/>
							{fieldErrors.username && (
								<p
									id={usernameErrorId}
									className="text-sm font-medium text-destructive"
									aria-live="polite"
								>
									{fieldErrors.username}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<div className="relative">
								<Input
									ref={passwordRef}
									id={passwordId}
									type={showPassword ? "text" : "password"}
									placeholder="Create a password…"
									value={password}
									onChange={(event) => {
										setPassword(event.target.value);
										if (fieldErrors.password)
											setFieldErrors((prev) => ({
												...prev,
												password: undefined,
											}));
									}}
									autoComplete="new-password"
									name="password"
									aria-invalid={Boolean(fieldErrors.password)}
									aria-describedby={
										fieldErrors.password ? passwordErrorId : undefined
									}
									className="w-full bg-muted pr-10 text-base"
								/>
								<button
									type="button"
									onClick={() => setShowPassword((p) => !p)}
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

						<div className="space-y-2">
							<div className="relative">
								<Input
									ref={confirmRef}
									id={confirmId}
									type={showConfirm ? "text" : "password"}
									placeholder="Confirm password…"
									value={confirmPassword}
									onChange={(event) => {
										setConfirmPassword(event.target.value);
										if (fieldErrors.confirmPassword)
											setFieldErrors((prev) => ({
												...prev,
												confirmPassword: undefined,
											}));
									}}
									autoComplete="new-password"
									name="confirmPassword"
									aria-invalid={Boolean(fieldErrors.confirmPassword)}
									aria-describedby={
										fieldErrors.confirmPassword ? confirmErrorId : undefined
									}
									className="w-full bg-muted pr-10 text-base"
								/>
								<button
									type="button"
									onClick={() => setShowConfirm((p) => !p)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									aria-label={
										showConfirm
											? "Hide confirm password"
											: "Show confirm password"
									}
									aria-pressed={showConfirm}
								>
									{showConfirm ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
							{fieldErrors.confirmPassword && (
								<p
									id={confirmErrorId}
									className="text-sm font-medium text-destructive"
									aria-live="polite"
								>
									{fieldErrors.confirmPassword}
								</p>
							)}
						</div>

						<div className="flex items-center justify-between pt-2">
							<Link
								href="/login"
								className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
							>
								Already have an account?
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
								Sign up
							</Button>
						</div>
					</form>
				</div>
			</main>
		</div>
	);
}
