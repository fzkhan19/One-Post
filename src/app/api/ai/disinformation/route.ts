import fs from "node:fs/promises";
import path from "node:path";
import {
	type DisinformationVector,
	generateDisinformation,
} from "@/lib/ai/disinformation";
import {
	type MediaAssetInfo,
	clearDisinfoCache,
	getCachedDisinfo,
	setCachedDisinfo,
} from "@/lib/cache/disinfoCache";
import { Spark2Client } from "@/lib/spark2";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const topic = searchParams.get("topic") || "";
	const vector = searchParams.get("vector") || "fabricated_breaking_news";
	const requireImage = searchParams.get("requireImage") === "true";
	const requireVideo = searchParams.get("requireVideo") === "true";

	if (!topic) {
		return NextResponse.json({ success: false, cached: false });
	}

	const cached = await getCachedDisinfo(
		topic,
		vector,
		requireImage,
		requireVideo,
	);
	if (cached) {
		return NextResponse.json({
			success: true,
			cached: true,
			data: {
				...cached.result,
				media: cached.image || cached.video || null,
				image: cached.image || null,
				video: cached.video || null,
				isCached: true,
				createdAt: cached.createdAt,
				expiresAt: cached.expiresAt,
			},
		});
	}

	return NextResponse.json({ success: true, cached: false });
}

