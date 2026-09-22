import fs from "node:fs/promises";
import path from "node:path";
import {
	type DisinformationVector,
	generateDisinformation,
} from "@/lib/ai/disinformation";
import {
	type MediaAssetInfo,
	clearDisinfoRuns,
	getDisinfoRuns,
	recordDisinfoRunBatch,
} from "@/lib/cache/disinfoCache";
import { Spark2Client } from "@/lib/spark2";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const action = searchParams.get("action");

	// Return runs history for the batch gallery
	if (action === "runs" || action === "gallery" || !action) {
		const runs = await getDisinfoRuns();
		// Return latest runs first
		const sorted = [...runs].sort(
			(a, b) => (b.runIndex || 0) - (a.runIndex || 0),
		);
		return NextResponse.json({
			success: true,
			runs: sorted,
		});
	}

	return NextResponse.json({ success: true, runs: [] });
}

export async function DELETE(request: NextRequest) {
	try {
		const clearedRuns = await clearDisinfoRuns();
		return NextResponse.json({
			success: true,
			cleared: clearedRuns,
			message: `Cleared ${clearedRuns} run batches.`,
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
			videoModel = "wan22",
			videoDuration = 10,
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

		// 1. Generate Disinformation Narrative & AI Detection Metadata
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

							// Video dimensions: Twitter 16:9 (832x480), Instagram/TikTok 9:16 vertical (480x832)
							const vidWidth = primaryTarget === "twitter" ? 832 : 480;
							const vidHeight = primaryTarget === "twitter" ? 480 : 832;

							// Frame length calculation:
							// Enforce at least 10 seconds per user requirement
							const targetSec = Math.max(10, Number(videoDuration) || 10);
							// Wan: 16fps -> 10s = 161 frames; 12s = 193 frames; 15s = 241 frames
							const frameLength = Math.round(targetSec * 16) + 1;
							const timeoutMs = targetSec >= 15 ? 600000 : 480000;

							const audioPrompt =
								disinfoResult.suggestedAudioPrompt ||
								`Spokesperson speaking firmly into microphone at press podium: "${disinfoResult.headline}", authentic newsroom speech dialogue, broadcast television acoustics`;

							const vidGen = await sparkClient.generateVideo(videoPrompt, {
								model: "wan22",
								width: vidWidth,
								height: vidHeight,
								length: frameLength,
								steps: 20,
								audioPrompt,
								savePath,
								timeout: timeoutMs,
							});

							videoResult = {
								url: `/generated/${filename}`,
								filename,
								sizeKb: Math.round(vidGen.buffer.length / 1024),
								prompt: videoPrompt,
								type: "video",
								model: "wan22",
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

		// 3. Record run batch into persistent runs history (e.g. run-1, run-2...)
		let runBatch = null;
		try {
			const platformImages: Partial<
				Record<"twitter" | "instagram" | "tiktok", MediaAssetInfo | null>
			> = {};
			const platformVideos: Partial<
				Record<"twitter" | "instagram" | "tiktok", MediaAssetInfo | null>
			> = {};

			for (const p of ["twitter", "instagram", "tiktok"] as const) {
				if (targetPlatforms.includes(p)) {
					platformImages[p] = imageResult;
					platformVideos[p] = videoResult;
				}
			}

			runBatch = await recordDisinfoRunBatch({
				topic,
				vector,
				platforms: targetPlatforms,
				result: disinfoResult,
				images: platformImages,
				videos: platformVideos,
				image: imageResult,
				video: videoResult,
			});
		} catch (batchErr) {
			console.warn(
				"[Disinformation API] Failed to record run batch:",
				batchErr,
			);
		}

		return NextResponse.json({
			success: true,
			data: {
				...disinfoResult,
				media: imageResult || videoResult || null,
				image: imageResult,
				video: videoResult,
				runBatch,
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
