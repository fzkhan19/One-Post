import { TwitterApi } from "twitter-api-v2";
import fs from "fs/promises";
import path from "path";

const TOKEN_PATH = path.join(process.cwd(), "scratch/twitter-tokens.json");

interface TwitterTokens {
	accessToken: string;
	refreshToken?: string;
	expiresAt?: number;
}

// Read tokens from the local JSON file or environment variables
async function getStoredTokens(): Promise<TwitterTokens | null> {
	try {
		const content = await fs.readFile(TOKEN_PATH, "utf-8");
		return JSON.parse(content) as TwitterTokens;
	} catch {
		// Fallback to environment variables
		const accessToken = process.env.TWITTER_ACCESS_TOKEN || "";
		const refreshToken = process.env.TWITTER_REFRESH_TOKEN || "";
		if (accessToken && refreshToken) {
			return { accessToken, refreshToken };
		}
		return null;
	}
}

// Persist tokens back to the local JSON file
async function saveTokens(tokens: TwitterTokens): Promise<void> {
	try {
		await fs.mkdir(path.dirname(TOKEN_PATH), { recursive: true });
		await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2), "utf-8");
	} catch (error) {
		console.error("Failed to save Twitter tokens:", error);
	}
}

export async function postToTwitter(text: string, mediaPath?: string) {
	try {
		const clientId = process.env.TWITTER_CLIENT_ID || "";
		const clientSecret = process.env.TWITTER_CLIENT_SECRET || "";

		if (!clientId || !clientSecret) {
			throw new Error("TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET are required for OAuth2");
		}

		const tokens = await getStoredTokens();
		if (!tokens) {
			throw new Error("No active Twitter OAuth2 access or refresh tokens found");
		}

		let currentAccessToken = tokens.accessToken;
		const now = Date.now();

		// Check if token is expired or expires in the next 5 minutes
		const isExpired = tokens.expiresAt ? now >= tokens.expiresAt - 5 * 60 * 1000 : true;

		if (isExpired && tokens.refreshToken) {
			console.log("[Twitter OAuth2] Access token expired or missing expiry. Attempting to refresh...");
			const tempClient = new TwitterApi({
				clientId,
				clientSecret,
			});

			const { client: refreshedClient, accessToken, refreshToken, expiresIn } =
				await tempClient.refreshOAuth2Token(tokens.refreshToken);

			// Calculate expiry timestamp
			const expiresAt = Date.now() + (expiresIn || 7200) * 1000;
			
			const updatedTokens = {
				accessToken,
				refreshToken: refreshToken || tokens.refreshToken,
				expiresAt,
			};

			await saveTokens(updatedTokens);
			currentAccessToken = accessToken;
			console.log("[Twitter OAuth2] Tokens refreshed successfully and stored.");
		}

		// Initialize client using user access token
		const client = new TwitterApi(currentAccessToken);
		
		let tweetPayload: { text: string; media?: { media_ids: [string] } } = { text };

		// Handle media attachment if provided
		if (mediaPath) {
			try {
				const resolvedMediaPath = path.isAbsolute(mediaPath)
					? mediaPath
					: path.join(process.cwd(), "public", mediaPath.replace(/^\//, ""));
				
				// Using v1 API media upload requires API key/secret fallback or app context if available
				const appKey = process.env.TWITTER_API_KEY || "";
				const appSecret = process.env.TWITTER_API_SECRET || "";
				const accessTok = process.env.TWITTER_ACCESS_TOKEN || "";
				const accessSec = process.env.TWITTER_ACCESS_SECRET || "";

				if (appKey && appSecret && accessTok && accessSec) {
					const uploadClient = new TwitterApi({
						appKey,
						appSecret,
						accessToken: accessTok,
						accessSecret: accessSec,
					});
					const mediaId = await uploadClient.v1.uploadMedia(resolvedMediaPath);
					tweetPayload.media = { media_ids: [mediaId] };
				}
			} catch (mediaErr) {
				console.warn("[Twitter] Failed uploading media attachment, proceeding with text-only:", mediaErr);
			}
		}

		const result = await client.v2.tweet(tweetPayload);
		
		return { success: true, data: result };
	} catch (error) {
		console.error("Error posting to Twitter via OAuth2:", error);
		return { success: false, error: (error as Error).message };
	}
}
