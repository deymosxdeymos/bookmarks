import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

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
			<body
				className={`${arial.variable} ${geistMono.variable} h-full overflow-hidden antialiased`}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					{children}
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	);
}
