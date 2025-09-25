import type { Bookmark } from "@/lib/schemas";

const BOOKMARK_FUZZY_THRESHOLD = 0.45;
export const BOOKMARK_STRONG_MATCH_THRESHOLD = 0.8;

type BookmarkMatch = {
	bookmark: Bookmark;
	score: number;
};

export function rankBookmarks(
	bookmarks: Bookmark[],
	query: string,
	options?: { threshold?: number },
): BookmarkMatch[] {
	const trimmedQuery = query.trim();
	if (trimmedQuery.length === 0) {
		return bookmarks.map((bookmark) => ({ bookmark, score: 1 }));
	}

	const threshold = options?.threshold ?? BOOKMARK_FUZZY_THRESHOLD;
	const normalizedQuery = trimmedQuery.toLowerCase();
	const sanitizedQuery = sanitizeForSearch(normalizedQuery);

	return bookmarks
		.map((bookmark, index) => {
			const score = computeBookmarkScore(
				bookmark,
				normalizedQuery,
				sanitizedQuery,
			);
			return { bookmark, score, index } as const;
		})
		.filter((entry) => entry.score >= threshold)
		.sort((a, b) => {
			if (b.score !== a.score) {
				return b.score - a.score;
			}
			return a.index - b.index;
		})
		.map((entry) => ({ bookmark: entry.bookmark, score: entry.score }));
}

export function normalizeUrlForComparison(url: string): string {
	const fallback = url.trim().replace(/\s+/g, "").toLowerCase();
	try {
		const parsed = new URL(url);
		const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
		const pathname = parsed.pathname.replace(/\/+$/, "");
		const normalizedPath = pathname === "/" ? "" : pathname;
		const search = parsed.search;
		return `${hostname}${normalizedPath}${search}`;
	} catch {
		return fallback;
	}
}

export function extractComparableHostname(url: string): string {
	try {
		const parsed = new URL(url);
		return parsed.hostname.toLowerCase().replace(/^www\./, "");
	} catch {
		return url.trim().toLowerCase();
	}
}

function computeBookmarkScore(
	bookmark: Bookmark,
	normalizedQuery: string,
	sanitizedQuery: string,
): number {
	const fields: string[] = [
		bookmark.title,
		bookmark.domain ?? "",
		bookmark.url,
	];
	if (bookmark.description) {
		fields.push(bookmark.description);
	}

	const hasSanitizedQuery = sanitizedQuery.length > 0;
	let bestScore = 0;
	for (const field of fields) {
		if (!field) continue;
		const normalizedField = field.toLowerCase();
		if (normalizedField.includes(normalizedQuery)) {
			return 1;
		}

		let fieldScore = 0;
		if (hasSanitizedQuery) {
			const sanitizedField = sanitizeForSearch(normalizedField);
			if (sanitizedField.length === 0) {
				continue;
			}
			if (sanitizedField.includes(sanitizedQuery)) {
				const lengthRatio =
					sanitizedQuery.length /
					Math.max(sanitizedField.length, sanitizedQuery.length);
				fieldScore = Math.max(
					fieldScore,
					0.85 + Math.min(0.15, lengthRatio * 0.15),
				);
			}
			const subsequenceScoreValue = subsequenceScore(
				sanitizedField,
				sanitizedQuery,
			);
			if (subsequenceScoreValue > fieldScore) {
				fieldScore = subsequenceScoreValue;
			}
			const editScore = editDistanceScore(sanitizedField, sanitizedQuery);
			if (editScore > fieldScore) {
				fieldScore = editScore;
			}
		} else {
			const subsequenceScoreValue = subsequenceScore(
				normalizedField,
				normalizedQuery,
			);
			if (subsequenceScoreValue > fieldScore) {
				fieldScore = subsequenceScoreValue;
			}
		}

		if (fieldScore > bestScore) {
			bestScore = fieldScore;
		}
	}

	return Math.min(1, bestScore);
}

function sanitizeForSearch(text: string): string {
	return text.replace(/[^a-z0-9]/g, "");
}

