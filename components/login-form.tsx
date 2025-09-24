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
import { type LoginInput, loginSchema } from "@/lib/schemas";
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

	const [showPassword, setShowPassword] = useState(false);
	const emailRef = useRef<HTMLInputElement>(null);
	const passwordRef = useRef<HTMLInputElement>(null);
	const errorRef = useRef<HTMLParagraphElement>(null);
	const router = useRouter();

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting, isDirty },
	} = useForm<LoginInput>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const passwordDescribedBy = [
		errors.password ? passwordErrorId : undefined,
		errors.root ? authErrorId : undefined,
	]
		.filter(Boolean)
		.join(" ");
	const passwordDescribedByAttr =
		passwordDescribedBy.length > 0 ? passwordDescribedBy : undefined;

	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (!isDirty || isSubmitting) {
				return;
			}
			event.preventDefault();
			event.returnValue = "";
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [isDirty, isSubmitting]);

	const onSubmit = async (data: LoginInput) => {
		try {
			const { error: signInError } = await authClient.signIn.email({
				email: data.email,
				password: data.password,
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

				setError("root", {
					message: serverMessage ?? fallbackMessage,
				});
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
			setError("root", { message });
			requestAnimationFrame(() => {
				errorRef.current?.focus();
			});
		}
	};

	const emailRegistration = register("email");
	const passwordRegistration = register("password");

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
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-6"
						noValidate
					>
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
							<div className="relative">
								<Input
									{...passwordRegistration}
									ref={(e) => {
										passwordRegistration.ref(e);
										passwordRef.current = e;
									}}
									id={passwordId}
									type={showPassword ? "text" : "password"}
									placeholder="Enter your password…"
									autoComplete="current-password"
									aria-invalid={Boolean(errors.password)}
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
							{errors.password && (
								<p
									id={passwordErrorId}
									className="text-sm font-medium text-destructive"
									aria-live="polite"
								>
									{errors.password.message}
								</p>
							)}
							{errors.root && (
								<p
									ref={errorRef}
									id={authErrorId}
									className="text-sm font-medium text-destructive"
									role="alert"
									aria-live="polite"
									tabIndex={-1}
								>
									{errors.root.message}
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
								disabled={isSubmitting}
								className="px-4 py-3 text-sm font-bold"
							>
								{isSubmitting && (
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
