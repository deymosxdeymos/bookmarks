import { cache } from "react";

export type MetadataResult = {
	title: string;
	description?: string;
	iconUrl?: string;
	domain: string;
};

const userAgent =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

function cleanDomain(rawUrl: string): string {
	try {
		const hostname = new URL(rawUrl).hostname.toLowerCase();
		return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
	} catch {
		return rawUrl;
	}
}

function toAbsoluteUrl(
	baseUrl: string,
	href?: string | null,
): string | undefined {
	if (!href) {
		return undefined;
	}

	try {
		return new URL(href, baseUrl).toString();
	} catch {
		return undefined;
	}
}

function parseAttributes(tag: string): Record<string, string> {
	const attributes: Record<string, string> = {};
	const attributeRegex = /(\S+)=(["'])([^"']*)\2/g;
	let match = attributeRegex.exec(tag);
	while (match) {
		const key = match[1]?.toLowerCase();
		const value = match[3]?.trim();
		if (key && value) {
			attributes[key] = value;
		}
		match = attributeRegex.exec(tag);
	}
	return attributes;
}

function extractMeta(html: string, targets: string[]): string | undefined {
	const metaRegex = /<meta[^>]*>/gi;
	let match = metaRegex.exec(html);
	while (match) {
		const tag = match[0];
		if (!tag) {
			continue;
		}
		const attributes = parseAttributes(tag);
		const key = attributes.property ?? attributes.name;
		const content = attributes.content;
		if (!key || !content) {
			continue;
		}
		if (targets.includes(key.toLowerCase())) {
			return content;
		}
		match = metaRegex.exec(html);
	}
	return undefined;
}

function extractTitle(html: string): string | undefined {
	const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
	return titleMatch?.[1]?.trim();
}

function extractIcon(html: string, pageUrl: string): string | undefined {
	const linkRegex = /<link[^>]*>/gi;
	let match = linkRegex.exec(html);
	while (match) {
		const tag = match[0];
		if (!tag) {
			continue;
		}
		const attributes = parseAttributes(tag);
		const rel = attributes.rel;
		const href = attributes.href;
		if (!rel || !href) {
			continue;
		}
		const lowerRel = rel.toLowerCase();
		const isIcon = [
			"icon",
			"shortcut icon",
			"apple-touch-icon",
			"apple-touch-icon-precomposed",
		].some((candidate) => lowerRel.includes(candidate));
		if (!isIcon) {
			continue;
		}
		const absolute = toAbsoluteUrl(pageUrl, href);
		if (absolute) {
			return absolute;
		}
		match = linkRegex.exec(html);
	}
	return undefined;
}

async function fetchHtml(url: string): Promise<string | undefined> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 3000);
	try {
		const response = await fetch(url, {
			headers: {
				"user-agent": userAgent,
				accept: "text/html,application/xhtml+xml",
			},
			signal: controller.signal,
			next: {
				revalidate: 60 * 60 * 24,
			},
		});

		if (!response.ok) {
			return undefined;
		}

		const contentType = response.headers.get("content-type")?.toLowerCase();
		if (contentType && !contentType.includes("text/html")) {
			return undefined;
		}

		return await response.text();
	} catch {
		return undefined;
	} finally {
		clearTimeout(timeoutId);
	}
}

export const getMetadata = cache(
	async (url: string): Promise<MetadataResult> => {
		const domain = cleanDomain(url);
		const html = await fetchHtml(url);

		if (!html) {
			return {
				title: domain,
				domain,
				iconUrl: fallbackIcon(domain),
			};
		}

		const title =
			extractMeta(html, ["og:title", "twitter:title", "title"]) ??
			extractTitle(html) ??
			domain;

		const description = extractMeta(html, [
			"description",
			"og:description",
			"twitter:description",
		]);

		const iconUrl = extractIcon(html, url) ?? fallbackIcon(domain);

		return {
			title,
			description,
			iconUrl,
			domain,
		};
	},
);

export function fallbackIcon(domain: string): string {
	return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}