function subsequenceScore(text: string, pattern: string): number {
	if (pattern.length === 0) {
		return 1;
	}
	let patternIndex = 0;
	let lastMatchIndex = -1;
	let gap = 0;
	for (
		let index = 0;
		index < text.length && patternIndex < pattern.length;
		index++
	) {
		if (text[index] !== pattern[patternIndex]) {
			continue;
		}
		if (lastMatchIndex !== -1) {
			gap += index - lastMatchIndex - 1;
		}
		lastMatchIndex = index;
		patternIndex++;
	}
	if (patternIndex === 0) {
		return 0;
	}
	const completeness = patternIndex / pattern.length;
	const gapPenalty = gap / Math.max(text.length, 1);
	const cohesion = 1 - Math.min(gapPenalty, 0.6);
	return Math.min(0.9, completeness * 0.75 + cohesion * 0.25);
}

function editDistanceScore(text: string, pattern: string): number {
	if (pattern.length === 0 || pattern.length > 64) {
		return 0;
	}
	const maxDistance = maxDistanceFor(pattern.length);
	if (maxDistance === 0) {
		return 0;
	}
	const distance = bestWindowDistance(text, pattern, maxDistance);
	if (distance === null || distance > maxDistance) {
		return 0;
	}
	const base = 1 - distance / (pattern.length + 1);
	return base > 0 ? Math.min(0.95, base) : 0;
}

function maxDistanceFor(length: number): number {
	if (length <= 2) {
		return 0;
	}
	if (length <= 4) {
		return 1;
	}
	if (length <= 8) {
		return 2;
	}
	return 3;
}

function bestWindowDistance(
	text: string,
	pattern: string,
	maxDistance: number,
): number | null {
	if (pattern.length === 0) {
		return 0;
	}
	if (text.length === 0) {
		return pattern.length;
	}
	const window = pattern.length + maxDistance;
	const maxSliceStart = Math.max(text.length - pattern.length, 0);
	const seen = new Set<number>();
	const candidates: number[] = [];
	const register = (start: number) => {
		const bounded = Math.max(0, Math.min(start, maxSliceStart));
		if (!seen.has(bounded)) {
			seen.add(bounded);
			candidates.push(bounded);
		}
	};
	register(0);
	register(maxSliceStart);
	const firstChar = pattern[0];
	for (
		let index = 0;
		index <= maxSliceStart && candidates.length < pattern.length + 6;
		index++
	) {
		if (text[index] === firstChar) {
			register(index);
		}
	}
	const step = Math.max(1, Math.floor(pattern.length / 2));
	for (
		let index = step;
		index < maxSliceStart && candidates.length < pattern.length + 6;
		index += step
	) {
		register(index);
	}
	candidates.sort((a, b) => a - b);
	let best = maxDistance + 1;
	for (const start of candidates) {
		const slice = text.slice(start, Math.min(text.length, start + window));
		const distance = boundedLevenshtein(slice, pattern, maxDistance);
		if (distance < best) {
			best = distance;
			if (best === 0) {
				break;
			}
		}
	}
	return best;
}

function boundedLevenshtein(
	text: string,
	pattern: string,
	maxDistance: number,
): number {
	const textLength = text.length;
	const patternLength = pattern.length;
	if (Math.abs(textLength - patternLength) > maxDistance) {
		return maxDistance + 1;
	}
	const previous = new Array<number>(patternLength + 1);
	const current = new Array<number>(patternLength + 1);
	for (let j = 0; j <= patternLength; j++) {
		previous[j] = j;
	}
	for (let i = 1; i <= textLength; i++) {
		const from = Math.max(1, i - maxDistance);
		const to = Math.min(patternLength, i + maxDistance);
		current[0] = i;
		let rowMin = current[0];
		for (let j = 1; j < from; j++) {
			current[j] = Number.MAX_SAFE_INTEGER;
		}
		for (let j = from; j <= to; j++) {
			const cost = text[i - 1] === pattern[j - 1] ? 0 : 1;
			const deletion = previous[j] + 1;
			const insertion = current[j - 1] + 1;
			const substitution = previous[j - 1] + cost;
			const value = Math.min(deletion, insertion, substitution);
			current[j] = value;
			if (value < rowMin) {
				rowMin = value;
			}
		}
		for (let j = to + 1; j <= patternLength; j++) {
			current[j] = Number.MAX_SAFE_INTEGER;
		}
		if (rowMin > maxDistance) {
			return maxDistance + 1;
		}
		for (let j = 0; j <= patternLength; j++) {
			previous[j] = current[j];
		}
	}
	return previous[patternLength];
}
