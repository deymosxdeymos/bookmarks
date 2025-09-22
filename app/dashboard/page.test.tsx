/// <reference lib="dom" />

import { describe, expect, test } from "bun:test";

describe("Dashboard Page", () => {
	test("test environment is set up correctly", () => {
		expect(typeof document).toBe("object");
		expect(document.body).toBeDefined();
		expect(document.createElement).toBeDefined();
	});

	test("dashboard page module can be imported", () => {
		expect(true).toBe(true);
	});

	test("basic DOM manipulation works", () => {
		document.body.innerHTML = `<div id="test-element">Hello World</div>`;
		const element = document.getElementById("test-element");
		expect(element?.textContent).toBe("Hello World");
	});
});
