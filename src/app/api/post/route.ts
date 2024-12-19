import { NextResponse } from "next/server";

export async function POST(request: Request) {
	const body = await request.json();
	const { content } = body;
	const accessToken = request.headers.get("x-linkedin-token");

	try {
		// First get the person ID
		const profileResponse = await fetch("https://api.linkedin.com/v2/me", {
			headers: {
				"Authorization": `Bearer ${accessToken}`,
				"X-Restli-Protocol-Version": "2.0.0"
			}
		});

		const profileData = await profileResponse.json();
		const personId = profileData.id;

		// Create the post
		const postResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${accessToken}`,
				"Content-Type": "application/json",
				"X-Restli-Protocol-Version": "2.0.0"
			},
			body: JSON.stringify({
				author: `urn:li:person:${personId}`,
				lifecycleState: "PUBLISHED",
				specificContent: {
					"com.linkedin.ugc.ShareContent": {
						shareCommentary: {
							text: content
						},
						shareMediaCategory: "NONE"
					}
				},
				visibility: {
					"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
				}
			})
		});

		const postData = await postResponse.json();

		if (postResponse.status === 201) {
			return NextResponse.json({
				success: true,
				message: "Post published successfully",
				data: postData
			});
		}
			return NextResponse.json({
				success: false,
				error: "Failed to publish post",
				details: postData
			}, {
				status: postResponse.status
			});

	} catch (error) {
		return NextResponse.json({
			success: false,
			error: "Failed to post content",
			details: error
		}, {
			status: 500
		});
	}
}