"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Asterisk } from "@/components/ui/asterisk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { type SignUpInput, signUpSchema } from "@/lib/schemas";
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

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const emailRef = useRef<HTMLInputElement>(null);
	const usernameRef = useRef<HTMLInputElement>(null);
	const passwordRef = useRef<HTMLInputElement>(null);
	const confirmRef = useRef<HTMLInputElement>(null);
	const errorRef = useRef<HTMLDivElement>(null);

	const router = useRouter();

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting, isDirty },
	} = useForm<SignUpInput>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			email: "",
			username: "",
			password: "",
			confirmPassword: "",
		},
	});

	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (!isDirty || isSubmitting) return;
			event.preventDefault();
			event.returnValue = "";
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [isDirty, isSubmitting]);

	const onSubmit = async (data: SignUpInput) => {
		try {
			await authClient.signUp.email({
				email: data.email,
				password: data.password,
				name: data.username,
			});
			router.push("/dashboard");
		} catch (_err) {
			setError("root", {
				message: "Unable to sign up with those details",
			});
			requestAnimationFrame(() => errorRef.current?.focus());
		}
	};

	const emailRegistration = register("email");
	const usernameRegistration = register("username");
	const passwordRegistration = register("password");
	const confirmPasswordRegistration = register("confirmPassword");

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
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-6"
						noValidate
					>
						{errors.root && (
							<div
								ref={errorRef}
								className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-sm font-medium text-destructive"
								role="alert"
								aria-live="polite"
								tabIndex={-1}
							>
								{errors.root.message}
							</div>
						)}

						<div className="space-y-2">
							<Input
								{...emailRegistration}
								ref={(e) => {
									emailRegistration.ref(e);
									emailRef.current = e;
								}}
								id={emailId}
								type="email"
								placeholder="Enter your email…"
								autoComplete="email"
								spellCheck={false}
								aria-invalid={Boolean(errors.email)}
								aria-describedby={errors.email ? emailErrorId : undefined}
								className="w-full bg-muted text-base"
							/>
							{errors.email && (
								<p
									id={emailErrorId}
									className="text-sm font-medium text-destructive"
									aria-live="polite"
								>
									{errors.email.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Input
								{...usernameRegistration}
								ref={(e) => {
									usernameRegistration.ref(e);
									usernameRef.current = e;
								}}
								id={usernameId}
								type="text"
								placeholder="Choose a username…"
								autoComplete="username"
								spellCheck={false}
								aria-invalid={Boolean(errors.username)}
								aria-describedby={errors.username ? usernameErrorId : undefined}
								className="w-full bg-muted text-base"
							/>
							{errors.username && (
								<p
									id={usernameErrorId}
									className="text-sm font-medium text-destructive"
									aria-live="polite"
								>
									{errors.username.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<div className="relative">
								<Input
									{...passwordRegistration}
									ref={(e) => {
										passwordRegistration.ref(e);
										passwordRef.current = e;
									}}
									id={passwordId}
									type={showPassword ? "text" : "password"}
									placeholder="Create a password…"
									autoComplete="new-password"
									aria-invalid={Boolean(errors.password)}
									aria-describedby={
										errors.password ? passwordErrorId : undefined
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
							{errors.password && (
								<p
									id={passwordErrorId}
									className="text-sm font-medium text-destructive"
									aria-live="polite"
								>
									{errors.password.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<div className="relative">
								<Input
									{...confirmPasswordRegistration}
									ref={(e) => {
										confirmPasswordRegistration.ref(e);
										confirmRef.current = e;
									}}
									id={confirmId}
									type={showConfirm ? "text" : "password"}
									placeholder="Confirm password…"
									autoComplete="new-password"
									aria-invalid={Boolean(errors.confirmPassword)}
									aria-describedby={
										errors.confirmPassword ? confirmErrorId : undefined
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
							{errors.confirmPassword && (
								<p
									id={confirmErrorId}
									className="text-sm font-medium text-destructive"
									aria-live="polite"
								>
									{errors.confirmPassword.message}
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
								disabled={isSubmitting}
								className="px-4 py-3 text-sm font-bold"
							>
								{isSubmitting && (
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
