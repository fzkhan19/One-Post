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
	AlertTriangle,
	ArrowLeft,
	Bookmark,
	Check,
	Copy,
	Cpu,
	Download,
	ExternalLink,
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
}[] = [
	{
		id: "fabricated_breaking_news",
		name: "BREAKING_NEWS_HOAX",
		tag: "FABRICATED_EVENT",
		description:
			"Urgent breaking-news framing with simulated insider or unnamed sources.",
	},
	{
		id: "conspiracy_leak",
		name: "CONSPIRACY_LEAK",
		tag: "COVERT_AGENDA",
		description:
			"Alleged suppressed documents or hidden institutional motives.",
	},
	{
		id: "ragebait_emotional",
		name: "RAGEBAIT_OUTRAGE",
		tag: "POLARIZATION_HOOK",
		description:
			"Extreme emotional provocation targeting socio-political fractures.",
	},
	{
		id: "misleading_statistics",
		name: "STATISTICAL_DISTORTION",
		tag: "PSEUDO_EMPIRICAL",
		description:
			"Manipulated percentages, false correlations, or spurious consensus.",
	},
	{
		id: "satire_parody",
		name: "ADVERSARIAL_SATIRE",
		tag: "MIMICRY_BLUR",
		description:
			"Dry irony imitating official corporate or governmental communications.",
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

	// Query Spark status on mount
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
			toast.error("Please enter a target scenario or topic.");
			return;
		}

		if (selectedPlatforms.length === 0) {
			toast.error("Please select at least one target platform.");
			return;
		}

		setIsGenerating(true);
		setProgress(5);
		setActiveStage(1);
		setProgressStep("INITIALIZING_PIPELINE // PROMPTING_LLM");
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
					"PHASE 01/03: SYNTHESIZING_ADVERSARIAL_NARRATIVE (LLM)",
				);
			} else if (currentProgress < 75) {
				setActiveStage(2);
				if (includeImage) {
					setProgressStep(
						`PHASE 02/03: DISPATCHING_SPARK2_GPU (${mediaModel === "flux2" ? "FLUX.2 DEV" : "FLUX SCHNELL"})`,
					);
				} else {
					setProgressStep("PHASE 02/03: FORMATTING_VIRALITY_METRICS");
				}
			} else {
				setActiveStage(3);
				if (includeVideo) {
					setProgressStep("PHASE 03/03: SPARK2_HUNYUAN_VIDEO_NEURAL_RENDERING");
				} else {
					setProgressStep("PHASE 03/03: ASSEMBLING_PLATFORM_PAYLOADS");
				}
			}
		}, intervalMs);

		try {
			toast.info(
				`Dispatching synthesis for [${selectedPlatforms.join(", ").toUpperCase()}]...`,
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
				toast.error(`Synthesis error: ${errMessage}`);
				return;
			}

			const data = await response.json();
			if (data.success) {
				setProgress(100);
				setProgressStep("STATUS: ADVERSARIAL_PAYLOAD_READY");
				setActiveStage(3);
				setResult(data.data);
				toast.success("Adversarial payload generated successfully!");
			} else {
				toast.error(data.error || "Failed to generate mock news.");
			}
		} catch (err: unknown) {
			clearInterval(progressTimer);
			console.error(err);
			const errorMessage =
				err instanceof Error
					? err.message
					: "An error occurred during generation.";
			toast.error(errorMessage);
		} finally {
			clearInterval(progressTimer);
			setTimeout(() => {
				setIsGenerating(false);
			}, 400);
		}
	};

	const copyCurrentPost = () => {
		if (!result) return;
		const textToCopy =
			result.platforms?.[previewPlatform]?.text || result.postContent;
		navigator.clipboard.writeText(textToCopy);
		toast.success(`Copied ${previewPlatform.toUpperCase()} post text!`);
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
			generatedAt: new Date().toISOString(),
		};
		const blob = new Blob([JSON.stringify(exportData, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `mock-news-payload-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Payload JSON exported.");
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
		<article className="flex min-h-[100dvh] flex-col items-center bg-[#e0e0e0] p-4 font-mono text-black md:p-8 dark:bg-black dark:text-white">
			{/* Grid Background Effect */}
			<div
				className="pointer-events-none fixed inset-0 opacity-[0.03] dark:opacity-[0.07]"
				style={{
					backgroundImage:
						"linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
					backgroundSize: "20px 20px",
				}}
			/>

			<div className="z-10 w-full max-w-6xl space-y-6">
				{/* Terminal Window Wrapper */}
				<div className="border-[3px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-zinc-900 dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
					{/* Terminal Header */}
					<div className="flex flex-wrap items-center justify-between gap-3 border-black border-b-[3px] bg-black px-4 py-2 text-white dark:border-white dark:bg-white dark:text-black">
						<div className="flex items-center gap-3">
							<div className="flex gap-1.5">
								<div className="h-3 w-3 border border-black bg-red-500" />
								<div className="h-3 w-3 border border-black bg-yellow-500" />
								<div className="h-3 w-3 border border-black bg-green-500" />
							</div>
							<span className="font-bold text-xs uppercase tracking-widest">
								ONE_POST_v1.0.4 // MOCK_NEWS_LAB
							</span>
						</div>

						<div className="flex items-center gap-3 text-[10px]">
							<div className="flex items-center gap-1.5">
								<span
									className={`h-2 w-2 rounded-full ${
										sparkStatus?.comfyui === "ONLINE"
											? "animate-pulse bg-green-400"
											: "bg-red-400"
									}`}
								/>
								<span className="font-bold uppercase tracking-wider">
									SPARK2_CORE:{" "}
									{sparkStatus
										? `${sparkStatus.comfyui} (${sparkStatus.vram})`
										: "DETECTING..."}
								</span>
							</div>
							<Link
								href="/"
								className="flex items-center gap-1 border border-white bg-zinc-800 px-2.5 py-0.5 font-bold uppercase transition-all hover:bg-zinc-700 dark:border-black dark:bg-zinc-200 dark:hover:bg-zinc-300"
							>
								<ArrowLeft className="h-3 w-3" />
								<span>01. DASHBOARD</span>
							</Link>
						</div>
					</div>

					<div className="space-y-8 p-6 md:p-8">
						{/* Sub-header banner */}
						<div className="flex flex-wrap items-center justify-between gap-4 border-2 border-black border-dashed pb-4 dark:border-white/30">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<span className="border border-red-600 bg-red-600 px-2 py-0.5 font-black text-[10px] text-white uppercase">
										MODULE 03
									</span>
									<h1 className="font-black text-lg uppercase tracking-tight sm:text-xl">
										SYNTHETIC_NEWS_SIMULATION // ADVERSARIAL_TESTING
									</h1>
								</div>
								<p className="text-xs text-zinc-600 dark:text-zinc-400">
									Generate multi-platform viral payloads and synthetic media to
									benchmark detection pipelines and automated content filters.
								</p>
							</div>
							<div className="text-right font-bold text-[10px] text-zinc-500 uppercase">
								SYSTEM_STATUS: READY // ISOLATED_SANDBOX
							</div>
						</div>

						{/* Topic Input Section */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label
									htmlFor="mock-topic"
									className="flex items-center gap-2 font-black text-red-600 text-sm uppercase dark:text-red-500"
								>
									<span className="animate-pulse">▶</span>
									<span>INPUT_TARGET_SCENARIO:</span>
								</Label>
								<span className="border border-black bg-black px-2 py-0.5 font-bold text-[10px] text-white uppercase dark:border-white dark:bg-white dark:text-black">
									LLM: QWEN 3.8 27B / GEMINI
								</span>
							</div>

							<div className="group relative">
								<span className="-translate-y-1/2 absolute top-1/2 left-4 font-bold text-zinc-400 transition-colors group-focus-within:text-black dark:group-focus-within:text-white">
									{">"}
								</span>
								<Input
									id="mock-topic"
									value={topic}
									onChange={(e) => setTopic(e.target.value)}
									placeholder="ENTER_SCENARIO (e.g. Central Bank declares emergency digital currency freeze)..."
									className="h-14 rounded-none border-[3px] border-black bg-zinc-50 pr-6 pl-10 font-bold text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none focus:ring-0 focus:ring-offset-0 dark:border-white dark:bg-zinc-800 dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
								/>
							</div>
						</div>

						{/* Two Column Grid: Manipulation Vectors (Left) & Controls (Right) */}
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
							{/* Left: Manipulation Vector Selectors */}
							<div className="space-y-4 lg:col-span-7">
								<div className="flex items-center justify-between border-black border-b-2 pb-2 dark:border-white">
									<span className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
										<Sliders className="h-4 w-4 text-red-600" />
										01. MANIPULATION_VECTOR
									</span>
									<span className="font-bold text-[10px] text-zinc-500 uppercase">
										SELECTED: {VECTORS.find((v) => v.id === vector)?.tag}
									</span>
								</div>

								<div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
									{VECTORS.map((v) => {
										const isSelected = vector === v.id;
										return (
											<button
												key={v.id}
												type="button"
												onClick={() => setVector(v.id)}
												className={`flex flex-col justify-between gap-2 border-[2px] p-3 text-left transition-all ${
													isSelected
														? "border-black bg-black text-white shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] dark:border-white dark:bg-white dark:text-black"
														: "border-black/40 bg-zinc-50 text-zinc-700 hover:border-black hover:bg-zinc-100 dark:border-white/40 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:border-white"
												}`}
											>
												<div className="space-y-1">
													<div className="flex items-center justify-between gap-1">
														<span className="font-black text-xs uppercase tracking-tight">
															{v.name}
														</span>
														{isSelected && (
															<span className="font-black text-[11px] text-red-500">
																[ACTIVE]
															</span>
														)}
													</div>
													<p className="text-[11px] leading-snug opacity-80">
														{v.description}
													</p>
												</div>
												<span
													className={`inline-block w-fit border px-1.5 py-0.5 font-bold text-[9px] uppercase ${
														isSelected
															? "border-red-500 bg-red-500/20 text-red-400 dark:border-red-600 dark:bg-red-600/10 dark:text-red-700"
															: "border-zinc-300 bg-zinc-200/50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-400"
													}`}
												>
													{v.tag}
												</span>
											</button>
										);
									})}
								</div>
							</div>

							{/* Right: Target Platforms & Media Configuration */}
							<div className="space-y-5 lg:col-span-5">
								<div className="space-y-4 border-[3px] border-black bg-zinc-50 p-5 dark:border-white dark:bg-zinc-800/50">
									{/* Platforms Selection */}
									<div className="space-y-2.5">
										<div className="flex items-center justify-between border-black border-b-2 pb-2 dark:border-white">
											<span className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider">
												<Globe className="h-4 w-4 text-red-600" />
												02. TARGET_PLATFORMS
											</span>
											<span className="font-bold text-[10px] text-zinc-500 uppercase">
												{selectedPlatforms.length}/3 ACTIVE
											</span>
										</div>

										<div className="grid grid-cols-3 gap-2">
											{(
												[
													{
														id: "twitter",
														label: "𝕏 Twitter",
														desc: "16:9",
													},
													{
														id: "instagram",
														label: "Instagram",
														desc: "1:1",
													},
													{ id: "tiktok", label: "TikTok", desc: "9:16" },
												] as const
											).map((p) => {
												const isSelected = selectedPlatforms.includes(p.id);
												return (
													<button
														key={p.id}
														type="button"
														onClick={() => togglePlatform(p.id)}
														className={`flex flex-col items-center justify-center gap-0.5 border-2 p-2 font-black text-xs uppercase transition-all ${
															isSelected
																? "border-black bg-black text-white shadow-[3px_3px_0px_0px_rgba(220,38,38,1)] dark:border-white dark:bg-white dark:text-black"
																: "border-black/30 bg-white text-zinc-500 opacity-70 hover:opacity-100 dark:border-white/30 dark:bg-zinc-900"
														}`}
													>
														<div className="flex items-center gap-1">
															<span>{p.label}</span>
															{isSelected && (
																<span className="font-black text-red-500">
																	✓
																</span>
															)}
														</div>
														<span className="font-mono text-[9px] opacity-70">
															{p.desc}
														</span>
													</button>
												);
											})}
										</div>
									</div>

									{/* Spark 2 Media Engine */}
									<div className="space-y-3 border-black border-t-2 pt-3 dark:border-white">
										<span className="block font-black text-xs text-zinc-500 uppercase">
											03. SPARK2_MEDIA_ASSETS
										</span>

										{/* Photo toggle */}
										<div className="space-y-2 border border-black bg-white p-3 dark:border-white dark:bg-zinc-900">
											<div className="flex items-center justify-between">
												<span className="flex items-center gap-2 font-black text-xs uppercase">
													<ImageIcon className="h-3.5 w-3.5 text-zinc-500" />
													Flux Image Asset
												</span>
												<input
													type="checkbox"
													checked={includeImage}
													onChange={(e) => setIncludeImage(e.target.checked)}
													className="h-4 w-4 cursor-pointer rounded-none border-2 border-black accent-red-600 dark:border-white"
												/>
											</div>

											{includeImage && (
												<div className="flex items-center gap-2 border-zinc-200 border-t pt-2 font-bold text-[10px] dark:border-zinc-800">
													<span className="text-zinc-500 uppercase">
														MODEL:
													</span>
													<button
														type="button"
														onClick={() => setMediaModel("flux")}
														className={`border border-black px-2 py-0.5 uppercase dark:border-white ${
															mediaModel === "flux"
																? "bg-black text-white dark:bg-white dark:text-black"
																: ""
														}`}
													>
														Flux Schnell
													</button>
													<button
														type="button"
														onClick={() => setMediaModel("flux2")}
														className={`border border-black px-2 py-0.5 uppercase dark:border-white ${
															mediaModel === "flux2"
																? "bg-black text-white dark:bg-white dark:text-black"
																: ""
														}`}
													>
														Flux.2 Dev
													</button>
												</div>
											)}
										</div>

										{/* Video toggle */}
										<div className="space-y-1 border border-black bg-white p-3 dark:border-white dark:bg-zinc-900">
											<div className="flex items-center justify-between">
												<span className="flex items-center gap-2 font-black text-xs uppercase">
													<VideoIcon className="h-3.5 w-3.5 text-zinc-500" />
													Hunyuan Video Asset
												</span>
												<input
													type="checkbox"
													checked={includeVideo}
													onChange={(e) => setIncludeVideo(e.target.checked)}
													className="h-4 w-4 cursor-pointer rounded-none border-2 border-black accent-red-600 dark:border-white"
												/>
											</div>
											{includeVideo && (
												<p className="pt-1 text-[10px] text-zinc-500">
													ENGINE: Spark 2 Hunyuan (~3s dynamic clip)
												</p>
											)}
										</div>
									</div>

									{/* Action Button */}
									<button
										type="button"
										onClick={handleGenerate}
										disabled={isGenerating || !topic.trim()}
										className="flex h-12 w-full items-center justify-center gap-2 border-[3px] border-black bg-red-600 font-black text-white text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-red-700 hover:shadow-none disabled:opacity-50 dark:border-white dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
									>
										{isGenerating ? (
											<span className="flex items-center gap-2">
												<Loader2 className="h-4 w-4 animate-spin" />
												SYNTHESIZING_ADVERSARIAL_SAMPLE...
											</span>
										) : (
											<span className="flex items-center gap-2">
												<Sparkles className="h-4 w-4" />
												SYNTHESIZE_MOCK_NEWS_PAYLOAD
											</span>
										)}
									</button>
								</div>

								{/* Terminal Progress Indicator */}
								{isGenerating && (
									<div className="space-y-3 border-[3px] border-black bg-white p-4 font-mono shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-zinc-900 dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
										<div className="flex items-center justify-between text-xs">
											<span className="font-bold text-red-600 uppercase">
												[STATUS: PROCESSING]
											</span>
											<span className="font-black">{progress}%</span>
										</div>

										<div className="h-4 w-full border-2 border-black bg-zinc-100 p-0.5 dark:border-white dark:bg-zinc-800">
											<div
												className="h-full bg-red-600 transition-all duration-300"
												style={{ width: `${progress}%` }}
											/>
										</div>

										<div className="truncate text-[10px] text-zinc-500 uppercase">
											{`> ${progressStep || "EXEC_RUNNING"}`}
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Results Presentation */}
						{result && (
							<div className="space-y-6 border-black border-t-2 pt-6 dark:border-white">
								{/* Headline Bar */}
								<div className="flex flex-col justify-between gap-4 border-[3px] border-black bg-zinc-50 p-5 md:flex-row md:items-center dark:border-white dark:bg-zinc-800">
									<div className="space-y-1">
										<span className="font-bold text-[10px] text-red-600 uppercase tracking-widest">
											SYNTHESIZED_HEADLINE:
										</span>
										<h2 className="font-black text-base text-black uppercase tracking-tight sm:text-lg dark:text-white">
											{result.headline}
										</h2>
									</div>
									<div className="flex shrink-0 items-center gap-2">
										<button
											type="button"
											onClick={copyCurrentPost}
											className="flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1.5 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100 dark:border-white dark:bg-zinc-900 dark:hover:bg-zinc-800"
										>
											<Copy className="h-3.5 w-3.5" /> COPY RAW
										</button>
										<button
											type="button"
											onClick={downloadJsonPayload}
											className="flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1.5 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100 dark:border-white dark:bg-zinc-900 dark:hover:bg-zinc-800"
										>
											<Download className="h-3.5 w-3.5" /> EXPORT JSON
										</button>
									</div>
								</div>

								{/* Draft Text + Media Previews (2 cols) */}
								<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
									{/* Left: Copyable Post Draft */}
									<div className="space-y-3 border-[3px] border-black bg-white p-5 lg:col-span-7 dark:border-white dark:bg-zinc-900">
										<div className="flex items-center justify-between border-black border-b-2 pb-2 dark:border-white">
											<div className="flex items-center gap-2">
												<span className="font-black text-xs uppercase">
													DRAFT_PREVIEW:
												</span>
												<div className="flex gap-1">
													{selectedPlatforms.map((p) => (
														<button
															key={p}
															type="button"
															onClick={() => setPreviewPlatform(p)}
															className={`border border-black px-2 py-0.5 font-bold text-[10px] uppercase dark:border-white ${
																previewPlatform === p
																	? "bg-black text-white dark:bg-white dark:text-black"
																	: "text-zinc-500 hover:text-black dark:hover:text-white"
															}`}
														>
															{p}
														</button>
													))}
												</div>
											</div>
											<span className="text-[10px] text-zinc-500">
												{
													(
														result.platforms?.[previewPlatform]?.text ||
														result.postContent
													).length
												}{" "}
												CHARS
											</span>
										</div>

										<Textarea
											value={
												result.platforms?.[previewPlatform]?.text ||
												result.postContent
											}
											readOnly
											rows={7}
											className="w-full resize-none rounded-none border-2 border-black bg-zinc-50 p-3 font-mono text-xs leading-relaxed dark:border-white dark:bg-zinc-800"
										/>

										<div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase">
											<span>TARGET: {previewPlatform.toUpperCase()}</span>
											<span>ISOLATED SIMULATION ENVIRONMENT</span>
										</div>
									</div>

									{/* Right: Media Asset Preview */}
									<div className="space-y-4 lg:col-span-5">
										{/* Image Box */}
										<div className="space-y-2.5 border-[3px] border-black bg-white p-4 dark:border-white dark:bg-zinc-900">
											<div className="flex items-center justify-between border-black border-b pb-1.5 dark:border-white">
												<span className="flex items-center gap-1.5 font-black text-xs uppercase">
													<ImageIcon className="h-3.5 w-3.5 text-red-600" />
													SPARK2_IMAGE_ASSET
												</span>
												{result.image && (
													<span className="border border-black bg-zinc-100 px-1.5 py-0.5 font-bold text-[9px] uppercase dark:border-white dark:bg-zinc-800">
														{result.image.sizeKb} KB
													</span>
												)}
											</div>

											{result.image?.url ? (
												<div className="space-y-2">
													<div className="flex max-h-[190px] items-center justify-center overflow-hidden border-2 border-black bg-black dark:border-white">
														<img
															src={result.image.url}
															alt="Spark 2 synthetic asset"
															className="h-full w-full object-cover"
														/>
													</div>
													<div className="flex items-center justify-between">
														<span className="max-w-[170px] truncate text-[10px] text-zinc-500">
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
															className="border border-black px-2 py-0.5 font-bold text-[10px] uppercase hover:bg-zinc-100 dark:border-white dark:hover:bg-zinc-800"
														>
															DOWNLOAD
														</button>
													</div>
												</div>
											) : (
												<div className="border border-zinc-400 border-dashed p-4 text-center text-xs text-zinc-400 dark:border-zinc-700">
													NO IMAGE ASSET GENERATED
												</div>
											)}
										</div>

										{/* Video Box */}
										{includeVideo && (
											<div className="space-y-2.5 border-[3px] border-black bg-white p-4 dark:border-white dark:bg-zinc-900">
												<div className="flex items-center justify-between border-black border-b pb-1.5 dark:border-white">
													<span className="flex items-center gap-1.5 font-black text-xs uppercase">
														<VideoIcon className="h-3.5 w-3.5 text-red-600" />
														SPARK2_VIDEO_ASSET
													</span>
													{result.video && (
														<span className="border border-black bg-zinc-100 px-1.5 py-0.5 font-bold text-[9px] uppercase dark:border-white dark:bg-zinc-800">
															{result.video.sizeKb} KB
														</span>
													)}
												</div>

												{result.video?.url ? (
													<div className="space-y-2">
														<div className="flex max-h-[190px] items-center justify-center overflow-hidden border-2 border-black bg-black dark:border-white">
															<video
																src={result.video.url}
																controls
																autoPlay
																loop
																muted
																className="h-full w-full object-cover"
															/>
														</div>
														<div className="flex items-center justify-between">
															<span className="max-w-[170px] truncate text-[10px] text-zinc-500">
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
																className="border border-black px-2 py-0.5 font-bold text-[10px] uppercase hover:bg-zinc-100 dark:border-white dark:hover:bg-zinc-800"
															>
																DOWNLOAD
															</button>
														</div>
													</div>
												) : (
													<div className="border border-zinc-400 border-dashed p-4 text-center text-xs text-zinc-400 dark:border-zinc-700">
														NO VIDEO ASSET GENERATED
													</div>
												)}
											</div>
										)}
									</div>
								</div>

								{/* Authentic Social Media Mock Simulations */}
								<div className="space-y-5 border-[3px] border-black bg-zinc-100 p-6 text-black dark:border-white dark:bg-zinc-950 dark:text-white">
									<div className="flex flex-wrap items-center justify-between gap-3 border-black border-b-2 pb-3 dark:border-white">
										<div className="space-y-0.5">
											<span className="font-black text-xs uppercase tracking-wider">
												04. AUTHENTIC_SOCIAL_MOCK_SIMULATOR
											</span>
											<p className="text-[11px] text-zinc-600 dark:text-zinc-400">
												Direct preview of how synthetic payload renders on live
												feeds.
											</p>
										</div>

										<div className="flex gap-1">
											{selectedPlatforms.map((p) => (
												<button
													key={p}
													type="button"
													onClick={() => setPreviewPlatform(p)}
													className={`border-2 border-black px-3 py-1 font-black text-xs uppercase transition-all dark:border-white ${
														previewPlatform === p
															? "bg-black text-white dark:bg-white dark:text-black"
															: "bg-white text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400"
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

									{/* Feed Card Rendering Container */}
									<div className="flex justify-center p-2 sm:p-4">
										{/* 1. TWITTER / X CARD */}
										{previewPlatform === "twitter" && (
											<div className="w-full max-w-[540px] space-y-3 border-2 border-zinc-800 bg-black p-4 font-sans text-white shadow-xl">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-2.5">
														<div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-red-600 to-amber-600 font-black text-white text-xs">
															⚡
														</div>
														<div>
															<div className="flex items-center gap-1.5">
																<span className="font-bold text-xs hover:underline">
																	Global Wire Network
																</span>
																<span className="text-blue-400 text-xs">✓</span>
																<span className="text-[11px] text-zinc-500">
																	@GlobalWireNet
																</span>
															</div>
															<span className="text-[10px] text-zinc-500">
																Breaking Wire Simulation
															</span>
														</div>
													</div>
													<MoreHorizontal className="h-4 w-4 text-zinc-500" />
												</div>

												<p className="whitespace-pre-wrap text-sm text-zinc-100 leading-relaxed">
													{result.platforms?.twitter?.text ||
														result.postContent}
												</p>

												{(result.video?.url || result.image?.url) && (
													<div className="max-h-[320px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
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

												<div className="flex items-center justify-between border-zinc-900 border-t px-1 pt-2 text-xs text-zinc-500">
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
											<div className="w-full max-w-[420px] overflow-hidden border-2 border-zinc-800 bg-black font-sans text-white shadow-xl">
												<div className="flex items-center justify-between border-zinc-900 border-b p-3">
													<div className="flex items-center gap-2">
														<div className="h-7 w-7 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-[1.5px]">
															<div className="flex h-full w-full items-center justify-center rounded-full bg-black font-black text-[9px] text-white">
																IG
															</div>
														</div>
														<span className="font-bold text-xs">
															breaking.news.daily
														</span>
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
															alt="Instagram asset"
															className="h-full w-full object-cover"
														/>
													) : (
														<span className="text-xs text-zinc-500">
															NO MEDIA
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
													<div className="font-semibold text-xs">
														41,208 likes
													</div>
													<div className="text-xs text-zinc-300 leading-relaxed">
														<span className="mr-1.5 font-bold text-white">
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
													<div className="text-[9px] text-zinc-600 uppercase">
														38 MINUTES AGO
													</div>
												</div>
											</div>
										)}

										{/* 3. TIKTOK VERTICAL CARD */}
										{previewPlatform === "tiktok" && (
											<div className="relative flex h-[560px] w-[310px] flex-col justify-between overflow-hidden rounded-[24px] border-4 border-zinc-800 bg-black font-sans text-white shadow-2xl">
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
															VERTICAL MEDIA FRAME
														</div>
													)}
													<div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85" />
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
													<div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 font-bold text-xs">
														+
													</div>
													<div className="flex flex-col items-center gap-0.5">
														<Heart className="h-5 w-5 fill-white" />
														<span className="font-semibold text-[9px]">
															142.5K
														</span>
													</div>
													<div className="flex flex-col items-center gap-0.5">
														<MessageCircle className="h-5 w-5 fill-white" />
														<span className="font-semibold text-[9px]">
															3,892
														</span>
													</div>
													<div className="flex flex-col items-center gap-0.5">
														<Bookmark className="h-5 w-5 fill-white" />
														<span className="font-semibold text-[9px]">
															18.1K
														</span>
													</div>
													<div className="flex flex-col items-center gap-0.5">
														<Share2 className="h-5 w-5 fill-white" />
														<span className="font-semibold text-[9px]">
															9,410
														</span>
													</div>
												</div>

												{/* Bottom caption */}
												<div className="relative z-10 max-w-[230px] space-y-1.5 p-3.5 text-white">
													<span className="block font-bold text-xs">
														@unfiltered.leaks
													</span>
													<p className="line-clamp-3 text-[11px] text-zinc-200">
														{result.platforms?.tiktok?.text ||
															result.postContent}
													</p>
													{result.platforms?.tiktok?.engagementPrompt && (
														<p className="font-semibold text-[10px] text-amber-400">
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
					</div>
				</div>

				{/* Footer */}
				<footer className="flex flex-wrap items-center justify-between gap-2 border-black border-t-2 pt-4 pb-12 font-mono text-xs text-zinc-600 dark:border-white/20 dark:text-zinc-400">
					<span>ONE_POST // SYNTHETIC_DISINFORMATION_BENCHMARK</span>
					<span>ENGINE: SPARK 2 QWEN 3.8 27B + COMFYUI GPU</span>
				</footer>
			</div>
		</article>
	);
}
