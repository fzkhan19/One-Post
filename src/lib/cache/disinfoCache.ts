import fs from "node:fs/promises";
import path from "node:path";
import type { DisinformationResult } from "@/lib/ai/disinformation";

export interface MediaAssetInfo {
	url: string;
	filename: string;
	sizeKb: number;
	prompt?: string;
	type?: "image" | "video";
	model?: string;
	generatedAt?: number;
}

export interface DisinfoRunBatch {
	runId: string; // e.g. "run-1"
	runIndex: number; // 1, 2, 3...
	topic: string;
	vector: string;
	platforms: string[];
	result: DisinformationResult;
	images?: Partial<
		Record<"twitter" | "instagram" | "tiktok", MediaAssetInfo | null>
	> | null;
	videos?: Partial<
		Record<"twitter" | "instagram" | "tiktok", MediaAssetInfo | null>
	> | null;
	// Main image & video fallbacks
	image?: MediaAssetInfo | null;
	video?: MediaAssetInfo | null;
	createdAt: number;
}

const RUNS_FILE_PATH = path.join(
	process.cwd(),
	"public",
	"generated",
	"disinfo_runs_history.json",
);

/**
 * Reads all recorded disinformation run batches.
 */
export async function getDisinfoRuns(): Promise<DisinfoRunBatch[]> {
	try {
		const data = await fs.readFile(RUNS_FILE_PATH, "utf-8");
		const list = JSON.parse(data) as DisinfoRunBatch[];
		return Array.isArray(list) ? list : [];
	} catch {
		return [];
	}
}

/**
 * Records a new disinformation run batch into persistent storage (e.g. run-1, run-2).
 */
export async function recordDisinfoRunBatch(
	entry: Omit<DisinfoRunBatch, "runId" | "runIndex" | "createdAt">,
): Promise<DisinfoRunBatch> {
	const runs = await getDisinfoRuns();
	const nextIndex = runs.length + 1;
	const runId = `run-${nextIndex}`;
	const createdAt = Date.now();

	const newBatch: DisinfoRunBatch = {
		...entry,
		runId,
		runIndex: nextIndex,
		createdAt,
	};

	runs.push(newBatch);

	try {
		const dir = path.dirname(RUNS_FILE_PATH);
		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(RUNS_FILE_PATH, JSON.stringify(runs, null, 2), "utf-8");
	} catch (err) {
		console.warn("[DisinfoCache] Failed to write runs history:", err);
	}

	return newBatch;
}

/**
 * Clears recorded run batches.
 */
export async function clearDisinfoRuns(): Promise<number> {
	const runs = await getDisinfoRuns();
	const count = runs.length;
	try {
		const dir = path.dirname(RUNS_FILE_PATH);
		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(RUNS_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
	} catch (err) {
		console.warn("[DisinfoCache] Failed to clear runs history:", err);
	}
	return count;
}
