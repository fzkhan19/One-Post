import { BskyAgent } from "@atproto/api";

const agent = new BskyAgent({
	service: "https://bsky.social",
});

export async function postToBluesky(text: string) {
	try {
		await agent.login({
			identifier: process.env.BLUESKY_HANDLE || "",
			password: process.env.BLUESKY_APP_PASSWORD || "",
		});

		const result = await agent.post({
			text: text,
			createdAt: new Date().toISOString(),
		});

		return { success: true, data: result };
	} catch (error) {
		console.error("Error posting to Bluesky:", error);
		return { success: false, error: (error as Error).message };
	}
}
