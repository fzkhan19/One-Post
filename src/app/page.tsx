"use client";

import { AccountManager } from "@/components/AccountManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Check, LayoutDashboard, Link2, Loader2, PlusCircle, Send, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";

type Platform = "linkedin" | "twitter" | "bluesky";

function HomeContent() {
	const searchParams = useSearchParams();
	const [accessToken, setAccessToken] = useState("");
	const [topic, setTopic] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [isPosting, setIsPosting] = useState(false);
	const [activeTab, setActiveTab] = useState("composer");

	const [posts, setPosts] = useState<Record<Platform, string>>({
		linkedin: "",
		twitter: "",
		bluesky: "",
	});

	const [selectedPlatforms, setSelectedPlatforms] = useState<Record<Platform, boolean>>({
		linkedin: true,
		twitter: false,
		bluesky: false,
	});

	// Load token from localStorage on mount and check for auth code
	useEffect(() => {
		const savedToken = localStorage.getItem("linkedin_access_token");
		if (savedToken) {
			setAccessToken(savedToken);
		}

		const authCode = searchParams.get("code") || localStorage.getItem("linkedin_auth_code");
		if (authCode) {
			handleGetLinkedInToken(authCode);
			localStorage.removeItem("linkedin_auth_code");
		}
	}, [searchParams]);

	const handleGetLinkedInToken = async (code: string) => {
		try {
			const response = await fetch("/api/linkedin/token", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code }),
			});

			const result = await response.json();
			const tokenData = result.access_token ? result : result.data;

			if (tokenData?.access_token) {
				handleLinkedInSuccess(tokenData.access_token, tokenData.expires_in);
				// Clean URL
				window.history.replaceState({}, "", "/");
			}
		} catch (error) {
			console.error("Error getting LinkedIn token:", error);
			toast.error("Failed to connect LinkedIn");
		}
	};

	const handleLinkedInSuccess = (token: string, expiresIn?: number) => {
		setAccessToken(token);
		localStorage.setItem("linkedin_access_token", token);

		if (expiresIn) {
			const expirationDate = Date.now() + expiresIn * 1000;
			localStorage.setItem("linkedin_token_expiration", expirationDate.toString());
		}

		toast.success("LinkedIn connected successfully!");
	};

	const handleDisconnect = (platform: string) => {
		if (platform === "linkedin") {
			setAccessToken("");
			localStorage.removeItem("linkedin_access_token");
			localStorage.removeItem("linkedin_token_expiration");
			toast.info("LinkedIn disconnected");
		}
	};

	const handleGenerate = async () => {
		if (!topic) {
			toast.error("Please enter a topic first");
			return;
		}

		setIsGenerating(true);
		try {
			const response = await fetch("/api/ai/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ topic }),
			});

			const result = await response.json();
			if (result.success) {
				setPosts(result.data);
				toast.success("Posts generated successfully!");
			} else {
				toast.error(result.error || "Failed to generate posts");
			}
		} catch (error) {
			console.error("Error generating posts:", error);
			toast.error("An error occurred during generation");
		} finally {
			setIsGenerating(false);
		}
	};

	const handlePost = async () => {
		const activePlatforms = (Object.keys(selectedPlatforms) as Platform[]).filter(
			(p) => selectedPlatforms[p]
		);

		if (activePlatforms.length === 0) {
			toast.error("Please select at least one platform");
			return;
		}

		if (selectedPlatforms.linkedin && !accessToken) {
			toast.error("LinkedIn is selected but not connected. Please go to Accounts tab.");
			return;
		}

		setIsPosting(true);
		const results = [];

		for (const platform of activePlatforms) {
			try {
				const endpoint = `/api/${platform}/post`;
				const headers: Record<string, string> = { "Content-Type": "application/json" };

				if (platform === "linkedin") {
					headers["x-linkedin-token"] = accessToken;
				}

				const response = await fetch(endpoint, {
					method: "POST",
					headers,
					body: JSON.stringify({ content: posts[platform] }),
				});

				const data = await response.json();
				results.push({ platform, success: data.success, error: data.error });
			} catch (error) {
				results.push({ platform, success: false, error: (error as Error).message });
			}
		}

		const failures = results.filter((r) => !r.success);
		if (failures.length === 0) {
			toast.success("Posted successfully to all platforms!");
		} else {
			const failureMessages = failures.map((f) => `${f.platform}: ${f.error}`).join(", ");
			toast.error(`Some posts failed: ${failureMessages}`);
		}
		setIsPosting(false);
	};

	const togglePlatform = (platform: Platform) => {
		setSelectedPlatforms((prev) => ({ ...prev, [platform]: !prev[platform] }));
	};

	return (
		<article className="flex min-h-[100dvh] flex-col items-center bg-[#e0e0e0] dark:bg-black p-4 md:p-8 font-mono overflow-auto">
			{/* Grid Background Effect */}
			<div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.07]" 
				style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
			/>

			<div className="w-full max-w-6xl z-10">
				{/* Terminal Window Wrapper */}
				<div className="border-[3px] border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] overflow-hidden">
					{/* Terminal Header */}
					<div className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 flex items-center justify-between border-b-[3px] border-black dark:border-white">
						<div className="flex items-center gap-3">
							<div className="flex gap-1.5">
								<div className="w-3 h-3 bg-red-500 border border-black" />
								<div className="w-3 h-3 bg-yellow-500 border border-black" />
								<div className="w-3 h-3 bg-green-500 border border-black" />
							</div>
							<span className="text-xs font-bold tracking-widest uppercase">ONE_POST_v1.0.4 // TERMINAL</span>
						</div>
						<div className="text-[10px] opacity-70">
							SYS_AUTH: {accessToken ? "ACTIVE" : "PENDING"}
						</div>
					</div>

					<div className="p-6 md:p-10 space-y-12">
						{/* Navigation Tabs - Brutalist Style */}
						<div className="flex justify-start">
							<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
								<TabsList className="flex h-auto p-0 bg-transparent gap-0 border-[3px] border-black dark:border-white">
									<TabsTrigger 
										value="composer" 
										className="px-8 py-3 rounded-none data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black border-r-[3px] border-black dark:border-white transition-none uppercase font-black"
									>
										01. COMPOSER
									</TabsTrigger>
									<TabsTrigger 
										value="accounts" 
										className="px-8 py-3 rounded-none data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black transition-none uppercase font-black"
									>
										02. ACCOUNTS
									</TabsTrigger>
								</TabsList>
							</Tabs>
						</div>

						<AnimatePresence mode="wait">
							{activeTab === "composer" ? (
								<motion.div
									key="composer"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="space-y-12"
								>
									{/* Topic Input Section - Command Line Style */}
									<div className="space-y-6">
										<div className="space-y-4">
											<div className="flex items-center gap-2 text-indigo-600 dark:text-accent font-black text-xl">
												<span className="animate-pulse">▶</span>
												<Label htmlFor="topic" className="uppercase tracking-tighter">
													Input Topic Stream:
												</Label>
											</div>
											<div className="relative group">
												<span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold group-focus-within:text-black dark:group-focus-within:text-white transition-colors">{'>'}</span>
												<Input
													id="topic"
													value={topic}
													onChange={(e) => setTopic(e.target.value)}
													placeholder="SYSTEM_WAITING_FOR_INPUT..."
													className="h-16 text-xl rounded-none border-[3px] border-black dark:border-white focus:ring-0 focus:ring-offset-0 bg-zinc-50 dark:bg-zinc-800 pl-10 pr-6 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none"
												/>
											</div>
										</div>
										<Button 
											onClick={handleGenerate} 
											disabled={isGenerating || !topic}
											className="h-16 w-full rounded-none border-[3px] border-black dark:border-white bg-accent hover:bg-green-400 text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all text-xl font-black uppercase tracking-tighter"
										>
											{isGenerating ? (
												<span className="flex items-center gap-2">
													<Loader2 className="h-6 w-6 animate-spin" />
													EXECUTING_GENERATION...
												</span>
											) : (
												<span className="flex items-center gap-2">
													<Sparkles className="h-6 w-6" />
													INITIALIZE_AI_DRAFT
												</span>
											)}
										</Button>
									</div>

									{/* Platform Grid - Brutalist Cards */}
									<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
										{(Object.keys(posts) as Platform[]).map((platform) => (
											<div
												key={platform}
												className={`border-[3px] transition-all duration-100 ${
													selectedPlatforms[platform]
														? "border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]"
														: "border-zinc-300 dark:border-zinc-700 opacity-40 scale-[0.98]"
												}`}
											>
												<div className="border-b-[3px] border-black dark:border-white bg-zinc-100 dark:bg-zinc-800 px-4 py-3 flex items-center justify-between">
													<div className="flex items-center gap-3">
														<div className={`w-8 h-8 flex items-center justify-center border-2 border-black dark:border-white font-black text-xs ${
															platform === 'linkedin' ? 'bg-[#0077b5] text-white' :
															platform === 'twitter' ? 'bg-black text-white' : 'bg-blue-500 text-white'
														}`}>
															{platform[0].toUpperCase()}
														</div>
														<span className="font-black text-sm uppercase tracking-tighter">{platform}</span>
													</div>
													<input
														type="checkbox"
														checked={selectedPlatforms[platform]}
														onChange={() => togglePlatform(platform)}
														className="w-5 h-5 rounded-none border-2 border-black dark:border-white accent-black dark:accent-white cursor-pointer"
													/>
												</div>

												<div className="p-4 space-y-4">
													<Textarea
														value={posts[platform]}
														onChange={(e) => setPosts(prev => ({ ...prev, [platform]: e.target.value }))}
														placeholder={`// DRAFT_PENDING_${platform.toUpperCase()}`}
														className="min-h-[200px] bg-transparent border-none p-0 focus-visible:ring-0 resize-none text-base font-bold leading-tight placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
														disabled={!selectedPlatforms[platform]}
													/>
													
													{selectedPlatforms[platform] && posts[platform] && (
														<div className="flex justify-between items-center text-[10px] font-black border-t-2 border-black dark:border-white pt-2">
															<span className="uppercase opacity-50">Length Check:</span>
															<span className={posts[platform].length > 280 ? "text-red-500" : ""}>{posts[platform].length} CHARS</span>
														</div>
													)}

													{platform === "linkedin" && !accessToken && selectedPlatforms[platform] && (
														<div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 p-3 space-y-3 mt-4">
															<p className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-widest leading-none animate-pulse">
																CRITICAL: AUTH_TOKEN_MISSING
															</p>
															<Button
																variant="outline"
																size="sm"
																onClick={() => setActiveTab("accounts")}
																className="w-full rounded-none border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white font-black text-[10px] h-8"
															>
																ESTABLISH_CONNECTION
															</Button>
														</div>
													)}
												</div>
											</div>
										))}
									</div>

									{/* Action Footer */}
									<div className="flex justify-center pt-10 pb-10">
										<Button
											onClick={handlePost}
											disabled={isPosting || !Object.values(selectedPlatforms).some(v => v)}
											className="w-full max-w-xl h-20 rounded-none border-[4px] border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-[5px] hover:translate-y-[5px] transition-all text-2xl font-black uppercase tracking-tighter"
										>
											{isPosting ? (
												<span className="flex items-center gap-3">
													<Loader2 className="h-8 w-8 animate-spin" />
													PUSHING_DATA_TO_NODES...
												</span>
											) : (
												<span className="flex items-center gap-3">
													<Send className="h-8 w-8" />
													BROADCAST_TO_SELECTED
												</span>
											)}
										</Button>
									</div>
								</motion.div>
							) : (
								<motion.div
									key="accounts"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="max-w-4xl space-y-10"
								>
									<div className="border-l-[6px] border-black dark:border-white pl-6 py-2 space-y-1">
										<h2 className="text-3xl font-black uppercase tracking-tighter italic">ACCOUNT_MGMT</h2>
										<p className="text-zinc-500 font-bold uppercase text-xs">Verify credentials and manage session stream.</p>
									</div>
									<AccountManager
										linkedInToken={accessToken}
										onLinkedInSuccess={handleLinkedInSuccess}
										onDisconnect={handleDisconnect}
									/>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
				
				{/* System Footer info */}
				<div className="mt-6 flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
					<div>OnePost Terminal Interface // Local Node: {typeof window !== 'undefined' ? window.location.hostname : 'localhost'}</div>
					<div className="flex gap-4">
						<span className="text-accent animate-pulse">● System Ready</span>
						<span>Build: 0.1.0-BRUTAL</span>
					</div>
				</div>
			</div>
		</article>
	);
}

export default function Home() {
	return (
		<Suspense fallback={
			<div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
				<Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
			</div>
		}>
			<HomeContent />
		</Suspense>
	);
}
