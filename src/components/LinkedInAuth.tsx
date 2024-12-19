import { useEffect, useState } from "react";
import { Button } from "./ui/button";

interface LinkedInAuthProps {
	clientId: string;
	redirectUri: string;
	onSuccess: (token: string) => void;
}

export function LinkedInAuth({
	clientId,
	redirectUri,
	onSuccess,
}: LinkedInAuthProps) {
	const [isProcessing, setIsProcessing] = useState(false);

	useEffect(() => {
		const authCode = localStorage.getItem("linkedin_auth_code");
		if (authCode) {
			handleGetToken(authCode);
			localStorage.removeItem("linkedin_auth_code");
		}
	}, []);

	const handleAuth = () => {
		const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=w_member_social%20profile%20openid`;
		window.location.href = authUrl;
	};

	const handleGetToken = async (code: string) => {
		setIsProcessing(true);
		try {
			const response = await fetch("/api/linkedin/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ code }),
			});

			const data = await response.json();
			if (data.access_token) {
				onSuccess(data.access_token);
			}
		} catch (error) {
			console.error("Error getting token:", error);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div className="space-y-4">
			<Button
				onClick={handleAuth}
				className="rounded bg-blue-600 px-4 py-2 text-white"
				disabled={isProcessing}
			>
				{isProcessing ? "Processing..." : "Authenticate with LinkedIn"}
			</Button>
		</div>
	);
}
