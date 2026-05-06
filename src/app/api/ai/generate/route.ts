import { generateAllPosts } from "@/lib/ai/gemini";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { topic } = await request.json();

		if (!topic) {
			return NextResponse.json(
				{ success: false, error: "Topic is required" },
				{ status: 400 },
			);
		}

		const posts = await generateAllPosts(topic);

		return NextResponse.json({
			success: true,
			data: posts,
		});
	} catch (error) {
		console.error("Error generating posts:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to generate posts" },
			{ status: 500 },
		);
	}
}
