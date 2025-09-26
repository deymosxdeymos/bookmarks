import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		browserDebugInfoInTerminal: true,
	},
	images: {
		formats: ["image/avif", "image/webp"],
		remotePatterns: [
			{ protocol: "https", hostname: "**" },
			{ protocol: "http", hostname: "**" },
		],
	},
	async headers() {
		const isDev = process.env.NODE_ENV === "development";
		const scriptSrc = isDev
			? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
			: "script-src 'self' 'unsafe-inline'";
		const connectSrcSegments = ["connect-src", "'self'", "https:"];
		if (isDev) {
			connectSrcSegments.push("ws:", "wss:");
		} else {
			connectSrcSegments.push("wss:");
		}
		const connectSrc = connectSrcSegments.join(" ");

		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "Content-Security-Policy",
						value: [
							"default-src 'self'",
							"base-uri 'self'",
							"form-action 'self'",
							"frame-ancestors 'none'",
							"img-src 'self' data: https: http:",
							scriptSrc,
							"style-src 'self' 'unsafe-inline'",
							connectSrc,
							"font-src 'self' data:",
						].join("; "),
					},
					{ key: "Referrer-Policy", value: "no-referrer" },
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), geolocation=()",
					},
					{ key: "X-Frame-Options", value: "DENY" },
					{
						key: "Strict-Transport-Security",
						value: "max-age=31536000; includeSubDomains; preload",
					},
				],
			},
		];
	},
};

export default nextConfig;
