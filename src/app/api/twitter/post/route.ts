import { postToTwitter } from "@/lib/platforms/twitter";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { content, mediaPath } = await request.json();

		if (!content) {
			return NextResponse.json(
				{ success: false, error: "Content is required" },
				{ status: 400 },
			);
		}

		const result = await postToTwitter(content, mediaPath);

		if (result.success) {
			return NextResponse.json({
				success: true,
				message: "Posted to Twitter successfully",
				data: result.data,
			});
		}
		return NextResponse.json(
			{
				success: false,
				error: result.error || "Failed to post to Twitter",
			},
			{ status: 500 },
		);
	} catch (error) {
		console.error("Error in Twitter API route:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}
