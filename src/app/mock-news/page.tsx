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
	AlertTriangle,
	ArrowLeft,
	Bookmark,
	Check,
	CheckCircle2,
	Copy,
	Cpu,
	Download,
	ExternalLink,
	Eye,
	Flame,
	Globe,
	Heart,
	Image as ImageIcon,
	Layers,
	Loader2,
	MessageCircle,
	MoreHorizontal,
	Music2,
	Radio,
	Repeat2,
	Search,
	Send,
	Share2,
	ShieldAlert,
	Sliders,
	Sparkles,
	Terminal,
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
	badgeColor: string;
}[] = [
	{
		id: "fabricated_breaking_news",
		name: "Breaking News Hoax",
		tag: "Fabricated Event",
		description:
			"Urgent breaking-news framing with simulated insider or unnamed sources.",
		badgeColor: "bg-red-500/10 text-red-500 border-red-500/20",
	},
	{
		id: "conspiracy_leak",
		name: "Conspiracy Leak",
		tag: "Covert Agenda",
		description:
			"Alleged suppressed documents or hidden institutional motives.",
		badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
	},
	{
		id: "ragebait_emotional",
		name: "Ragebait & Outrage",
		tag: "Polarization",
		description:
			"Extreme emotional provocation targeting socio-political fractures.",
		badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
	},
	{
		id: "misleading_statistics",
		name: "Statistical Distortion",
		tag: "Pseudo-Empirical",
		description:
			"Manipulated percentages, false correlations, or spurious consensus.",
		badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
	},
	{
		id: "satire_parody",
		name: "Adversarial Satire",
		tag: "Mimicry Blur",
		description:
			"Dry irony imitating official corporate or governmental communications.",
		badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
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

	const [isGenerating, setIsGenerating] = useState(false);
	const [progress, setProgress] = useState(0);
	const [progressStep, setProgressStep] = useState("");
	const [activeStage, setActiveStage] = useState<number>(0);
	const [result, setResult] = useState<
		| (DisinformationResult & {
				image?: { url: string; filename: string; sizeKb: number } | null;
				video?: { url: string; filename: string; sizeKb: number } | null;
				media?: { url: string; filename: string; sizeKb: number } | null;
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
					toast.warning("At least one target platform must be selected.");
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

	// Poll Spark status
	useEffect(() => {
		fetch("/api/spark/status")
			.then((res) => res.json())
			.then((data) => {
				if (data?.spark) setSparkStatus(data.spark);
			})
			.catch(() => {});
	}, []);

	const handleGenerate = async () => {
		if (!topic.trim()) {
			toast.error("Please enter a topic or target scenario.");
			return;
		}

		if (selectedPlatforms.length === 0) {
			toast.error("Please select at least one target platform.");
			return;
		}

		setIsGenerating(true);
		setProgress(5);
		setActiveStage(1);
		setProgressStep(
			"Initializing pipeline & prompting LLM (Qwen 3.8 27B / Gemini)...",
		);
		setResult(null);

		// Progress estimation based on selected media options
		const totalEstimatedSeconds = includeVideo ? 80 : includeImage ? 16 : 6;
		const intervalMs = 250;
		const progressPerTick = 92 / ((totalEstimatedSeconds * 1000) / intervalMs);

		let currentProgress = 5;
		const progressTimer = setInterval(() => {
			currentProgress = Math.min(currentProgress + progressPerTick, 94);
			setProgress(Math.floor(currentProgress));

			if (currentProgress < 25) {
				setActiveStage(1);
				setProgressStep(
					"Phase 1/3: Synthesizing adversarial narrative & multi-platform copy (LLM)...",
				);
			} else if (currentProgress < 75) {
				setActiveStage(2);
				if (includeImage) {
					setProgressStep(
						`Phase 2/3: Dispatching to Spark 2 GPU ComfyUI (${mediaModel === "flux2" ? "Flux.2 Dev" : "Flux Schnell"})...`,
					);
				} else {
					setProgressStep(
						"Phase 2/3: Formatting platform payload & virality metrics...",
					);
				}
			} else {
				setActiveStage(3);
				if (includeVideo) {
					setProgressStep(
						"Phase 3/3: Spark 2 Hunyuan Video neural rendering in progress...",
					);
				} else {
					setProgressStep(
						"Phase 3/3: Assembling social mock structures & final payloads...",
					);
				}
			}
		}, intervalMs);

		try {
			toast.info(
				`Generating mock news for [${selectedPlatforms.join(", ")}]...`,
			);
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
				setProgressStep("Complete: Adversarial payload synthesized!");
				setActiveStage(3);
				setResult(data.data);
				toast.success("Mock news sample (Text + Assets) generated!");
			} else {
				toast.error(data.error || "Failed to generate mock news.");
			}
		} catch (err: unknown) {
			clearInterval(progressTimer);
			console.error(err);
			const errorMessage =
				err instanceof Error
					? err.message
					: "An error occurred during generation (possible timeout).";
			toast.error(errorMessage);
		} finally {
			clearInterval(progressTimer);
			setTimeout(() => {
				setIsGenerating(false);
			}, 500);
		}
	};

	const copyPostToClipboard = () => {
		if (!result) return;
		navigator.clipboard.writeText(result.postContent);
		toast.success("Post text copied to clipboard!");
	};

	const downloadJsonPayload = () => {
		if (!result) return;
		const exportData = {
			headline: result.headline,
			postContent: result.postContent,
			suggestedImagePrompt: result.suggestedImagePrompt,
			suggestedVideoPrompt: result.suggestedVideoPrompt,
			imageUrl: result.image?.url || null,
			videoUrl: result.video?.url || null,
			mediaUrl: result.image?.url || result.video?.url || null,
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
		toast.success("Mock News JSON downloaded.");
	};

	const downloadMediaFile = (url: string, filename: string) => {
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
		toast.success(`Downloading ${filename}`);
	};

	return (
		<article className="min-h-screen overflow-x-hidden bg-gradient-to-b from-zinc-50 via-zinc-100 to-zinc-50 font-sans text-zinc-900 antialiased selection:bg-red-500/20 selection:text-red-500 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-100">
			{/* Background Decorative Glow */}
			<div className="pointer-events-none fixed inset-0 overflow-hidden">
				<div className="-top-40 -translate-x-1/2 absolute left-1/2 h-[400px] w-[1000px] bg-gradient-to-tr from-red-500/10 via-amber-500/10 to-indigo-500/10 blur-[120px] dark:from-red-500/15 dark:via-purple-500/10 dark:to-blue-500/15" />
			</div>

			<div className="relative mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
				{/* Top Navigation Bar */}
				<header className="flex flex-col justify-between gap-4 border-zinc-200/80 border-b pb-6 sm:flex-row sm:items-center dark:border-zinc-800/80">
					<div className="flex items-center gap-3">
						<Link
							href="/"
							className="dark:hover:white inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-semibold text-xs text-zinc-600 shadow-xs transition-all hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-800"
						>
							<ArrowLeft className="h-3.5 w-3.5" />
							<span>Back</span>
						</Link>
						<div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
						<div className="flex items-center gap-2">
							<div className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
							<h1 className="font-semibold text-sm text-zinc-800 uppercase tracking-tight dark:text-zinc-200">
								Synthetic Disinformation Lab
							</h1>
						</div>
					</div>

					{/* Spark 2 Server Status Badge */}
					<div className="flex items-center gap-2.5 text-xs">
						<div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
							<Activity className="h-3.5 w-3.5 text-emerald-500" />
							<span className="font-medium text-zinc-500 dark:text-zinc-400">
								Spark 2:
							</span>
							<span className="font-semibold text-emerald-600 dark:text-emerald-400">
								{sparkStatus?.ollama === "ONLINE"
									? `Online (${sparkStatus.vram})`
									: "Active"}
							</span>
						</div>
					</div>
				</header>

				{/* Hero Section */}
				<section className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/70 p-6 shadow-xl shadow-zinc-950/5 backdrop-blur-xl sm:p-8 dark:border-zinc-800/80 dark:bg-zinc-900/60">
					<div className="max-w-3xl space-y-3">
						<div className="inline-flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 px-2.5 py-1 font-semibold text-red-600 text-xs dark:text-red-400">
							<ShieldAlert className="h-3.5 w-3.5" />
							<span>Adversarial Testing Environment</span>
						</div>
						<h2 className="font-bold text-2xl text-zinc-900 tracking-tight sm:text-3xl dark:text-white">
							Mock News & Virality Generator
						</h2>
						<p className="text-sm text-zinc-600 leading-relaxed dark:text-zinc-400">
							Generate realistic synthetic news payloads, provocative
							narratives, and multi-platform social assets to benchmark
							detection algorithms and stress-test automated moderation
							pipelines.
						</p>
					</div>
				</section>

				{/* Configuration Section */}
				<section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
					{/* Left Column: Topic & Manipulation Vector (7 cols) */}
					<div className="space-y-6 lg:col-span-7">
						{/* Topic Input Box */}
						<div className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/80">
							<div className="flex items-center justify-between">
								<Label className="flex items-center gap-2 font-semibold text-sm text-zinc-900 dark:text-white">
									<Terminal className="h-4 w-4 text-red-500" />
									Target Topic or Scenario
								</Label>
								<span className="text-xs text-zinc-500">
									e.g., Banking Outage, Climate Leak
								</span>
							</div>
							<Input
								value={topic}
								onChange={(e) => setTopic(e.target.value)}
								placeholder="Enter scenario (e.g. Central Bank declares emergency digital currency freeze)..."
								className="h-12 rounded-xl border border-zinc-300 bg-zinc-50/50 text-sm shadow-none transition-all focus:bg-white dark:border-zinc-700 dark:bg-zinc-800/50 dark:focus:bg-zinc-800"
							/>
						</div>

						{/* Vector Selector */}
						<div className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/80">
							<div className="flex items-center justify-between">
								<Label className="flex items-center gap-2 font-semibold text-sm text-zinc-900 dark:text-white">
									<Sliders className="h-4 w-4 text-red-500" />
									Manipulation Vector
								</Label>
								<span className="text-xs text-zinc-500">
									{VECTORS.find((v) => v.id === vector)?.tag}
								</span>
							</div>

							<div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-2">
								{VECTORS.map((v) => {
									const isSelected = vector === v.id;
									return (
										<button
											key={v.id}
											type="button"
											onClick={() => setVector(v.id)}
											className={`relative flex flex-col justify-between gap-2 rounded-xl border p-3.5 text-left text-xs transition-all ${
												isSelected
													? "border-red-500/80 bg-red-500/[0.04] shadow-red-500/5 shadow-xs dark:bg-red-500/10"
													: "border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800/30 dark:text-zinc-400 dark:hover:border-zinc-700"
											}`}
										>
											<div>
												<div className="flex items-center justify-between gap-1.5">
													<span
														className={`font-semibold ${isSelected ? "text-zinc-900 dark:text-white" : ""}`}
													>
														{v.name}
													</span>
													{isSelected && (
														<CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-red-500" />
													)}
												</div>
												<p className="mt-1 text-[11px] text-zinc-500 leading-snug dark:text-zinc-400">
													{v.description}
												</p>
											</div>
											<span
												className={`inline-block w-fit rounded-md border px-2 py-0.5 font-medium text-[10px] ${v.badgeColor}`}
											>
												{v.tag}
											</span>
										</button>
									);
								})}
							</div>
						</div>
					</div>

					{/* Right Column: Platform & Media Controls (5 cols) */}
					<div className="space-y-6 lg:col-span-5">
						<div className="space-y-6 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/80">
							{/* Platform Multi-Select */}
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="flex items-center gap-2 font-semibold text-sm text-zinc-900 dark:text-white">
										<Globe className="h-4 w-4 text-red-500" />
										Target Platforms
									</span>
									<span className="font-mono text-xs text-zinc-500">
										{selectedPlatforms.length}/3 selected
									</span>
								</div>

								<div className="grid grid-cols-3 gap-2">
									{(
										[
											{
												id: "twitter",
												label: "𝕏 Twitter",
												desc: "16:9 Landscape",
											},
											{
												id: "instagram",
												label: "Instagram",
												desc: "1:1 Feed Post",
											},
											{ id: "tiktok", label: "TikTok", desc: "9:16 Vertical" },
										] as const
									).map((p) => {
										const isSelected = selectedPlatforms.includes(p.id);
										return (
											<button
												key={p.id}
												type="button"
												onClick={() => togglePlatform(p.id)}
												className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 font-semibold text-xs transition-all ${
													isSelected
														? "border-zinc-900 bg-zinc-900 text-white shadow-xs dark:border-white dark:bg-white dark:text-zinc-900"
														: "border-zinc-200 bg-zinc-50/50 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800/30 dark:hover:border-zinc-700"
												}`}
											>
												<div className="flex items-center gap-1">
													<span>{p.label}</span>
													{isSelected && (
														<span className="font-bold text-[10px] text-red-500 dark:text-red-600">
															✓
														</span>
													)}
												</div>
												<span className="font-normal text-[9px] opacity-70">
													{p.desc}
												</span>
											</button>
										);
									})}
								</div>
							</div>

							{/* Media Asset Configuration */}
							<div className="space-y-4 border-zinc-200 border-t pt-4 dark:border-zinc-800">
								<span className="block font-semibold text-xs text-zinc-500 uppercase tracking-wider">
									Synthetic Media Engine
								</span>

								{/* Photo toggle */}
								<div className="space-y-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/30">
									<div className="flex items-center justify-between">
										<span className="flex items-center gap-2 font-semibold text-xs text-zinc-900 dark:text-white">
											<ImageIcon className="h-3.5 w-3.5 text-zinc-500" />
											Image Asset Generation
										</span>
										<input
											type="checkbox"
											checked={includeImage}
											onChange={(e) => setIncludeImage(e.target.checked)}
											className="h-4 w-4 cursor-pointer rounded text-red-600 accent-red-600 focus:ring-red-500"
										/>
									</div>

									{includeImage && (
										<div className="flex items-center gap-2 pt-1">
											<span className="font-medium text-[11px] text-zinc-500">
												Model:
											</span>
											<div className="inline-flex rounded-lg border border-zinc-300 bg-zinc-200/70 p-0.5 dark:border-zinc-700 dark:bg-zinc-700/60">
												<button
													type="button"
													onClick={() => setMediaModel("flux")}
													className={`rounded-md px-2.5 py-0.5 font-semibold text-[10px] transition-all ${
														mediaModel === "flux"
															? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
															: "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
													}`}
												>
													Flux Schnell
												</button>
												<button
													type="button"
													onClick={() => setMediaModel("flux2")}
													className={`rounded-md px-2.5 py-0.5 font-semibold text-[10px] transition-all ${
														mediaModel === "flux2"
															? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
															: "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
													}`}
												>
													Flux.2 Dev
												</button>
											</div>
										</div>
									)}
								</div>

								{/* Video toggle */}
								<div className="space-y-1.5 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/30">
									<div className="flex items-center justify-between">
										<span className="flex items-center gap-2 font-semibold text-xs text-zinc-900 dark:text-white">
											<VideoIcon className="h-3.5 w-3.5 text-zinc-500" />
											Video Asset Generation
										</span>
										<input
											type="checkbox"
											checked={includeVideo}
											onChange={(e) => setIncludeVideo(e.target.checked)}
											className="h-4 w-4 cursor-pointer rounded text-red-600 accent-red-600 focus:ring-red-500"
										/>
									</div>
									{includeVideo && (
										<p className="text-[10px] text-zinc-500">
											Engine: Hunyuan Video (~3s clip at 848x480 on Spark 2)
										</p>
									)}
								</div>
							</div>

							{/* Action Button */}
							<Button
								onClick={handleGenerate}
								disabled={isGenerating || !topic.trim()}
								className="h-12 w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 font-semibold text-sm text-white shadow-md shadow-red-600/20 transition-all hover:from-red-500 hover:to-red-600 disabled:opacity-50"
							>
								{isGenerating ? (
									<span className="flex items-center gap-2.5">
										<Loader2 className="h-4 w-4 animate-spin" />
										Synthesizing Adversarial Sample...
									</span>
								) : (
									<span className="flex items-center gap-2">
										<Sparkles className="h-4 w-4" />
										Synthesize Mock News Payload
									</span>
								)}
							</Button>
						</div>

						{/* Staged Generation Progress Bar */}
						{isGenerating && (
							<div className="fade-in animate-in space-y-3.5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs duration-300 dark:border-zinc-800 dark:bg-zinc-900/90">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className="relative flex h-2.5 w-2.5">
											<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
											<span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
										</span>
										<span className="font-semibold text-xs text-zinc-800 uppercase tracking-wider dark:text-zinc-200">
											Generation Active
										</span>
									</div>
									<span className="font-bold font-mono text-red-500 text-xs">
										{progress}%
									</span>
								</div>

								{/* Progress Track */}
								<div className="h-2.5 w-full overflow-hidden rounded-full border border-zinc-200/50 bg-zinc-100 p-0.5 dark:border-zinc-700/50 dark:bg-zinc-800">
									<div
										className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300 ease-out"
										style={{ width: `${progress}%` }}
									/>
								</div>

								{/* Phase status step */}
								<div className="space-y-2 border-zinc-100 border-t pt-2 dark:border-zinc-800/80">
									<div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
										<Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-red-500" />
										<span className="truncate">
											{progressStep || "Processing..."}
										</span>
									</div>

									{/* Stage Badges */}
									<div className="grid grid-cols-3 gap-1.5 pt-1">
										<div
											className={`rounded-md border px-1.5 py-1 text-center font-medium text-[10px] transition-colors ${
												activeStage >= 1
													? "border-red-500/30 bg-red-500/10 font-semibold text-red-600 dark:text-red-400"
													: "border-zinc-200 text-zinc-400 dark:border-zinc-800"
											}`}
										>
											1. Narrative
										</div>
										<div
											className={`rounded-md border px-1.5 py-1 text-center font-medium text-[10px] transition-colors ${
												activeStage >= 2
													? "border-red-500/30 bg-red-500/10 font-semibold text-red-600 dark:text-red-400"
													: "border-zinc-200 text-zinc-400 dark:border-zinc-800"
											}`}
										>
											2. Media
										</div>
										<div
											className={`rounded-md border px-1.5 py-1 text-center font-medium text-[10px] transition-colors ${
												activeStage >= 3
													? "border-red-500/30 bg-red-500/10 font-semibold text-red-600 dark:text-red-400"
													: "border-zinc-200 text-zinc-400 dark:border-zinc-800"
											}`}
										>
											3. Payloads
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</section>

				{/* Results Section */}
				{result && (
					<section className="fade-in slide-in-from-bottom-3 animate-in space-y-6 pt-4 duration-500">
						{/* Headline Card */}
						<div className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-md md:flex-row md:items-center dark:border-zinc-800/80 dark:bg-zinc-900">
							<div className="space-y-1">
								<span className="font-semibold text-[11px] text-red-500 uppercase tracking-widest">
									Synthesized Headline
								</span>
								<h3 className="font-bold text-xl text-zinc-900 tracking-tight sm:text-2xl dark:text-white">
									{result.headline}
								</h3>
							</div>
							<div className="flex shrink-0 items-center gap-2.5">
								<Button
									variant="outline"
									size="sm"
									onClick={copyPostToClipboard}
									className="h-9 rounded-lg border-zinc-300 bg-white px-3.5 font-semibold text-xs text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
								>
									<Copy className="mr-1.5 h-3.5 w-3.5 text-zinc-500" /> Copy
									Text
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={downloadJsonPayload}
									className="h-9 rounded-lg border-zinc-300 bg-white px-3.5 font-semibold text-xs text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
								>
									<Download className="mr-1.5 h-3.5 w-3.5 text-zinc-500" />{" "}
									Export JSON
								</Button>
							</div>
						</div>

						{/* Post Content & Media Grid */}
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
							{/* Post Draft (7 cols) */}
							<div className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs lg:col-span-7 dark:border-zinc-800/80 dark:bg-zinc-900">
								<div className="flex items-center justify-between border-zinc-100 border-b pb-3 dark:border-zinc-800">
									<div className="flex items-center gap-2">
										<span className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
											Draft Preview:
										</span>
										<div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
											{selectedPlatforms.map((p) => (
												<button
													key={p}
													type="button"
													onClick={() => setPreviewPlatform(p)}
													className={`rounded-md px-2.5 py-0.5 font-semibold text-[11px] uppercase transition-all ${
														previewPlatform === p
															? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
															: "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
													}`}
												>
													{p}
												</button>
											))}
										</div>
									</div>
									<span className="font-mono text-xs text-zinc-400">
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
									rows={8}
									className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 font-sans text-sm leading-relaxed shadow-none focus:ring-0 dark:border-zinc-800 dark:bg-zinc-800/40"
								/>

								<div className="flex items-center justify-between pt-1">
									<Button
										variant="outline"
										size="sm"
										onClick={copyPostToClipboard}
										className="h-8 rounded-lg border-zinc-300 px-3 font-semibold text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
									>
										<Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Selected Post
									</Button>
									<span className="font-medium text-[11px] text-zinc-400">
										Simulated local draft (isolated testing)
									</span>
								</div>
							</div>

							{/* Media Asset Preview (5 cols) */}
							<div className="space-y-4 lg:col-span-5">
								{/* Image Box */}
								<div className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
									<div className="flex items-center justify-between">
										<span className="flex items-center gap-1.5 font-semibold text-xs text-zinc-800 dark:text-zinc-200">
											<ImageIcon className="h-3.5 w-3.5 text-red-500" />
											Spark 2 Image Asset
										</span>
										{result.image && (
											<span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-medium font-mono text-[10px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
												{result.image.sizeKb} KB
											</span>
										)}
									</div>

									{result.image?.url ? (
										<div className="space-y-3">
											<div className="flex max-h-[220px] items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 dark:border-zinc-800">
												<img
													src={result.image.url}
													alt="Generated mock news asset"
													className="h-full w-full object-cover"
												/>
											</div>
											<div className="flex items-center justify-between pt-1">
												<span className="max-w-[180px] truncate text-[11px] text-zinc-400">
													{result.image.filename}
												</span>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														downloadMediaFile(
															result.image?.url,
															result.image?.filename,
														)
													}
													className="h-7 rounded-lg border-zinc-300 px-2.5 font-semibold text-[11px] hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
												>
													<Download className="mr-1 h-3 w-3" /> Download Image
												</Button>
											</div>
										</div>
									) : (
										<div className="rounded-xl border border-zinc-300 border-dashed p-6 text-center text-xs text-zinc-400 dark:border-zinc-700">
											No image asset requested.
										</div>
									)}

									{result.suggestedImagePrompt && (
										<div className="border-zinc-100 border-t pt-2 text-[11px] text-zinc-500 leading-snug dark:border-zinc-800/80">
											<span className="font-semibold text-zinc-600 dark:text-zinc-400">
												Prompt:{" "}
											</span>
											{result.suggestedImagePrompt}
										</div>
									)}
								</div>

								{/* Video Box */}
								<div className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
									<div className="flex items-center justify-between">
										<span className="flex items-center gap-1.5 font-semibold text-xs text-zinc-800 dark:text-zinc-200">
											<VideoIcon className="h-3.5 w-3.5 text-red-500" />
											Spark 2 Video Asset
										</span>
										{result.video && (
											<span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 font-medium font-mono text-[10px] text-red-500">
												{result.video.sizeKb} KB
											</span>
										)}
									</div>

									{result.video?.url ? (
										<div className="space-y-3">
											<div className="flex max-h-[220px] items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 dark:border-zinc-800">
												<video
													src={result.video.url}
													controls
													autoPlay
													loop
													muted
													className="h-full w-full object-cover"
												/>
											</div>
											<div className="flex items-center justify-between pt-1">
												<span className="max-w-[180px] truncate text-[11px] text-zinc-400">
													{result.video.filename}
												</span>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														downloadMediaFile(
															result.video?.url,
															result.video?.filename,
														)
													}
													className="h-7 rounded-lg border-zinc-300 px-2.5 font-semibold text-[11px] hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
												>
													<Download className="mr-1 h-3 w-3" /> Download Video
												</Button>
											</div>
										</div>
									) : (
										<div className="rounded-xl border border-zinc-300 border-dashed p-6 text-center text-xs text-zinc-400 dark:border-zinc-700">
											{includeVideo
												? "Video in generation queue."
												: "Video generation disabled."}
										</div>
									)}

									{result.suggestedVideoPrompt && (
										<div className="border-zinc-100 border-t pt-2 text-[11px] text-zinc-500 leading-snug dark:border-zinc-800/80">
											<span className="font-semibold text-zinc-600 dark:text-zinc-400">
												Motion Prompt:{" "}
											</span>
											{result.suggestedVideoPrompt}
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Live Social Media Mock Previews */}
						<div className="space-y-6 rounded-2xl border border-zinc-800/90 bg-zinc-950 p-6 text-white shadow-2xl sm:p-8">
							<div className="flex flex-col items-start justify-between gap-4 border-zinc-800 border-b pb-4 sm:flex-row sm:items-center">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<span className="font-bold text-[10px] text-red-400 uppercase tracking-widest">
											Multi-Platform Simulation
										</span>
										<span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 font-medium text-[10px] text-red-400">
											Authentic Render
										</span>
									</div>
									<h4 className="font-bold text-lg text-white tracking-tight">
										Simulated Social Media Experience
									</h4>
								</div>

								{/* Platform switcher tabs */}
								<div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
									{selectedPlatforms.map((p) => (
										<button
											key={p}
											type="button"
											onClick={() => setPreviewPlatform(p)}
											className={`rounded-lg px-3.5 py-1.5 font-semibold text-xs transition-all ${
												previewPlatform === p
													? "bg-zinc-800 text-white shadow-xs"
													: "text-zinc-400 hover:text-white"
											}`}
										>
											{p === "twitter"
												? "𝕏 Twitter"
												: p === "instagram"
													? "📸 Instagram"
													: "🎵 TikTok"}
										</button>
									))}
								</div>
							</div>

							{/* Feed Card Renderer */}
							<div className="flex justify-center rounded-2xl border border-zinc-900 bg-zinc-900/40 p-2 sm:p-6">
								{/* 1. TWITTER / X CARD */}
								{previewPlatform === "twitter" && (
									<div className="w-full max-w-[560px] space-y-3.5 rounded-2xl border border-zinc-800 bg-black p-4 font-sans shadow-2xl sm:p-5">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-red-600 to-amber-600 font-black text-sm text-white shadow-xs">
													⚡
												</div>
												<div>
													<div className="flex items-center gap-1.5">
														<span className="cursor-pointer font-bold text-sm text-white hover:underline">
															Global Wire Network
														</span>
														<span className="text-blue-400 text-xs">✓</span>
														<span className="text-xs text-zinc-500">
															@GlobalWireNet
														</span>
														<span className="text-xs text-zinc-600">· 4m</span>
													</div>
													<span className="text-[11px] text-zinc-500">
														Breaking Simulation
													</span>
												</div>
											</div>
											<MoreHorizontal className="h-4 w-4 cursor-pointer text-zinc-500" />
										</div>

										<p className="whitespace-pre-wrap text-sm text-zinc-100 leading-relaxed">
											{result.platforms?.twitter?.text || result.postContent}
										</p>

										{(result.video?.url || result.image?.url) && (
											<div className="max-h-[340px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
												{result.video?.url ? (
													<video
														src={result.video.url}
														controls
														autoPlay
														loop
														muted
														className="h-full max-h-[340px] w-full object-cover"
													/>
												) : (
													<img
														src={result.image?.url}
														alt="Twitter attachment"
														className="h-full max-h-[340px] w-full object-cover"
													/>
												)}
											</div>
										)}

										<div className="flex items-center justify-between border-zinc-900 border-t px-1 pt-2 text-xs text-zinc-500">
											<span className="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-blue-400">
												<MessageCircle className="h-4 w-4" /> 1.2K
											</span>
											<span className="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-green-400">
												<Repeat2 className="h-4 w-4" /> 8.4K
											</span>
											<span className="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-red-400">
												<Heart className="h-4 w-4" /> 24.1K
											</span>
											<span className="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-blue-400">
												<Bookmark className="h-4 w-4" /> 3.9K
											</span>
											<Share2 className="h-4 w-4 cursor-pointer transition-colors hover:text-white" />
										</div>
									</div>
								)}

								{/* 2. INSTAGRAM FEED CARD */}
								{previewPlatform === "instagram" && (
									<div className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-zinc-800 bg-black font-sans shadow-2xl">
										<div className="flex items-center justify-between border-zinc-900 border-b p-3.5">
											<div className="flex items-center gap-2.5">
												<div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-[2px]">
													<div className="flex h-full w-full items-center justify-center rounded-full bg-black font-black text-[10px] text-white">
														IG
													</div>
												</div>
												<div>
													<div className="flex items-center gap-1">
														<span className="font-bold text-white text-xs">
															breaking.news.daily
														</span>
														<span className="text-[10px] text-blue-400">●</span>
													</div>
													<span className="text-[10px] text-zinc-500">
														Original audio
													</span>
												</div>
											</div>
											<MoreHorizontal className="h-4 w-4 text-zinc-400" />
										</div>

										<div className="flex aspect-square items-center justify-center overflow-hidden bg-zinc-900">
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
													alt="Instagram media"
													className="h-full w-full object-cover"
												/>
											) : (
												<span className="text-xs text-zinc-500">
													No media asset
												</span>
											)}
										</div>

										<div className="space-y-2.5 p-4">
											<div className="flex items-center justify-between text-white">
												<div className="flex items-center gap-4">
													<Heart className="h-5 w-5 cursor-pointer fill-red-500 text-red-500" />
													<MessageCircle className="h-5 w-5 cursor-pointer" />
													<Share2 className="h-5 w-5 cursor-pointer" />
												</div>
												<Bookmark className="h-5 w-5 cursor-pointer" />
											</div>
											<div className="font-semibold text-white text-xs">
												41,208 likes
											</div>
											<div className="text-xs text-zinc-300 leading-relaxed">
												<span className="mr-1.5 font-semibold text-white">
													breaking.news.daily
												</span>
												<span className="whitespace-pre-wrap">
													{result.platforms?.instagram?.text ||
														result.postContent}
												</span>
											</div>
											{result.platforms?.instagram?.engagementPrompt && (
												<div className="font-medium text-[11px] text-blue-400">
													{result.platforms.instagram.engagementPrompt}
												</div>
											)}
											<div className="text-[10px] text-zinc-600 uppercase">
												38 MINUTES AGO
											</div>
										</div>
									</div>
								)}

								{/* 3. TIKTOK VERTICAL PHONE CARD */}
								{previewPlatform === "tiktok" && (
									<div className="relative flex h-[580px] w-[320px] flex-col justify-between overflow-hidden rounded-[32px] border-4 border-zinc-800 bg-black font-sans shadow-2xl">
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
												<div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">
													Vertical Media Frame
												</div>
											)}
											<div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85" />
										</div>

										{/* Top pill indicator */}
										<div className="relative z-10 flex items-center justify-center gap-5 pt-3.5 font-semibold text-white/80 text-xs">
											<span className="text-white/50">Following</span>
											<span className="border-white border-b-2 pb-0.5 text-white">
												For You
											</span>
										</div>

										{/* Right side floating icons */}
										<div className="absolute right-3 bottom-18 z-10 flex flex-col items-center gap-3.5 text-white">
											<div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 font-bold text-xs shadow-md">
												+
											</div>
											<div className="flex flex-col items-center gap-0.5">
												<Heart className="h-6 w-6 cursor-pointer fill-white" />
												<span className="font-semibold text-[10px]">
													142.5K
												</span>
											</div>
											<div className="flex flex-col items-center gap-0.5">
												<MessageCircle className="h-6 w-6 cursor-pointer fill-white" />
												<span className="font-semibold text-[10px]">3,892</span>
											</div>
											<div className="flex flex-col items-center gap-0.5">
												<Bookmark className="h-6 w-6 cursor-pointer fill-white" />
												<span className="font-semibold text-[10px]">18.1K</span>
											</div>
											<div className="flex flex-col items-center gap-0.5">
												<Share2 className="h-6 w-6 cursor-pointer fill-white" />
												<span className="font-semibold text-[10px]">9,410</span>
											</div>
											<div className="flex h-7 w-7 animate-spin items-center justify-center rounded-full border-2 border-white/60 bg-zinc-800 text-[10px]">
												<Music2 className="h-3.5 w-3.5" />
											</div>
										</div>

										{/* Bottom caption */}
										<div className="relative z-10 max-w-[240px] space-y-2 p-4 text-white">
											<span className="block font-semibold text-xs">
												@unfiltered.leaks
											</span>
											<p className="line-clamp-3 text-[11px] text-zinc-200">
												{result.platforms?.tiktok?.text || result.postContent}
											</p>
											{result.platforms?.tiktok?.engagementPrompt && (
												<p className="font-semibold text-[10px] text-amber-400">
													{result.platforms.tiktok.engagementPrompt}
												</p>
											)}
											<div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
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
					</section>
				)}

				{/* Footer */}
				<footer className="flex flex-col items-center justify-between gap-2 border-zinc-200 border-t pt-6 pb-12 text-xs text-zinc-500 sm:flex-row dark:border-zinc-800 dark:text-zinc-400">
					<span>AI Fake News Detection Benchmark Lab</span>
					<span>Engine: Spark 2 Qwen 3.8 27B + ComfyUI</span>
				</footer>
			</div>
		</article>
	);
}
