import { BskyAgent } from "@atproto/api";

const agent = new BskyAgent({
	service: "https://bsky.social",
});

import fs from "fs/promises";
import path from "path";

export async function postToBluesky(text: string, mediaPath?: string) {
	try {
		await agent.login({
			identifier: process.env.BLUESKY_HANDLE || "",
			password: process.env.BLUESKY_APP_PASSWORD || "",
		});

		let embed: any = undefined;

		if (mediaPath) {
			try {
				const resolvedMediaPath = path.isAbsolute(mediaPath)
					? mediaPath
					: path.join(process.cwd(), "public", mediaPath.replace(/^\//, ""));
				
				const fileData = await fs.readFile(resolvedMediaPath);
				const isPng = resolvedMediaPath.endsWith(".png");
				const isJpg = resolvedMediaPath.endsWith(".jpg") || resolvedMediaPath.endsWith(".jpeg");

				if (isPng || isJpg) {
					const upload = await agent.uploadBlob(fileData, {
						encoding: isPng ? "image/png" : "image/jpeg",
					});

					embed = {
						$type: "app.bsky.embed.images",
						images: [
							{
								alt: "Generated with Spark 2",
								image: upload.data.blob,
							},
						],
					};
				}
			} catch (blobErr) {
				console.warn("[Bluesky] Could not attach media, posting text only:", blobErr);
			}
		}

		const result = await agent.post({
			text: text,
			embed,
			createdAt: new Date().toISOString(),
		});

		return { success: true, data: result };
	} catch (error) {
		console.error("Error posting to Bluesky:", error);
		return { success: false, error: (error as Error).message };
	}
}
