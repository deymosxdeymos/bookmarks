import { createSearchParamsCache, parseAsString } from "nuqs/server";

export const searchParamsParsers = {
	search: parseAsString.withDefault("").withOptions({
		scroll: false,
		clearOnDefault: true,
	}),
	category: parseAsString.withOptions({
		scroll: false,
	}),
	sort: parseAsString.withDefault("created-desc").withOptions({
		scroll: false,
	}),
	cursor: parseAsString.withOptions({
		scroll: false,
	}),
};

export const searchParamsCache = createSearchParamsCache(searchParamsParsers);
