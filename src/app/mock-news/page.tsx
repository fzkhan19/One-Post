"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
	DisinformationResult,
	DisinformationVector,
	Platform,
} from "@/lib/ai/disinformation";
import {
	Activity,
	ArrowLeft,
	Bookmark,
	Check,
	CheckCircle2,
	Clock,
	Copy,
	Database,
	Download,
	Globe,
	Heart,
	Image as ImageIcon,
	Loader2,
	MessageCircle,
	MoreHorizontal,
	Music2,
	RefreshCw,
	Repeat2,
	Share2,
	Sparkles,
	Video as VideoIcon,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const VECTORS: {
	id: DisinformationVector;
	name: string;
	tag: string;
	description: string;
	color: string;
	activeBg: string;
	activeBorder: string;
}[] = [
	{
		id: "fabricated_breaking_news",
		name: "Breaking News Hoax",
		tag: "Fabricated Event",
		description:
			"Urgent breaking-news framing with simulated insider or unnamed sources.",
		color: "text-red-500",
		activeBg: "bg-red-500/5 dark:bg-red-500/10",
		activeBorder: "border-red-500",
	},
	{
		id: "conspiracy_leak",
		name: "Conspiracy Leak",
		tag: "Covert Agenda",
		description:
			"Alleged suppressed documents or hidden institutional motives.",
		color: "text-amber-500",
		activeBg: "bg-amber-500/5 dark:bg-amber-500/10",
		activeBorder: "border-amber-500",
	},
	{
		id: "ragebait_emotional",
		name: "Ragebait & Outrage",
		tag: "Polarization",
		description:
			"Extreme emotional provocation targeting socio-political fractures.",
		color: "text-purple-500",
		activeBg: "bg-purple-500/5 dark:bg-purple-500/10",
		activeBorder: "border-purple-500",
	},
	{
		id: "misleading_statistics",
		name: "Statistical Distortion",
		tag: "Pseudo-Empirical",
		description:
			"Manipulated percentages, false correlations, or spurious consensus.",
		color: "text-blue-500",
		activeBg: "bg-blue-500/5 dark:bg-blue-500/10",
		activeBorder: "border-blue-500",
	},
	{
		id: "satire_parody",
		name: "Adversarial Satire",
		tag: "Mimicry Blur",
		description:
			"Dry irony imitating official corporate or governmental communications.",
		color: "text-emerald-500",
		activeBg: "bg-emerald-500/5 dark:bg-emerald-500/10",
		activeBorder: "border-emerald-500",
	},
];

const EXAMPLE_TOPICS: {
	title: string;
	topic: string;
	vector: DisinformationVector;
	category: string;
}[] = [
	{
		title: "Digital Euro Currency Freeze",
		topic:
			"European Central Bank announces emergency liquidity freeze on digital euro commercial transfers",
		vector: "fabricated_breaking_news",
		category: "Financial / Breaking",
	},
	{
		title: "Satellite Telecom Zero-Day",
		topic:
			"Global telecommunications alliance suppresses internal audit revealing critical zero-day in orbital routing hubs",
		vector: "conspiracy_leak",
		category: "Security / Covert",
	},
	{
		title: "Offshore Energy Reserve Discrepancy",
		topic:
			"Independent audit report claims 42% of recorded national offshore wind reserve capacity is mathematically overstated",
		vector: "misleading_statistics",
		category: "Energy / Statistical",
	},
	{
		title: "Mandatory Corporate AI Layoff Quotas",
		topic:
			"Leaked ministry proposal outlines mandatory workforce displacement targets for tech firms implementing automation",
		vector: "ragebait_emotional",
		category: "Policy / Polarization",
	},
	{
		title: "Official Workplace Siesta Mandate",
		topic:
			"EU Commission accidentally publishes draft directive requiring certified 45-minute afternoon rest pauses in all offices",
		vector: "satire_parody",
		category: "Labor / Satire",
	},
];

export default function MockNewsPage() {
	const [topic, setTopic] = useState("");
	const [vector, setVector] = useState<DisinformationVector>(
		"fabricated_breaking_news",
	);
	const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([
		"twitter",
		"instagram",
		"tiktok",
	]);
	const [previewPlatform, setPreviewPlatform] = useState<Platform>("twitter");
	const [includeImage, setIncludeImage] = useState(true);
	const [includeVideo, setIncludeVideo] = useState(false);
	const [mediaModel, setMediaModel] = useState<"flux" | "flux2">("flux");
	const [useCache, setUseCache] = useState(true);

	const [isGenerating, setIsGenerating] = useState(false);
	const [progress, setProgress] = useState(0);
	const [progressStep, setProgressStep] = useState("");
	const [activeStage, setActiveStage] = useState<number>(0);
	const [result, setResult] = useState<
		| (DisinformationResult & {
				image?: { url: string; filename: string; sizeKb: number } | null;
				video?: { url: string; filename: string; sizeKb: number } | null;
				media?: { url: string; filename: string; sizeKb: number } | null;
				isCached?: boolean;
				cachedAt?: number;
		  })
		| null
	>(null);
	const [sparkStatus, setSparkStatus] = useState<{
		comfyui: string;
		ollama: string;
		vram: string;
	} | null>(null);

	const togglePlatform = (p: Platform) => {
		setSelectedPlatforms((prev) => {
			if (prev.includes(p)) {
				if (prev.length === 1) {
					toast.warning("At least one target platform must remain selected.");
					return prev;
				}
				const updated = prev.filter((item) => item !== p);
				if (previewPlatform === p && updated.length > 0) {
					setPreviewPlatform(updated[0]);
				}
				return updated;
			}
			return [...prev, p];
		});
	};

	const applyExampleTopic = (example: (typeof EXAMPLE_TOPICS)[0]) => {
		setTopic(example.topic);
		setVector(example.vector);
		toast.info(`Loaded scenario: "${example.title}"`);
	};

	// Query Spark status on mount
	useEffect(() => {
		fetch("/api/spark/status")
			.then((res) => res.json())
			.then((data) => {
				if (data?.spark) setSparkStatus(data.spark);
			})
			.catch(() => {});
	}, []);

	const handleGenerate = async (forceRegenerate = false) => {
		if (!topic.trim()) {
			toast.error("Please enter a scenario or topic prompt.");
			return;
		}

		if (selectedPlatforms.length === 0) {
			toast.error("Please select at least one platform.");
			return;
		}

		setIsGenerating(true);
		setProgress(5);
		setActiveStage(1);
		setProgressStep(
			forceRegenerate
				? "Bypassing cache & initializing fresh synthesis..."
				: "Checking 30-day cache & initializing pipeline...",
		);
		setResult(null);

		const totalEstimatedSeconds = includeVideo ? 80 : includeImage ? 16 : 6;
		const intervalMs = 250;
		const progressPerTick = 92 / ((totalEstimatedSeconds * 1000) / intervalMs);

		let currentProgress = 5;
		const progressTimer = setInterval(() => {
			currentProgress = Math.min(currentProgress + progressPerTick, 94);
			setProgress(Math.floor(currentProgress));

			if (currentProgress < 30) {
				setActiveStage(1);
				setProgressStep(
					"Stage 1/3: Generating narrative copy for target platforms...",
				);
			} else if (currentProgress < 75) {
				setActiveStage(2);
				if (includeImage) {
					setProgressStep(
						`Stage 2/3: Dispatching media generation to Spark 2 (${mediaModel === "flux2" ? "Flux.2 Dev" : "Flux Schnell"})...`,
					);
				} else {
					setProgressStep("Stage 2/3: Formatting virality and metadata...");
				}
			} else {
				setActiveStage(3);
				if (includeVideo) {
					setProgressStep("Stage 3/3: Rendering video asset on Spark 2 GPU...");
				} else {
					setProgressStep("Stage 3/3: Assembling social mock structures...");
				}
			}
		}, intervalMs);

		try {
			const response = await fetch("/api/ai/disinformation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					topic,
					vector,
					platforms: selectedPlatforms,
					platform: selectedPlatforms[0],
					generateImage: includeImage,
					generateVideo: includeVideo,
					mediaModel,
					useCache: forceRegenerate ? false : useCache,
					forceRegenerate,
				}),
			});

			clearInterval(progressTimer);

			if (!response.ok) {
				let errMessage = `HTTP ${response.status}`;
				try {
					const errJson = await response.json();
					errMessage = errJson.error || errMessage;
				} catch (_) {
					const errText = await response.text();
					if (errText) errMessage = errText.slice(0, 120);
				}
				toast.error(`Generation error: ${errMessage}`);
				return;
			}

			const data = await response.json();
			if (data.success) {
				setProgress(100);
				setProgressStep("Generation complete");
				setActiveStage(3);
				setResult(data.data);

				if (data.data.isCached) {
					toast.success("Loaded from 30-day cache (saved GPU compute & time)!");
				} else {
					toast.success("Fresh mock news payload generated and cached!");
				}
			} else {
				toast.error(data.error || "Failed to generate mock news.");
			}
		} catch (err: unknown) {
			clearInterval(progressTimer);
			console.error(err);
			const errorMessage =
				err instanceof Error ? err.message : "An unexpected error occurred.";
			toast.error(errorMessage);
		} finally {
			clearInterval(progressTimer);
			setTimeout(() => {
				setIsGenerating(false);
			}, 300);
		}
	};

	const copyCurrentPost = () => {
		if (!result) return;
		const textToCopy =
			result.platforms?.[previewPlatform]?.text || result.postContent;
		navigator.clipboard.writeText(textToCopy);
		toast.success(`Copied ${previewPlatform} text`);
	};

	const downloadJsonPayload = () => {
		if (!result) return;
		const exportData = {
			headline: result.headline,
			selectedPlatform: previewPlatform,
			postContent: result.postContent,
			platforms: result.platforms,
			suggestedImagePrompt: result.suggestedImagePrompt,
			suggestedVideoPrompt: result.suggestedVideoPrompt,
			imageUrl: result.image?.url || null,
			videoUrl: result.video?.url || null,
			isCached: result.isCached || false,
			cachedAt: result.cachedAt || null,
			generatedAt: new Date().toISOString(),
		};
		const blob = new Blob([JSON.stringify(exportData, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `mock-news-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("JSON exported");
	};

	const downloadMediaFile = (url?: string, filename?: string) => {
		if (!url || !filename) return;
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
		toast.success(`Downloading ${filename}`);
	};

	return (
		<div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
			{/* Top Bar */}
			<header className="sticky top-0 z-30 border-zinc-200 border-b bg-white/95 backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/95">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
					<div className="flex items-center gap-3">
						<Link
							href="/"
							className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
						>
							<ArrowLeft className="h-3.5 w-3.5" />
							<span>Dashboard</span>
						</Link>
						<span className="text-zinc-300 dark:text-zinc-700">/</span>
						<span className="font-semibold text-xs tracking-tight">
							Mock News Generator
						</span>
					</div>

					{/* Cluster & Cache Status Indicator */}
					<div className="flex items-center gap-2 text-xs">
						<div className="hidden items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] text-zinc-500 sm:flex dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
							<Database className="h-3 w-3 text-zinc-400" />
							<span>30-Day Cache Active</span>
						</div>
						<div className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
							<span
								className={`h-2 w-2 rounded-full ${
									sparkStatus?.comfyui === "ONLINE"
										? "bg-emerald-500"
										: "bg-amber-500"
								}`}
							/>
							<span>
								Spark 2:{" "}
								{sparkStatus
									? `${sparkStatus.comfyui} (${sparkStatus.vram})`
									: "Detecting..."}
							</span>
						</div>
					</div>
				</div>
			</header>

			{/* Main Workspace */}
			<main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
				{/* Section Header */}
				<div className="space-y-1">
					<h1 className="font-bold text-xl text-zinc-900 tracking-tight sm:text-2xl dark:text-white">
						Synthetic News & Virality Lab
					</h1>
					<p className="text-sm text-zinc-500 dark:text-zinc-400">
						Generate synthetic news scenarios, provocative narratives, and
						multi-platform assets to test automated content moderation and
						detection filters.
					</p>
				</div>

				{/* Quick Example Target Topics */}
				<div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
					<div className="flex items-center justify-between">
						<span className="font-medium text-xs text-zinc-700 dark:text-zinc-300">
							Example Target Topics
						</span>
						<span className="text-[11px] text-zinc-400">
							Click to quickly populate scenario and manipulation vector
						</span>
					</div>

					<div className="flex flex-wrap gap-2 pt-1">
						{EXAMPLE_TOPICS.map((ex) => (
							<button
								key={ex.title}
								type="button"
								onClick={() => applyExampleTopic(ex)}
								className="group flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50/70 px-2.5 py-1.5 text-left text-xs transition-colors hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
							>
								<span className="font-medium text-zinc-800 dark:text-zinc-200">
									{ex.title}
								</span>
								<span className="rounded-sm bg-zinc-200 px-1 py-0.2 font-medium text-[10px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
									{ex.category}
								</span>
							</button>
						))}
					</div>
				</div>

				{/* Input & Configurations Grid */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
					{/* Left Column: Topic & Vectors (7 cols) */}
					<div className="space-y-5 lg:col-span-7">
						{/* Topic Input */}
						<div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
							<Label
								htmlFor="topic-input"
								className="block font-medium text-xs text-zinc-700 dark:text-zinc-300"
							>
								Target Topic or Scenario Prompt
							</Label>
							<Input
								id="topic-input"
								value={topic}
								onChange={(e) => setTopic(e.target.value)}
								placeholder="e.g. Central Bank declares emergency digital currency restrictions..."
								className="mt-2 h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm focus:border-zinc-900 focus:ring-0 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-100"
							/>
						</div>

						{/* Manipulation Vector Selector */}
						<div className="space-y-2.5 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
							<div className="flex items-center justify-between">
								<span className="font-medium text-xs text-zinc-700 dark:text-zinc-300">
									Manipulation Vector
								</span>
								<span className="text-[11px] text-zinc-500">
									Selected: {VECTORS.find((v) => v.id === vector)?.tag}
								</span>
							</div>

							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								{VECTORS.map((v) => {
									const isSelected = vector === v.id;
									return (
										<button
											key={v.id}
											type="button"
											onClick={() => setVector(v.id)}
											className={`flex flex-col justify-between rounded-md border p-3 text-left transition-colors ${
												isSelected
													? `${v.activeBorder}${v.activeBg} ring-1 ring-current`
													: "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 hover:bg-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:border-zinc-700"
											}`}
										>
											<div className="space-y-1">
												<div className="flex items-center justify-between">
													<span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
														{v.name}
													</span>
													{isSelected && (
														<CheckCircle2
															className={`h-3.5 w-3.5 ${v.color}`}
														/>
													)}
												</div>
												<p className="text-[11px] text-zinc-500 leading-snug dark:text-zinc-400">
													{v.description}
												</p>
											</div>
											<span
												className={`mt-2 inline-block w-fit rounded-sm px-1.5 py-0.5 font-medium text-[10px] ${
													isSelected
														? `${v.color} bg-white dark:bg-zinc-800`
														: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
												}`}
											>
												{v.tag}
											</span>
										</button>
									);
								})}
							</div>
						</div>
					</div>

					{/* Right Column: Platform & Engine Controls (5 cols) */}
					<div className="space-y-5 lg:col-span-5">
						<div className="space-y-5 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
							{/* Platforms */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="font-medium text-xs text-zinc-700 dark:text-zinc-300">
										Target Platforms
									</span>
									<span className="text-[11px] text-zinc-500">
										{selectedPlatforms.length}/3 selected
									</span>
								</div>

								<div className="grid grid-cols-3 gap-2">
									{(
										[
											{
												id: "twitter",
												label: "𝕏 Twitter",
												aspect: "16:9",
											},
											{
												id: "instagram",
												label: "Instagram",
												aspect: "1:1",
											},
											{ id: "tiktok", label: "TikTok", aspect: "9:16" },
										] as const
									).map((p) => {
										const isSelected = selectedPlatforms.includes(p.id);
										return (
											<button
												key={p.id}
												type="button"
												onClick={() => togglePlatform(p.id)}
												className={`flex flex-col items-center justify-center rounded-md border py-2 text-xs transition-colors ${
													isSelected
														? "border-zinc-900 bg-zinc-900 font-medium text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
														: "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400"
												}`}
											>
												<span>{p.label}</span>
												<span className="text-[10px] opacity-70">
													{p.aspect}
												</span>
											</button>
										);
									})}
								</div>
							</div>

							{/* Spark 2 Media Settings */}
							<div className="space-y-3 border-zinc-100 border-t pt-3 dark:border-zinc-800">
								<span className="block font-medium text-[11px] text-zinc-500 uppercase tracking-wider">
									Synthetic Media
								</span>

								{/* Image toggle */}
								<div className="rounded-md border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-800/30">
									<div className="flex items-center justify-between">
										<span className="font-medium text-xs text-zinc-800 dark:text-zinc-200">
											Image Asset (Flux)
										</span>
										<input
											type="checkbox"
											checked={includeImage}
											onChange={(e) => setIncludeImage(e.target.checked)}
											className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-zinc-900 accent-zinc-900 focus:ring-0 dark:border-zinc-600 dark:accent-zinc-100"
										/>
									</div>

									{includeImage && (
										<div className="flex items-center gap-2 pt-2 text-[11px]">
											<span className="text-zinc-500">Model:</span>
											<div className="flex rounded-md border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
												<button
													type="button"
													onClick={() => setMediaModel("flux")}
													className={`rounded-sm px-2 py-0.5 font-medium transition-colors ${
														mediaModel === "flux"
															? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
															: "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
													}`}
												>
													Flux Schnell
												</button>
												<button
													type="button"
													onClick={() => setMediaModel("flux2")}
													className={`rounded-sm px-2 py-0.5 font-medium transition-colors ${
														mediaModel === "flux2"
															? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
															: "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
													}`}
												>
													Flux.2 Dev
												</button>
											</div>
										</div>
									)}
								</div>

								{/* Video toggle */}
								<div className="rounded-md border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-800/30">
									<div className="flex items-center justify-between">
										<span className="font-medium text-xs text-zinc-800 dark:text-zinc-200">
											Video Asset (Hunyuan)
										</span>
										<input
											type="checkbox"
											checked={includeVideo}
											onChange={(e) => setIncludeVideo(e.target.checked)}
											className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-zinc-900 accent-zinc-900 focus:ring-0 dark:border-zinc-600 dark:accent-zinc-100"
										/>
									</div>
									{includeVideo && (
										<p className="pt-1 text-[11px] text-zinc-500">
											~3s dynamic video clip rendered on Spark 2 GPU
										</p>
									)}
								</div>
							</div>

							{/* 30-Day Cache Preference Control */}
							<div className="space-y-1.5 border-zinc-100 border-t pt-3 dark:border-zinc-800">
								<div className="flex items-center justify-between">
									<span className="font-medium text-xs text-zinc-800 dark:text-zinc-200">
										Use 30-Day Media Cache
									</span>
									<input
										type="checkbox"
										checked={useCache}
										onChange={(e) => setUseCache(e.target.checked)}
										className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-zinc-900 accent-zinc-900 focus:ring-0 dark:border-zinc-600 dark:accent-zinc-100"
									/>
								</div>
								<p className="text-[11px] text-zinc-500">
									Reuses existing matching media files instead of re-rendering.
									Uncheck to force fresh generation.
								</p>
							</div>

							{/* Primary Generate Button */}
							<button
								type="button"
								onClick={() => handleGenerate(false)}
								disabled={isGenerating || !topic.trim()}
								className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-zinc-900 font-medium text-white text-xs transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
							>
								{isGenerating ? (
									<span className="flex items-center gap-2">
										<Loader2 className="h-4 w-4 animate-spin" />
										Generating mock news payload...
									</span>
								) : (
									<span className="flex items-center gap-2">
										<Sparkles className="h-4 w-4" />
										Synthesize Mock News
									</span>
								)}
							</button>
						</div>

						{/* Progress Bar */}
						{isGenerating && (
							<div className="space-y-2.5 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
								<div className="flex items-center justify-between text-xs">
									<span className="font-medium text-zinc-700 dark:text-zinc-300">
										{progressStep || "Processing..."}
									</span>
									<span className="font-mono text-zinc-500">{progress}%</span>
								</div>

								<div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
									<div
										className="h-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100"
										style={{ width: `${progress}%` }}
									/>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Results Section */}
				{result && (
					<div className="space-y-6 pt-4">
						{/* Headline Banner */}
						<div className="flex flex-col justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-4 md:flex-row md:items-center dark:border-zinc-800 dark:bg-zinc-900">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<span className="font-medium text-[11px] text-zinc-500 uppercase tracking-wider">
										Synthesized Headline
									</span>
									{result.isCached && (
										<span className="flex items-center gap-1 rounded-sm bg-emerald-500/10 px-2 py-0.5 font-medium text-[10px] text-emerald-600 dark:text-emerald-400">
											<Zap className="h-3 w-3" /> Reused 30-Day Cached Media
										</span>
									)}
								</div>
								<h2 className="font-semibold text-lg text-zinc-900 tracking-tight dark:text-white">
									{result.headline}
								</h2>
							</div>

							<div className="flex shrink-0 flex-wrap items-center gap-2">
								{/* Button to Force Regenerate if Cached */}
								{result.isCached && (
									<button
										type="button"
										onClick={() => handleGenerate(true)}
										disabled={isGenerating}
										className="flex items-center gap-1.5 rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 font-medium text-xs text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
									>
										<RefreshCw className="h-3.5 w-3.5" /> Regenerate Fresh
									</button>
								)}
								<button
									type="button"
									onClick={copyCurrentPost}
									className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 font-medium text-xs text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-750"
								>
									<Copy className="h-3.5 w-3.5" /> Copy Text
								</button>
								<button
									type="button"
									onClick={downloadJsonPayload}
									className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 font-medium text-xs text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-750"
								>
									<Download className="h-3.5 w-3.5" /> Export JSON
								</button>
							</div>
						</div>

						{/* 2-Column Split: Draft Text & Media Asset */}
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
							{/* Draft Text Preview (7 cols) */}
							<div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 lg:col-span-7 dark:border-zinc-800 dark:bg-zinc-900">
								<div className="flex items-center justify-between border-zinc-100 border-b pb-2 dark:border-zinc-800">
									<div className="flex items-center gap-2">
										<span className="font-medium text-xs text-zinc-700 dark:text-zinc-300">
											Draft Preview:
										</span>
										<div className="flex gap-1">
											{selectedPlatforms.map((p) => (
												<button
													key={p}
													type="button"
													onClick={() => setPreviewPlatform(p)}
													className={`rounded-sm px-2 py-0.5 font-medium text-[11px] capitalize transition-colors ${
														previewPlatform === p
															? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
															: "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
													}`}
												>
													{p}
												</button>
											))}
										</div>
									</div>
									<span className="font-mono text-[11px] text-zinc-400">
										{
											(
												result.platforms?.[previewPlatform]?.text ||
												result.postContent
											).length
										}{" "}
										chars
									</span>
								</div>

								<Textarea
									value={
										result.platforms?.[previewPlatform]?.text ||
										result.postContent
									}
									readOnly
									rows={7}
									className="w-full resize-none rounded-md border border-zinc-200 bg-zinc-50/60 p-3 text-sm leading-relaxed dark:border-zinc-800 dark:bg-zinc-800/50"
								/>
							</div>

							{/* Media Asset Preview (5 cols) */}
							<div className="space-y-4 lg:col-span-5">
								{/* Image Box */}
								<div className="space-y-2.5 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<span className="font-medium text-xs text-zinc-700 dark:text-zinc-300">
												Generated Image Asset
											</span>
											{result.isCached && (
												<span className="rounded-sm bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:bg-zinc-800">
													cached
												</span>
											)}
										</div>
										{result.image && (
											<span className="font-mono text-[10px] text-zinc-400">
												{result.image.sizeKb} KB
											</span>
										)}
									</div>

									{result.image?.url ? (
										<div className="space-y-2">
											<div className="max-h-[200px] overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950">
												<img
													src={result.image.url}
													alt="Synthesized asset"
													className="h-full w-full object-cover"
												/>
											</div>
											<div className="flex items-center justify-between text-xs">
												<span className="max-w-[180px] truncate text-[11px] text-zinc-500">
													{result.image.filename}
												</span>
												<button
													type="button"
													onClick={() =>
														downloadMediaFile(
															result.image?.url,
															result.image?.filename,
														)
													}
													className="rounded-md border border-zinc-200 px-2 py-0.5 text-xs text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
												>
													Download
												</button>
											</div>
										</div>
									) : (
										<div className="rounded-md border border-zinc-200 border-dashed p-4 text-center text-xs text-zinc-400 dark:border-zinc-800">
											No image asset requested
										</div>
									)}
								</div>

								{/* Video Box */}
								{includeVideo && (
									<div className="space-y-2.5 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span className="font-medium text-xs text-zinc-700 dark:text-zinc-300">
													Generated Video Asset
												</span>
												{result.isCached && (
													<span className="rounded-sm bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:bg-zinc-800">
														cached
													</span>
												)}
											</div>
											{result.video && (
												<span className="font-mono text-[10px] text-zinc-400">
													{result.video.sizeKb} KB
												</span>
											)}
										</div>

										{result.video?.url ? (
											<div className="space-y-2">
												<div className="max-h-[200px] overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950">
													<video
														src={result.video.url}
														controls
														autoPlay
														loop
														muted
														className="h-full w-full object-cover"
													/>
												</div>
												<div className="flex items-center justify-between text-xs">
													<span className="max-w-[180px] truncate text-[11px] text-zinc-500">
														{result.video.filename}
													</span>
													<button
														type="button"
														onClick={() =>
															downloadMediaFile(
																result.video?.url,
																result.video?.filename,
															)
														}
														className="rounded-md border border-zinc-200 px-2 py-0.5 text-xs text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
													>
														Download
													</button>
												</div>
											</div>
										) : (
											<div className="rounded-md border border-zinc-200 border-dashed p-4 text-center text-xs text-zinc-400 dark:border-zinc-800">
												No video asset requested
											</div>
										)}
									</div>
								)}
							</div>
						</div>

						{/* Live Social Previews Container */}
						<div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
							<div className="flex items-center justify-between border-zinc-100 border-b pb-3 dark:border-zinc-800">
								<div>
									<h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
										Authentic Feed Simulation
									</h3>
									<p className="text-xs text-zinc-500">
										Preview how the content renders in social media feeds.
									</p>
								</div>

								{/* Platform switcher tabs */}
								<div className="flex rounded-md border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
									{selectedPlatforms.map((p) => (
										<button
											key={p}
											type="button"
											onClick={() => setPreviewPlatform(p)}
											className={`rounded-sm px-2.5 py-1 font-medium text-xs transition-colors ${
												previewPlatform === p
													? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
													: "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
											}`}
										>
											{p === "twitter"
												? "𝕏 Twitter"
												: p === "instagram"
													? "Instagram"
													: "TikTok"}
										</button>
									))}
								</div>
							</div>

							{/* Feed Card Rendering Container */}
							<div className="flex justify-center p-2 sm:p-4">
								{/* 1. TWITTER / X CARD */}
								{previewPlatform === "twitter" && (
									<div className="w-full max-w-[540px] space-y-3 rounded-xl border border-zinc-200 bg-white p-4 font-sans text-zinc-900 shadow-xs dark:border-zinc-800 dark:bg-black dark:text-white">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2.5">
												<div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 font-bold text-white text-xs dark:bg-zinc-100 dark:text-zinc-900">
													GW
												</div>
												<div>
													<div className="flex items-center gap-1.5">
														<span className="font-semibold text-xs hover:underline">
															Global Wire Network
														</span>
														<span className="text-blue-500 text-xs">✓</span>
														<span className="text-[11px] text-zinc-500">
															@GlobalWireNet
														</span>
													</div>
													<span className="text-[10px] text-zinc-400">
														Breaking Wire Simulation
													</span>
												</div>
											</div>
											<MoreHorizontal className="h-4 w-4 text-zinc-400" />
										</div>

										<p className="whitespace-pre-wrap text-sm text-zinc-800 leading-relaxed dark:text-zinc-200">
											{result.platforms?.twitter?.text || result.postContent}
										</p>

										{(result.video?.url || result.image?.url) && (
											<div className="max-h-[320px] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
												{result.video?.url ? (
													<video
														src={result.video.url}
														controls
														autoPlay
														loop
														muted
														className="h-full max-h-[320px] w-full object-cover"
													/>
												) : (
													<img
														src={result.image?.url}
														alt="Twitter attachment"
														className="h-full max-h-[320px] w-full object-cover"
													/>
												)}
											</div>
										)}

										<div className="flex items-center justify-between border-zinc-100 border-t px-1 pt-2 text-xs text-zinc-500 dark:border-zinc-800">
											<span className="flex items-center gap-1.5">
												<MessageCircle className="h-3.5 w-3.5" /> 1.2K
											</span>
											<span className="flex items-center gap-1.5">
												<Repeat2 className="h-3.5 w-3.5" /> 8.4K
											</span>
											<span className="flex items-center gap-1.5">
												<Heart className="h-3.5 w-3.5" /> 24.1K
											</span>
											<span className="flex items-center gap-1.5">
												<Bookmark className="h-3.5 w-3.5" /> 3.9K
											</span>
											<Share2 className="h-3.5 w-3.5" />
										</div>
									</div>
								)}

								{/* 2. INSTAGRAM FEED CARD */}
								{previewPlatform === "instagram" && (
									<div className="w-full max-w-[420px] overflow-hidden rounded-xl border border-zinc-200 bg-white font-sans text-zinc-900 shadow-xs dark:border-zinc-800 dark:bg-black dark:text-white">
										<div className="flex items-center justify-between border-zinc-100 border-b p-3 dark:border-zinc-800">
											<div className="flex items-center gap-2">
												<div className="h-7 w-7 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-[1.5px]">
													<div className="flex h-full w-full items-center justify-center rounded-full bg-white font-bold text-[9px] text-zinc-900 dark:bg-black dark:text-white">
														IG
													</div>
												</div>
												<span className="font-semibold text-xs">
													breaking.news.daily
												</span>
											</div>
											<MoreHorizontal className="h-4 w-4 text-zinc-400" />
										</div>

										<div className="flex aspect-square items-center justify-center overflow-hidden bg-zinc-100 dark:bg-zinc-900">
											{result.video?.url ? (
												<video
													src={result.video.url}
													controls
													autoPlay
													loop
													muted
													className="h-full w-full object-cover"
												/>
											) : result.image?.url ? (
												<img
													src={result.image.url}
													alt="Instagram asset"
													className="h-full w-full object-cover"
												/>
											) : (
												<span className="text-xs text-zinc-400">
													No media asset
												</span>
											)}
										</div>

										<div className="space-y-2 p-3.5">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<Heart className="h-5 w-5 fill-red-500 text-red-500" />
													<MessageCircle className="h-5 w-5" />
													<Share2 className="h-5 w-5" />
												</div>
												<Bookmark className="h-5 w-5" />
											</div>
											<div className="font-semibold text-xs">41,208 likes</div>
											<div className="text-xs text-zinc-700 leading-relaxed dark:text-zinc-300">
												<span className="mr-1.5 font-semibold text-zinc-900 dark:text-white">
													breaking.news.daily
												</span>
												<span className="whitespace-pre-wrap">
													{result.platforms?.instagram?.text ||
														result.postContent}
												</span>
											</div>
											{result.platforms?.instagram?.engagementPrompt && (
												<div className="font-medium text-[11px] text-blue-500">
													{result.platforms.instagram.engagementPrompt}
												</div>
											)}
											<div className="text-[10px] text-zinc-400 uppercase">
												38 MINUTES AGO
											</div>
										</div>
									</div>
								)}

								{/* 3. TIKTOK VERTICAL CARD */}
								{previewPlatform === "tiktok" && (
									<div className="relative flex h-[560px] w-[310px] flex-col justify-between overflow-hidden rounded-2xl border border-zinc-300 bg-black font-sans text-white shadow-md dark:border-zinc-800">
										<div className="absolute inset-0 z-0 bg-zinc-900">
											{result.video?.url ? (
												<video
													src={result.video.url}
													controls={false}
													autoPlay
													loop
													muted
													className="h-full w-full object-cover"
												/>
											) : result.image?.url ? (
												<img
													src={result.image.url}
													alt="TikTok background"
													className="h-full w-full object-cover opacity-90"
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
													Vertical Media Frame
												</div>
											)}
											<div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
										</div>

										{/* Top indicator */}
										<div className="relative z-10 flex items-center justify-center gap-4 pt-3 font-semibold text-white/80 text-xs">
											<span className="text-white/50">Following</span>
											<span className="border-white border-b pb-0.5 text-white">
												For You
											</span>
										</div>

										{/* Right action icons */}
										<div className="absolute right-2.5 bottom-16 z-10 flex flex-col items-center gap-3 text-white">
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 font-bold text-xs">
												+
											</div>
											<div className="flex flex-col items-center gap-0.5">
												<Heart className="h-5 w-5 fill-white" />
												<span className="font-semibold text-[9px]">142.5K</span>
											</div>
											<div className="flex flex-col items-center gap-0.5">
												<MessageCircle className="h-5 w-5 fill-white" />
												<span className="font-semibold text-[9px]">3,892</span>
											</div>
											<div className="flex flex-col items-center gap-0.5">
												<Bookmark className="h-5 w-5 fill-white" />
												<span className="font-semibold text-[9px]">18.1K</span>
											</div>
											<div className="flex flex-col items-center gap-0.5">
												<Share2 className="h-5 w-5 fill-white" />
												<span className="font-semibold text-[9px]">9,410</span>
											</div>
										</div>

										{/* Bottom caption */}
										<div className="relative z-10 max-w-[230px] space-y-1.5 p-3.5 text-white">
											<span className="block font-semibold text-xs">
												@unfiltered.leaks
											</span>
											<p className="line-clamp-3 text-[11px] text-zinc-200">
												{result.platforms?.tiktok?.text || result.postContent}
											</p>
											{result.platforms?.tiktok?.engagementPrompt && (
												<p className="font-semibold text-[10px] text-amber-300">
													{result.platforms.tiktok.engagementPrompt}
												</p>
											)}
											<div className="flex items-center gap-1.5 text-[9px] text-zinc-400">
												<Music2 className="h-3 w-3" />
												<span className="truncate">
													Original Sound - Global Wire
												</span>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Footer */}
				<footer className="border-zinc-200 border-t pt-4 pb-8 text-xs text-zinc-400 dark:border-zinc-800">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<span>One-Post Synthetic Information Benchmark</span>
						<span>Spark 2 (Qwen 3.8 27B + ComfyUI Flux)</span>
					</div>
				</footer>
			</main>
		</div>
	);
}
