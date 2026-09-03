import { NextRequest, NextResponse } from "next/server";
import { Spark2Client } from "@/lib/spark2";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { prompt, mediaType = "image", model } = body;

		if (!prompt) {
			return NextResponse.json(
				{ success: false, error: "Prompt is required for media generation." },
				{ status: 400 },
			);
		}

		const spark2Url = process.env.SPARK2_URL || "http://pc-4172.kl.dfki.de:8188";
		const ssl = process.env.SPARK2_SSL === "true";

		const client = new Spark2Client({
			apiHost: spark2Url,
			ssl,
		});

		const available = await client.isAvailable();
		if (!available) {
			client.close();
			return NextResponse.json(
				{ success: false, error: "Spark 2 ComfyUI node is not reachable at " + spark2Url },
				{ status: 503 },
			);
		}

		const publicDir = path.join(process.cwd(), "public/generated");
		await fs.mkdir(publicDir, { recursive: true });

		const timestamp = Date.now();

		if (mediaType === "video") {
			const filename = `spark_video_${timestamp}.mp4`;
			const savePath = path.join(publicDir, filename);

			const videoResult = await client.generateVideo(prompt, {
				model: "hunyuan",
				width: 848,
				height: 480,
				length: 73, // ~3 seconds for fast social previews
				steps: 12,
				savePath,
				timeout: 600000,
			});

			client.close();

			return NextResponse.json({
				success: true,
				mediaType: "video",
				url: `/generated/${filename}`,
				filename,
				sizeKb: Math.round(videoResult.buffer.length / 1024),
			});
		} else {
			// Image generation (defaults to Flux Schnell for ultra-fast response)
			const selectedModel = (model === "flux2" ? "flux2" : "flux") as "flux" | "flux2";
			const filename = `spark_image_${timestamp}.png`;
			const savePath = path.join(publicDir, filename);

			const imageResult = await client.generateImage(prompt, {
				model: selectedModel,
				width: 1024,
				height: 1024,
				steps: selectedModel === "flux2" ? 20 : 4,
				savePath,
				timeout: 300000,
			});

			client.close();

			return NextResponse.json({
				success: true,
				mediaType: "image",
				url: `/generated/${filename}`,
				filename,
				sizeKb: Math.round(imageResult.buffer.length / 1024),
			});
		}
	} catch (error) {
		console.error("[Spark2 Media API Error]:", error);
		return NextResponse.json(
			{ success: false, error: (error as Error).message || "Failed to generate media on Spark 2" },
			{ status: 500 },
		);
	}
}
