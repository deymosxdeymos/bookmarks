import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { LoadingBar } from "@/components/loading-bar";
import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const arial = localFont({
	src: [
		{
			path: "../public/fonts/arial/arial.ttf",
			weight: "400",
			style: "normal",
		},
		{
			path: "../public/fonts/arial/arial-bold.ttf",
			weight: "700",
			style: "normal",
		},
		{
			path: "../public/fonts/arial/arial-italic.ttf",
			weight: "400",
			style: "italic",
		},
		{
			path: "../public/fonts/arial/arial-bold-italic.ttf",
			weight: "700",
			style: "italic",
		},
	],
	variable: "--font-arial",
	display: "swap",
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "bookmarks",
	description: "bookmarks",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning className="h-full overflow-hidden">
			<head>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
				/>
			</head>
			<body
				className={`${arial.variable} ${geistMono.variable} h-full overflow-hidden antialiased`}
			>
				<QueryProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<LoadingBar />
						{children}
						<Toaster />
					</ThemeProvider>
				</QueryProvider>
			</body>
		</html>
	);
}
