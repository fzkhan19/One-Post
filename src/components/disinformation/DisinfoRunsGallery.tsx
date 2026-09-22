"use client";

import React, { useEffect, useState } from "react";
import type { Platform } from "@/lib/ai/disinformation";
import type { DisinfoRunBatch } from "@/lib/cache/disinfoCache";
import { DisinfoSocialMockCard } from "./DisinfoSocialMockCard";
import {
	Activity,
	Calendar,
	Check,
	Clock,
	Copy,
	Download,
	Eye,
	Film,
	Image as ImageIcon,
	Layers,
	RefreshCw,
	Sparkles,
	Trash2,
	Video as VideoIcon,
	Zap,
} from "lucide-react";
import { toast } from "sonner";

interface DisinfoRunsGalleryProps {
	onSelectRun?: (run: DisinfoRunBatch) => void;
	refreshSignal?: number;
}

export function DisinfoRunsGallery({
	onSelectRun,
	refreshSignal,
}: DisinfoRunsGalleryProps) {
	const [runs, setRuns] = useState<DisinfoRunBatch[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
	const [activeMediaType, setActiveMediaType] = useState<"video" | "image" | "both">("both");
	const [activeTabPlatform, setActiveTabPlatform] = useState<Platform | "all">("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [isClearing, setIsClearing] = useState(false);

	const fetchRuns = async () => {
		setIsLoading(true);
		try {
			const res = await fetch("/api/ai/disinformation?action=runs");
			const data = await res.json();
			if (data.success && Array.isArray(data.runs)) {
				setRuns(data.runs);
				if (data.runs.length > 0 && !selectedRunId) {
					setSelectedRunId(data.runs[0].runId);
				}
			}
		} catch (err) {
			console.error("Failed to load runs:", err);
			toast.error("Could not fetch media runs history.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchRuns();
	}, [refreshSignal]);

	const handleClearRuns = async () => {
		if (isClearing) return;
		if (!confirm("Are you sure you want to clear all recorded run batches?")) {
			return;
		}
		setIsClearing(true);
		try {
			const res = await fetch("/api/ai/disinformation?target=runs", {
				method: "DELETE",
			});
			const data = await res.json();
			if (data.success) {
				toast.success("Run batches cleared.");
				setRuns([]);
				setSelectedRunId(null);
			} else {
				toast.error(data.error || "Failed to clear runs.");
			}
		} catch (err) {
			toast.error("Network error while clearing runs.");
		} finally {
			setIsClearing(false);
		}
	};

	const filteredRuns = runs.filter((r) => {
		if (!searchQuery.trim()) return true;
		const q = searchQuery.toLowerCase();
		return (
			r.runId.toLowerCase().includes(q) ||
			r.topic.toLowerCase().includes(q) ||
			r.vector.toLowerCase().includes(q)
		);
	});

	const activeRun = runs.find((r) => r.runId === selectedRunId) || runs[0] || null;

	const copyPrompt = (text?: string) => {
		if (!text) return;
		navigator.clipboard.writeText(text);
		toast.success("Prompt copied to clipboard");
	};

	const downloadFile = (url?: string, filename?: string) => {
		if (!url) return;
		const a = document.createElement("a");
		a.href = url;
		a.download = filename || "media_asset";
		a.click();
		toast.success(`Downloading ${filename || "asset"}`);
	};

	return (
		<div className="space-y-6">
			{/* Top Header & Metrics */}
			<div className="flex flex-col justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-5 md:flex-row md:items-center dark:border-zinc-800 dark:bg-zinc-900">
				<div>
					<div className="flex items-center gap-2">
						<span className="flex h-6 items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 font-semibold text-white text-xs dark:bg-zinc-100 dark:text-zinc-900">
							<Layers className="h-3.5 w-3.5" /> Runs Archive
						</span>
						<span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
							{runs.length} Batch{runs.length === 1 ? "" : "es"} Recorded
						</span>
					</div>
					<h2 className="mt-1.5 font-bold text-lg text-zinc-900 tracking-tight sm:text-xl dark:text-white">
						Batch-wise Media & Mock Platforms Gallery
					</h2>
					<p className="text-xs text-zinc-500 dark:text-zinc-400">
						Review every run batch sequentially (e.g. run-1, run-2) with original prompts, generated media assets, and authentic Instagram, TikTok, and X social feeds.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={fetchRuns}
						disabled={isLoading}
						className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
					>
						<RefreshCw
							className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
						/>
						<span>Refresh</span>
					</button>

					{runs.length > 0 && (
						<button
							type="button"
							onClick={handleClearRuns}
							disabled={isClearing}
							className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
						>
							<Trash2 className="h-3.5 w-3.5" />
							<span>{isClearing ? "Clearing..." : "Clear Runs"}</span>
						</button>
					)}
				</div>
			</div>

			{/* Main Grid: Sidebar Runs List + Main Stage */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
				{/* Left Sidebar: Runs Batch List (3 cols on desktop for wider stage) */}
				<div className="space-y-3 lg:col-span-3">
					<div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
						<div className="flex items-center justify-between pb-3">
							<span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
								Sequential Runs
							</span>
							<span className="text-[11px] text-zinc-400">
								{filteredRuns.length} batches
							</span>
						</div>

						{/* Search Filter */}
						<input
							type="text"
							placeholder="Search by run-ID or topic..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
						/>

						{/* Runs List Items */}
						<div className="mt-3 max-h-[620px] space-y-2 overflow-y-auto pr-1">
							{filteredRuns.length === 0 ? (
								<div className="rounded-lg border border-zinc-200 border-dashed p-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
									{runs.length === 0
										? "No media runs recorded yet. Generate a scenario in the generator to create run-1."
										: "No runs match your search."}
								</div>
							) : (
								filteredRuns.map((run) => {
									const isSelected = run.runId === activeRun?.runId;
									const hasImg = Boolean(run.image || run.images?.twitter || run.images?.instagram || run.images?.tiktok);
									const hasVid = Boolean(run.video || run.videos?.twitter || run.videos?.instagram || run.videos?.tiktok);

									return (
										<button
											key={run.runId}
											type="button"
											onClick={() => {
												setSelectedRunId(run.runId);
												if (onSelectRun) onSelectRun(run);
											}}
											className={`w-full rounded-lg border p-3 text-left transition-all ${
												isSelected
													? "border-zinc-900 bg-zinc-900 text-white shadow-xs dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
													: "border-zinc-200 bg-zinc-50/70 hover:border-zinc-300 hover:bg-zinc-100/70 dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
											}`}
										>
											<div className="flex items-center justify-between">
												<span
													className={`font-mono font-bold text-xs ${
														isSelected
															? "text-amber-300 dark:text-amber-600"
															: "text-zinc-900 dark:text-zinc-100"
													}`}
												>
													{run.runId}
												</span>
												<span
													className={`text-[10px] ${
														isSelected
															? "text-zinc-300 dark:text-zinc-600"
															: "text-zinc-400"
													}`}
												>
													{new Date(run.createdAt).toLocaleTimeString([], {
														hour: "2-digit",
														minute: "2-digit",
													})}
												</span>
											</div>

											{/* Thumbnail Preview if Image Available */}
											{run.image?.url && (
												<div className="mt-2 h-14 w-full overflow-hidden rounded border border-zinc-200/50 bg-black/5 dark:border-zinc-700/50">
													<img
														src={run.image.url}
														alt={run.runId}
														className="h-full w-full object-cover"
													/>
												</div>
											)}

											<p
												className={`mt-1.5 line-clamp-2 text-xs leading-snug ${
													isSelected
														? "text-zinc-100 dark:text-zinc-800"
														: "text-zinc-700 dark:text-zinc-300"
												}`}
											>
												{run.topic}
											</p>

											<div className="mt-2.5 flex items-center justify-between gap-1 text-[10px]">
												<span
													className={`rounded-sm px-1.5 py-0.5 font-medium ${
														isSelected
															? "bg-white/20 text-white dark:bg-black/10 dark:text-zinc-900"
															: "bg-zinc-200/80 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
													}`}
												>
													{run.vector.replace(/_/g, " ")}
												</span>

												<div className="flex items-center gap-1.5">
													{hasImg && (
														<span
															className={`flex items-center gap-0.5 rounded px-1 py-0.5 ${
																isSelected
																	? "bg-white/20 text-white dark:bg-black/10 dark:text-zinc-900"
																	: "text-zinc-500 dark:text-zinc-400"
															}`}
															title="Has Image Asset"
														>
															<ImageIcon className="h-2.5 w-2.5" /> IMG
														</span>
													)}
													{hasVid && (
														<span
															className={`flex items-center gap-0.5 rounded px-1 py-0.5 ${
																isSelected
																	? "bg-white/20 text-white dark:bg-black/10 dark:text-zinc-900"
																	: "text-zinc-500 dark:text-zinc-400"
															}`}
															title="Has Video Asset"
														>
															<VideoIcon className="h-2.5 w-2.5" /> VID
														</span>
													)}
												</div>
											</div>
										</button>
									);
								})
							)}
						</div>
					</div>
				</div>

				{/* Right Main Stage: Active Run Details & Authentic Feed Mock Cards (9 cols) */}
				<div className="space-y-5 lg:col-span-9">
					{activeRun ? (
						<>
							{/* Active Run Overview Card */}
							<div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
								<div className="flex flex-col justify-between gap-3 border-zinc-100 border-b pb-4 sm:flex-row sm:items-center dark:border-zinc-800">
									<div>
										<div className="flex items-center gap-2">
											<span className="font-mono font-bold text-sm text-zinc-900 dark:text-white">
												Batch: {activeRun.runId}
											</span>
											<span className="rounded-sm bg-zinc-100 px-2 py-0.5 font-medium text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
												{activeRun.vector}
											</span>
											<span className="flex items-center gap-1 text-[11px] text-zinc-400">
												<Clock className="h-3 w-3" />
												{new Date(activeRun.createdAt).toLocaleString()}
											</span>
										</div>
										<h3 className="mt-1 font-semibold text-base text-zinc-900 dark:text-zinc-100">
											{activeRun.result.headline || activeRun.topic}
										</h3>
									</div>

									{/* View Platform Filters & Media Switcher */}
									<div className="flex flex-wrap items-center gap-2">
										{/* Media Display Filter */}
										<div className="flex rounded-md border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
											<button
												type="button"
												onClick={() => setActiveMediaType("both")}
												className={`rounded-sm px-2 py-0.5 text-xs transition-colors ${
													activeMediaType === "both"
														? "bg-white font-medium text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
														: "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
												}`}
											>
												Both
											</button>
											<button
												type="button"
												onClick={() => setActiveMediaType("video")}
												className={`flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs transition-colors ${
													activeMediaType === "video"
														? "bg-white font-medium text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
														: "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
												}`}
											>
												<VideoIcon className="h-3 w-3" /> Video
											</button>
											<button
												type="button"
												onClick={() => setActiveMediaType("image")}
												className={`flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs transition-colors ${
													activeMediaType === "image"
														? "bg-white font-medium text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
														: "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
												}`}
											>
												<ImageIcon className="h-3 w-3" /> Image
											</button>
										</div>

										{/* Platform View Switcher */}
										<div className="flex rounded-md border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
											<button
												type="button"
												onClick={() => setActiveTabPlatform("all")}
												className={`rounded-sm px-2.5 py-0.5 font-medium text-xs transition-colors ${
													activeTabPlatform === "all"
														? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
														: "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
												}`}
											>
												All 3
											</button>
											<button
												type="button"
												onClick={() => setActiveTabPlatform("twitter")}
												className={`rounded-sm px-2 py-0.5 text-xs transition-colors ${
													activeTabPlatform === "twitter"
														? "bg-white font-medium text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
														: "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
												}`}
											>
												𝕏 Twitter
											</button>
											<button
												type="button"
												onClick={() => setActiveTabPlatform("instagram")}
												className={`rounded-sm px-2 py-0.5 text-xs transition-colors ${
													activeTabPlatform === "instagram"
														? "bg-white font-medium text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
														: "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
												}`}
											>
												Instagram
											</button>
											<button
												type="button"
												onClick={() => setActiveTabPlatform("tiktok")}
												className={`rounded-sm px-2 py-0.5 text-xs transition-colors ${
													activeTabPlatform === "tiktok"
														? "bg-white font-medium text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
														: "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
												}`}
											>
												TikTok
											</button>
										</div>
									</div>
								</div>

								{/* Associated Prompts Box */}
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
									<div className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-800/40">
										<div className="flex items-center justify-between text-zinc-500">
											<span className="font-semibold text-[10px] uppercase tracking-wider">
												Image Generation Prompt
											</span>
											<button
												type="button"
												onClick={() =>
													copyPrompt(
														activeRun.image?.prompt ||
															activeRun.result.suggestedImagePrompt,
													)
												}
												className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
											>
												<Copy className="h-3 w-3" /> Copy
											</button>
										</div>
										<p className="mt-1 line-clamp-3 text-zinc-700 leading-relaxed dark:text-zinc-300">
											{activeRun.image?.prompt ||
												activeRun.result.suggestedImagePrompt ||
												"No image prompt registered"}
										</p>
									</div>

									<div className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-800/40">
										<div className="flex items-center justify-between text-zinc-500">
											<span className="font-semibold text-[10px] uppercase tracking-wider">
												Video Generation Prompt
											</span>
											<button
												type="button"
												onClick={() =>
													copyPrompt(
														activeRun.video?.prompt ||
															activeRun.result.suggestedVideoPrompt ||
															activeRun.result.suggestedImagePrompt,
													)
												}
												className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
											>
												<Copy className="h-3 w-3" /> Copy
											</button>
										</div>
										<p className="mt-1 line-clamp-3 text-zinc-700 leading-relaxed dark:text-zinc-300">
											{activeRun.video?.prompt ||
												activeRun.result.suggestedVideoPrompt ||
												activeRun.result.suggestedImagePrompt ||
												"No video prompt registered"}
										</p>
									</div>
								</div>

								{/* Direct Media Assets Section (Image & Video side-by-side) */}
								{(activeRun.image?.url || activeRun.video?.url) && (
									<div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
										<div className="mb-3 flex items-center justify-between border-zinc-100 border-b pb-2.5 dark:border-zinc-800">
											<div className="flex items-center gap-2">
												<span className="font-semibold text-xs text-zinc-900 uppercase tracking-wider dark:text-zinc-100">
													Generated Assets Inspection
												</span>
												<span className="text-[11px] text-zinc-400">
													Direct files generated on Spark 2 GPU
												</span>
											</div>
										</div>

										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											{/* Image Asset Card */}
											{activeRun.image?.url ? (
												<div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-800/30">
													<div className="flex items-center justify-between text-xs">
														<span className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
															<ImageIcon className="h-3.5 w-3.5 text-blue-500" />
															Image Asset ({activeRun.image.model || "flux"})
														</span>
														<button
															type="button"
															onClick={() =>
																downloadFile(
																	activeRun.image?.url,
																	activeRun.image?.filename,
																)
															}
															className="flex items-center gap-1 rounded border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
														>
															<Download className="h-3 w-3" />
															Download ({activeRun.image.sizeKb} KB)
														</button>
													</div>
													<div className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-black/5 dark:border-zinc-700">
														<img
															src={activeRun.image.url}
															alt={activeRun.topic}
															className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
														/>
													</div>
												</div>
											) : (
												<div className="flex aspect-video items-center justify-center rounded-lg border border-zinc-200 border-dashed text-xs text-zinc-400 dark:border-zinc-800">
													No image asset recorded for this run
												</div>
											)}

											{/* Video Asset Card */}
											{activeRun.video?.url ? (
												<div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-800/30">
													<div className="flex items-center justify-between text-xs">
														<span className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
															<VideoIcon className="h-3.5 w-3.5 text-purple-500" />
															Video Asset ({activeRun.video.model || "wan22"})
														</span>
														<button
															type="button"
															onClick={() =>
																downloadFile(
																	activeRun.video?.url,
																	activeRun.video?.filename,
																)
															}
															className="flex items-center gap-1 rounded border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
														>
															<Download className="h-3 w-3" />
															Download ({activeRun.video.sizeKb} KB)
														</button>
													</div>
													<div className="aspect-video w-full overflow-hidden rounded-md border border-zinc-200 bg-black dark:border-zinc-700">
														{/* biome-ignore lint/a11y/useMediaCaption: Generated synthetic video */}
														<video
															src={activeRun.video.url}
															controls
															loop
															playsInline
															onPlay={(e) => {
																e.currentTarget.volume = 0.5;
															}}
															className="h-full w-full object-contain"
														/>
													</div>
												</div>
											) : (
												<div className="flex aspect-video items-center justify-center rounded-lg border border-zinc-200 border-dashed text-xs text-zinc-400 dark:border-zinc-800">
													No video asset recorded for this run
												</div>
											)}
										</div>
									</div>
								)}
							</div>

							{/* Social Feeds Mock Display Container */}
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
										Authentic Feed Mock Cards — {activeRun.runId}
									</h4>
									<span className="text-[11px] text-zinc-500">
										Interactive previews with live video playback & image rendering
									</span>
								</div>

								{/* Mock cards rendered side-by-side or individually */}
								{activeTabPlatform === "all" ? (
									<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 2xl:grid-cols-3">
										{/* 1. TWITTER / X CARD */}
										<div className="flex w-full flex-col items-center space-y-2">
											<div className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">
												𝕏 Twitter Mock
											</div>
											<DisinfoSocialMockCard
												platform="twitter"
												result={activeRun.result}
												image={activeRun.images?.twitter || activeRun.image}
												video={activeRun.videos?.twitter || activeRun.video}
												activeMediaType={activeMediaType}
												compact
											/>
										</div>

										{/* 2. INSTAGRAM CARD */}
										<div className="flex w-full flex-col items-center space-y-2">
											<div className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">
												Instagram Feed Mock
											</div>
											<DisinfoSocialMockCard
												platform="instagram"
												result={activeRun.result}
												image={activeRun.images?.instagram || activeRun.image}
												video={activeRun.videos?.instagram || activeRun.video}
												activeMediaType={activeMediaType}
												compact
											/>
										</div>

										{/* 3. TIKTOK CARD */}
										<div className="flex w-full flex-col items-center space-y-2 lg:col-span-2 2xl:col-span-1">
											<div className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">
												TikTok Vertical Mock
											</div>
											<DisinfoSocialMockCard
												platform="tiktok"
												result={activeRun.result}
												image={activeRun.images?.tiktok || activeRun.image}
												video={activeRun.videos?.tiktok || activeRun.video}
												activeMediaType={activeMediaType}
												compact
											/>
										</div>
									</div>
								) : (
									<div className="flex justify-center p-4">
										<DisinfoSocialMockCard
											platform={activeTabPlatform}
											result={activeRun.result}
											image={
												activeRun.images?.[activeTabPlatform] || activeRun.image
											}
											video={
												activeRun.videos?.[activeTabPlatform] || activeRun.video
											}
											activeMediaType={activeMediaType}
										/>
									</div>
								)}
							</div>
						</>
					) : (
						<div className="flex h-[320px] items-center justify-center rounded-xl border border-zinc-200 border-dashed bg-white text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
							Select a run batch from the left to view its media and mock pages.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
