import crypto from "node:crypto";
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

export interface DisinfoCacheEntry {
	key: string;
	topic: string;
	vector: string;
	platforms: string[];
	result: DisinformationResult;
	image?: MediaAssetInfo | null;
	video?: MediaAssetInfo | null;
	createdAt: number;
	expiresAt: number;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const CACHE_FILE_PATH = path.join(
	process.cwd(),
	"public",
	"generated",
	"disinfo_cache_index.json",
);

function normalizeKey(topic: string, vector: string): string {
	const normalized = `${topic.trim().toLowerCase()}_${vector.trim().toLowerCase()}`;
	return crypto
		.createHash("sha256")
		.update(normalized)
		.digest("hex")
		.slice(0, 16);
}

export async function readCacheIndex(): Promise<
	Record<string, DisinfoCacheEntry>
> {
	try {
		const data = await fs.readFile(CACHE_FILE_PATH, "utf-8");
		return JSON.parse(data) as Record<string, DisinfoCacheEntry>;
	} catch {
		return {};
	}
}

export async function writeCacheIndex(
	index: Record<string, DisinfoCacheEntry>,
): Promise<void> {
	try {
		const dir = path.dirname(CACHE_FILE_PATH);
		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(
			CACHE_FILE_PATH,
			JSON.stringify(index, null, 2),
			"utf-8",
		);
	} catch (err) {
		console.warn("[DisinfoCache] Failed to write cache index:", err);
	}
}

async function fileExists(relativePath: string): Promise<boolean> {
	try {
		const fullPath = path.join(
			process.cwd(),
			"public",
			relativePath.replace(/^\//, ""),
		);
		await fs.access(fullPath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Retrieves a cached entry if it exists, is not expired, and referenced media files are intact.
 */
export async function getCachedDisinfo(
	topic: string,
	vector: string,
	requireImage: boolean,
	requireVideo: boolean,
): Promise<DisinfoCacheEntry | null> {
	const key = normalizeKey(topic, vector);
	const index = await readCacheIndex();
	const entry = index[key];

	if (!entry) return null;

	// Check 30-day TTL expiration
	const now = Date.now();
	if (now > entry.expiresAt) {
		delete index[key];
		await writeCacheIndex(index);
		return null;
	}

	// Validate image file presence if requested
	if (requireImage) {
		if (!entry.image?.url || !(await fileExists(entry.image.url))) {
			return null;
		}
	}

	// Validate video file presence if requested
	if (requireVideo) {
		if (!entry.video?.url || !(await fileExists(entry.video.url))) {
			return null;
		}
	}

	return entry;
}

/**
 * Stores or updates a generated mock news payload and its media assets with a 30-day TTL.
 * Associates each media asset directly with its generation prompt and metadata.
 */
export async function setCachedDisinfo(
	topic: string,
	vector: string,
	platforms: string[],
	result: DisinformationResult,
	image?: MediaAssetInfo | null,
	video?: MediaAssetInfo | null,
): Promise<void> {
	const key = normalizeKey(topic, vector);
	const index = await readCacheIndex();

	const now = Date.now();
	const entry: DisinfoCacheEntry = {
		key,
		topic: topic.trim(),
		vector,
		platforms,
		result,
		image: image
			? {
					...image,
					prompt: image.prompt || result.suggestedImagePrompt,
					type: "image",
					generatedAt: image.generatedAt || now,
				}
			: null,
		video: video
			? {
					...video,
					prompt:
						video.prompt ||
						result.suggestedVideoPrompt ||
						result.suggestedImagePrompt,
					type: "video",
					generatedAt: video.generatedAt || now,
				}
			: null,
		createdAt: now,
		expiresAt: now + THIRTY_DAYS_MS,
	};

	index[key] = entry;

	// Purge stale expired items periodically
	for (const [k, v] of Object.entries(index)) {
		if (now > v.expiresAt) {
			delete index[k];
		}
	}

	await writeCacheIndex(index);
}

/**
 * Clears the 30-day mock news cache index completely.
 */
export async function clearDisinfoCache(): Promise<number> {
	const index = await readCacheIndex();
	const count = Object.keys(index).length;
	await writeCacheIndex({});
	return count;
}
