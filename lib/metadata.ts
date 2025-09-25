type MetadataResult = {
	title: string;
	description?: string;
	iconUrl?: string;
	domain: string;
};

const userAgent =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

function decodeHtmlEntities(
	value: string | undefined | null,
): string | undefined {
	if (value == null) return undefined;
	let result = value;
	result = result.replace(/&#(x?[0-9a-fA-F]+);/g, (_m, code: string) => {
		try {
			const isHex = code.startsWith("x") || code.startsWith("X");
			const num = parseInt(isHex ? code.slice(1) : code, isHex ? 16 : 10);
			if (!Number.isFinite(num)) return _m;
			return String.fromCodePoint(num);
		} catch {
			return _m;
		}
	});
	const named: Record<string, string> = {
		amp: "&",
		lt: "<",
		gt: ">",
		quot: '"',
		apos: "'",
		nbsp: " ",
	};
	result = result.replace(/&([a-zA-Z]+);/g, (m, name: string) => {
		const decoded = named[name.toLowerCase()];
		return decoded !== undefined ? decoded : m;
	});
	return result;
}

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
	for (let match = metaRegex.exec(html); match; match = metaRegex.exec(html)) {
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
	}
	return undefined;
}

function extractTitle(html: string): string | undefined {
	const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
	return titleMatch?.[1]?.trim();
}

function extractIcon(html: string, pageUrl: string): string | undefined {
	const linkRegex = /<link[^>]*>/gi;
	for (let match = linkRegex.exec(html); match; match = linkRegex.exec(html)) {
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
	}
	return undefined;
}

async function fetchHtml(
	url: string,
	traceId?: string,
): Promise<string | undefined> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 8000);
	try {
		console.log("[metadata] fetch:direct:start", { traceId, url });
		const response = await fetch(url, {
			headers: {
				"user-agent": userAgent,
				accept: "text/html,application/xhtml+xml",
				"accept-language": "en-US,en;q=0.9",
			},
			signal: controller.signal,
			redirect: "follow",
			next: {
				revalidate: 60 * 60 * 24,
			},
		});
		const contentType = response.headers.get("content-type")?.toLowerCase();
		console.log("[metadata] fetch:direct:response", {
			traceId,
			ok: response.ok,
			status: response.status,
			contentType,
		});

		if (!response.ok) {
			return undefined;
		}

		if (contentType && !contentType.includes("text/html")) {
			return undefined;
		}

		const text = await response.text();
		console.log("[metadata] fetch:direct:ok", { traceId, length: text.length });
		return text;
	} catch (error) {
		console.log("[metadata] fetch:direct:error", {
			traceId,
			error: String(error),
		});
		return undefined;
	} finally {
		clearTimeout(timeoutId);
	}
}

export async function getMetadata(
	url: string,
	traceId?: string,
): Promise<MetadataResult> {
	const domain = cleanDomain(url);
	console.log("[metadata] start", { traceId, url, domain });
	let html = await fetchHtml(url, traceId);

	if (!html) {
		try {
			const baseEnv =
				process.env.NEXT_PUBLIC_APP_URL ||
				process.env.VERCEL_URL ||
				process.env.NEXT_PUBLIC_VERCEL_URL;
			const base = baseEnv
				? baseEnv.startsWith("http")
					? baseEnv
					: `https://${baseEnv}`
				: "http://localhost:3000";
			const proxyUrl = `${base}/api/metadata?url=${encodeURIComponent(url)}`;
			console.log("[metadata] fetch:proxy:start", { traceId, base, proxyUrl });
			const res = await fetch(proxyUrl, {
				next: { revalidate: 60 * 60 * 24 },
				redirect: "follow",
			});
			const contentType = res.headers.get("content-type")?.toLowerCase();
			console.log("[metadata] fetch:proxy:response", {
				traceId,
				ok: res.ok,
				status: res.status,
				contentType,
			});
			if (res.ok) {
				html = await res.text();
				console.log("[metadata] fetch:proxy:ok", {
					traceId,
					length: html.length,
				});
			}
		} catch (error) {
			console.log("[metadata] fetch:proxy:error", {
				traceId,
				error: String(error),
			});
		}
	}

	if (!html) {
		console.log("[metadata] fallback:no-html", { traceId, url, domain });
		return {
			title: domain,
			domain,
			iconUrl: fallbackIcon(domain),
		};
	}

	const metaTitle = decodeHtmlEntities(
		extractMeta(html, ["og:title", "twitter:title", "title"]),
	);
	const titleTagTitle = decodeHtmlEntities(extractTitle(html));
	const title = metaTitle ?? titleTagTitle ?? domain;
	console.log("[metadata] extract:title", {
		traceId,
		from: metaTitle ? "meta" : titleTagTitle ? "title-tag" : "domain",
		valueSample: title ? title.slice(0, 80) : null,
	});

	const description = decodeHtmlEntities(
		extractMeta(html, ["description", "og:description", "twitter:description"]),
	);

	const iconUrl = extractIcon(html, url) ?? fallbackIcon(domain);
	console.log("[metadata] extract:icon", {
		traceId,
		hasIcon: Boolean(iconUrl),
		isFallback: iconUrl ? iconUrl.includes("google.com/s2/favicons") : true,
	});

	const result = {
		title,
		description,
		iconUrl,
		domain,
	};
	console.log("[metadata] done", {
		traceId,
		result: {
			titleSample: title ? title.slice(0, 80) : null,
			descriptionSample: description ? description.slice(0, 80) : null,
			iconUrl,
			domain,
		},
	});
	return result;
}

export function fallbackIcon(domain: string): string {
	return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}
