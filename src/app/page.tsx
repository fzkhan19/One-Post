"use client";

import { LinkedInAuth } from "@/components/LinkedInAuth";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Home() {
	const [accessToken, setAccessToken] = useState("");
	const [postContent, setPostContent] = useState("");

	const handlePost = async () => {
		try {
			const response = await fetch("/api/post", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-linkedin-token": accessToken,
				},
				body: JSON.stringify({
					content: postContent,
				}),
			});

			const data = await response.json();
			if (data.success) {
				console.log("Post published successfully:", data);
				setPostContent(""); // Clear the text area after successful post
			} else {
				console.error("Failed to publish post:", data.error);
			}
		} catch (error) {
			console.error("Error posting:", error);
		}
	};

	return (
		<article className="flex min-h-[100dvh] flex-col space-y-10 px-6 pt-8 pb-40 md:pt-24">
			<div className="mx-auto w-full max-w-2xl space-y-8">
				<LinkedInAuth
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					clientId={process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID!}
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					redirectUri={process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI!}
					onSuccess={setAccessToken}
				/>

				<div className="space-y-4">
					<textarea
						value={postContent}
						onChange={(e) => setPostContent(e.target.value)}
						className="w-full rounded border p-4"
						placeholder="Enter your post content"
					/>
					<Button
						onClick={handlePost}
						className="rounded bg-purple-600 px-4 py-2 text-white"
						disabled={!accessToken}
					>
						Post to All Platforms
					</Button>
				</div>
			</div>
		</article>
	);
}