export async function DELETE() {
	try {
		const clearedCount = await clearDisinfoCache();
		return NextResponse.json({
			success: true,
			cleared: clearedCount,
			message: `Cleared ${clearedCount} cached entries. Fresh generations will now be stored with prompt associations.`,
		});
	} catch (err) {
		return NextResponse.json(
			{ success: false, error: (err as Error).message },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			topic,
			vector = "fabricated_breaking_news",
			platform = "twitter",
			platforms,
			generateMedia = true,
			mediaModel = "flux",
			forceRegenerate = false,
			useCache = true,
		} = body;

		const targetPlatforms =
			Array.isArray(platforms) && platforms.length > 0
				? platforms
				: Array.isArray(platform)
					? platform
					: [platform || "twitter"];

		if (!topic) {
			return NextResponse.json(
				{ success: false, error: "A topic prompt is required." },
				{ status: 400 },
			);
		}

		const shouldGenerateImage =
			body.generateImage !== false &&
			(generateMedia || body.generateImage === true);
		const shouldGenerateVideo = body.generateVideo === true;

		// 1. Check 30-Day Media & Narrative Cache if enabled and not forced
		if (useCache && !forceRegenerate) {
			const cached = await getCachedDisinfo(
				topic,
				vector,
				shouldGenerateImage,
				shouldGenerateVideo,
			);

			if (cached) {
				return NextResponse.json({
					success: true,
					data: {
						...cached.result,
						media: cached.image || cached.video || null,
						image: cached.image || null,
						video: cached.video || null,
						isCached: true,
						cachedAt: cached.createdAt,
						expiresAt: cached.expiresAt,
					},
				});
			}
		}

		// 2. Generate Disinformation Narrative & AI Detection Metadata
		const disinfoResult = await generateDisinformation(
			topic,
			vector as DisinformationVector,
			targetPlatforms,
		);

		let imageResult: MediaAssetInfo | null = null;
		let videoResult: MediaAssetInfo | null = null;

		// 3. Generate Media on Spark 2 Cluster (if requested)
		if (shouldGenerateImage || shouldGenerateVideo) {
			try {
				const spark2Url =
					process.env.SPARK2_URL || "http://pc-4172.kl.dfki.de:8188";
				const ssl = process.env.SPARK2_SSL === "true";

				const sparkClient = new Spark2Client({ apiHost: spark2Url, ssl });
				const available = await sparkClient.isAvailable();

				if (available) {
					const publicDir = path.join(process.cwd(), "public/generated");
					await fs.mkdir(publicDir, { recursive: true });

					// A. Generate Image (Flux)
					if (shouldGenerateImage && disinfoResult.suggestedImagePrompt) {
						try {
							const timestamp = Date.now();
							const filename = `disinfo_img_${timestamp}.png`;
							const savePath = path.join(publicDir, filename);

							const primaryTarget = targetPlatforms[0] || "twitter";
							// Dimensions: Twitter 16:9 (1024x576), Instagram 1:1 (1024x1024), TikTok 9:16 (576x1024)
							const imgWidth =
								primaryTarget === "twitter"
									? 1024
									: primaryTarget === "tiktok"
										? 576
										: 1024;
							const imgHeight =
								primaryTarget === "twitter"
									? 576
									: primaryTarget === "tiktok"
										? 1024
										: 1024;

							const gen = await sparkClient.generateImage(
								disinfoResult.suggestedImagePrompt,
								{
									model: mediaModel === "flux2" ? "flux2" : "flux",
									width: imgWidth,
									height: imgHeight,
									steps: mediaModel === "flux2" ? 20 : 4,
									savePath,
									timeout: 240000,
								},
							);

							imageResult = {
								url: `/generated/${filename}`,
								filename,
								sizeKb: Math.round(gen.buffer.length / 1024),
								prompt: disinfoResult.suggestedImagePrompt,
								type: "image",
								model: mediaModel === "flux2" ? "flux2" : "flux",
								generatedAt: timestamp,
							};
						} catch (imgErr) {
							console.warn(
								"[Disinformation API] Failed generating image:",
								imgErr,
							);
						}
					}

					// B. Generate Video (Hunyuan)
					if (shouldGenerateVideo) {
						try {
							const timestamp = Date.now();
							const filename = `disinfo_vid_${timestamp}.mp4`;
							const savePath = path.join(publicDir, filename);
							const videoPrompt =
								disinfoResult.suggestedVideoPrompt ||
								disinfoResult.suggestedImagePrompt;
							const primaryTarget = targetPlatforms[0] || "twitter";

							// Video dimensions: Twitter 16:9 (848x480), Instagram/TikTok 9:16 vertical (480x848)
							const vidWidth = primaryTarget === "twitter" ? 848 : 480;
							const vidHeight = primaryTarget === "twitter" ? 480 : 848;

							const vidGen = await sparkClient.generateVideo(videoPrompt, {
								model: "hunyuan",
								width: vidWidth,
								height: vidHeight,
								length: 73, // ~3 seconds at 24fps
								steps: 12,
								savePath,
								timeout: 480000,
							});

							videoResult = {
								url: `/generated/${filename}`,
								filename,
								sizeKb: Math.round(vidGen.buffer.length / 1024),
								prompt: videoPrompt,
								type: "video",
								model: "hunyuan",
								generatedAt: timestamp,
							};
						} catch (vidErr) {
							console.warn(
								"[Disinformation API] Failed generating video:",
								vidErr,
							);
						}
					}
				} else {
					console.warn(
						"[Disinformation API] Spark 2 media cluster is offline or unreachable:",
						spark2Url,
					);
				}
				sparkClient.close();
			} catch (mediaErr) {
				console.warn(
					"[Disinformation API] Failed connecting to Spark 2 media cluster:",
					mediaErr,
				);
			}
		}

		// 4. Save newly generated entry into 30-Day Cache with Associated Prompts
		try {
			await setCachedDisinfo(
				topic,
				vector,
				targetPlatforms,
				disinfoResult,
				imageResult,
				videoResult,
			);
		} catch (cacheErr) {
			console.warn("[Disinformation API] Failed to write cache:", cacheErr);
		}

		return NextResponse.json({
			success: true,
			data: {
				...disinfoResult,
				media: imageResult || videoResult || null,
				image: imageResult,
				video: videoResult,
				isCached: false,
			},
		});
	} catch (error) {
		console.error("[Disinformation API Error]:", error);
		return NextResponse.json(
			{
				success: false,
				error: (error as Error).message || "Failed to generate mock news",
			},
			{ status: 500 },
		);
	}
}
