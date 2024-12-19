import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { code } = await request.json();

		const tokenResponse = await fetch(
			"https://www.linkedin.com/oauth/v2/accessToken",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					grant_type: "authorization_code",
					code,
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					redirect_uri: process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI!,
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					client_id: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID!,
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
				}),
			},
		);

		const data = await tokenResponse.json();
		return NextResponse.json({ data });
	} catch (error) {
		return NextResponse.json({ error: "Failed to get token" }, { status: 500 });
	}
}
