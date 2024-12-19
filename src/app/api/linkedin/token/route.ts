import {NextResponse} from "next/server";

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
		console.log("ACCESS TOKEN:::", data.access_token);

		// Call the LinkedIn API to get user info
		const userInfoResponse = await fetch(
			"https://api.linkedin.com/v2/userinfo",
			{
				headers: {
					Authorization: `Bearer ${data.access_token}`,
				},
			},
		);
		const userInfo = await userInfoResponse.json();

		return NextResponse.json({ ...data, userInfo });
	} catch (error) {
		return NextResponse.json({ error: "Failed to get token" }, { status: 500 });
	}
}
