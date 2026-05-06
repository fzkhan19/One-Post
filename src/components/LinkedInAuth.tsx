import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { RefreshCcw } from "lucide-react";

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

	const handleAuth = () => {
		const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=w_member_social%20profile%20openid`;
		window.location.href = authUrl;
	};

	return (
		<div className="space-y-4">
			<Button
				onClick={handleAuth}
				className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-white font-semibold transition-all shadow-lg shadow-indigo-500/20"
				disabled={isProcessing}
			>
				{isProcessing ? (
					<>
						<RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
						Connecting...
					</>
				) : (
					"Connect LinkedIn"
				)}
			</Button>
		</div>
	);
}
