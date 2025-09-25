#!/usr/bin/env bun

import { Client } from "pg";

type ComposeDefaults = {
	POSTGRES_DB: string;
	POSTGRES_USER: string;
	POSTGRES_PASSWORD: string;
	POSTGRES_HOST?: string;
	POSTGRES_PORT?: string;
};

const composeDefaults: ComposeDefaults = {
	POSTGRES_DB: "bookmarks",
	POSTGRES_USER: "postgres",
	POSTGRES_PASSWORD: "postgres",
	POSTGRES_HOST: "127.0.0.1",
	POSTGRES_PORT: "5432",
};

function ensureEnvDefaults() {
	for (const [key, value] of Object.entries(composeDefaults)) {
		if (!process.env[key] || process.env[key]?.length === 0) {
			process.env[key] = value;
		}
	}

	if (!process.env.DATABASE_URL || process.env.DATABASE_URL.length === 0) {
		const user = process.env.POSTGRES_USER as string;
		const password = process.env.POSTGRES_PASSWORD as string;
		const host = process.env.POSTGRES_HOST as string;
		const port = process.env.POSTGRES_PORT as string;
		const database = process.env.POSTGRES_DB as string;
		process.env.DATABASE_URL = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
	}
}

async function runCommand(command: string[], options?: SpawnOptions) {
	const child = Bun.spawn(command, {
		stdout: "inherit",
		stderr: "inherit",
		...options,
	});
	const exitCode = await child.exited;
	if (exitCode !== 0) {
		throw new Error(`Command failed: ${command.join(" ")}`);
	}
}

async function ensureDockerCompose() {
	console.log("[dev] ensuring docker compose postgres is running...");
	try {
		await runCommand(["docker", "compose", "up", "-d", "postgres"], {
			env: process.env,
		});
	} catch (error) {
		console.error("[dev] failed to start docker compose", error);
		throw error;
	}
}

async function waitForDatabase(connectionString: string) {
	const timeout = Date.now() + 20_000;
	while (Date.now() < timeout) {
		const client = new Client({ connectionString });
		try {
			await client.connect();
			await client.end();
			console.log("[dev] postgres is ready");
			return;
		} catch {
			await client.end().catch(() => {});
			await Bun.sleep(500);
		}
	}
	throw new Error("Timed out waiting for Postgres to become available");
}

type SpawnOptions = Parameters<typeof Bun.spawn>[1];

async function startNextDev() {
	console.log("[dev] starting Next.js (turbopack)...");
	const devProcess = Bun.spawn(["bun", "x", "next", "dev", "--turbopack"], {
		stdout: "inherit",
		stderr: "inherit",
		env: {
			...process.env,
		},
	});

	const handleSignal = (signal: NodeJS.Signals) => {
		console.log(`\n[dev] received ${signal}, forwarding to dev server`);
		devProcess.kill(signal);
	};

	process.on("SIGINT", handleSignal);
	process.on("SIGTERM", handleSignal);

	const exitCode = await devProcess.exited;

	process.off("SIGINT", handleSignal);
	process.off("SIGTERM", handleSignal);

	process.exit(exitCode);
}

async function main() {
	if (process.env.NODE_ENV && process.env.NODE_ENV !== "development") {
		console.warn(
			`[dev] NODE_ENV is ${process.env.NODE_ENV}. This helper is intended for local development.`,
		);
	}

	ensureEnvDefaults();
	await ensureDockerCompose();
	await waitForDatabase(process.env.DATABASE_URL as string);
	await startNextDev();
}

main().catch((error) => {
	console.error("[dev] startup failed", error);
	process.exit(1);
});
