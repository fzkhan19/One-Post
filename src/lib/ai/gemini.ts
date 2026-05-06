import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export type Platform = "linkedin" | "twitter" | "bluesky";

const PROMPTS: Record<Platform, string> = {
	linkedin:
		"Write a professional LinkedIn post about the following topic. Include relevant hashtags and a call to action. Keep it informative and engaging for a professional audience.\n\nTopic: ",
	twitter:
		"Write a concise, engaging tweet about the following topic. Include relevant hashtags. Stay within the character limit (280 characters). Use an informal but impactful tone.\n\nTopic: ",
	bluesky:
		"Write a post for Bluesky about the following topic. Bluesky users appreciate authenticity and community-focused content. Keep it under 300 characters.\n\nTopic: ",
};

export async function generatePost(platform: Platform, topic: string) {
	const prompt = `${PROMPTS[platform]}${topic}`;

	if (process.env.USE_OLLAMA === "true") {
		try {
			const response = await fetch("http://localhost:11434/api/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					model: process.env.OLLAMA_MODEL || "qwen3:8b",
					prompt: prompt,
					stream: false,
				}),
			});
			const data = await response.json();
			return data.response.trim();
		} catch (error) {
			console.error("Error generating with Ollama:", error);
			// Fallback to Gemini if Ollama fails? Or just throw?
			// For now, let's just throw or return error.
			throw new Error("Ollama generation failed");
		}
	}

	const result = await model.generateContent(prompt);
	const response = await result.response;
	return response.text().trim();
}

export async function generateAllPosts(topic: string) {
	const platforms: Platform[] = ["linkedin", "twitter", "bluesky"];
	const results = await Promise.all(
		platforms.map(async (platform) => {
			const content = await generatePost(platform, topic);
			return { platform, content };
		}),
	);
	return results.reduce(
		(acc, { platform, content }) => {
			acc[platform] = content;
			return acc;
		},
		{} as Record<Platform, string>,
	);
}
