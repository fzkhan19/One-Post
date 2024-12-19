"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function CodePage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		const code = searchParams.get("code");
		if (code) {
			// Store the code in localStorage or state management solution
			localStorage.setItem("linkedin_auth_code", code);
			console.log("LinkedIn auth code:", code);
			// Redirect back to main page
			router.push("/");
		}
	}, [searchParams, router]);

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<h1 className="font-bold text-xl">
					Processing LinkedIn Authorization...
				</h1>
			</div>
		</div>
	);
}
