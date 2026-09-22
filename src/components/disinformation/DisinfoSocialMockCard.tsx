"use client";

import type { DisinformationResult, Platform } from "@/lib/ai/disinformation";
import type { MediaAssetInfo } from "@/lib/cache/disinfoCache";
import {
	Bookmark,
	Heart,
	MessageCircle,
	MoreHorizontal,
	Music2,
	Pause,
	Play,
	Repeat2,
	Share2,
	Volume2,
	VolumeX,
} from "lucide-react";
import React, { useRef, useState } from "react";

interface DisinfoSocialMockCardProps {
	platform: Platform;
	result: DisinformationResult;
	image?: MediaAssetInfo | null;
	video?: MediaAssetInfo | null;
	activeMediaType?: "image" | "video" | "both";
	compact?: boolean;
}

export function DisinfoSocialMockCard({
	platform,
	result,
	image,
	video,
	activeMediaType = "both",
	compact = false,
}: DisinfoSocialMockCardProps) {
	const [isPlaying, setIsPlaying] = useState(true);
	const [isMuted, setIsMuted] = useState(false);
	const videoRef = useRef<HTMLVideoElement>(null);

	// Try unmuting video on mount (fallback to muted if browser blocks unmuted autoplay)
	// biome-ignore lint/correctness/useExhaustiveDependencies: run on video url change to play new video
	React.useEffect(() => {
		if (videoRef.current) {
			videoRef.current.muted = false;
			videoRef.current.play().catch(() => {
				// Browser autoplay policy blocked unmuted playback; fallback to muted autoplay
				if (videoRef.current) {
					videoRef.current.muted = true;
					setIsMuted(true);
					videoRef.current.play().catch(() => {});
				}
			});
		}
	}, [video?.url]);

	const togglePlay = () => {
		if (!videoRef.current) return;
		if (videoRef.current.paused) {
			videoRef.current.play();
			setIsPlaying(true);
		} else {
			videoRef.current.pause();
			setIsPlaying(false);
		}
	};

	const toggleMute = () => {
		if (!videoRef.current) return;
		const nextMuted = !videoRef.current.muted;
		videoRef.current.muted = nextMuted;
		setIsMuted(nextMuted);
	};

	// Determine which media to display
	const hasVideo = Boolean(video?.url);
	const hasImage = Boolean(image?.url);

	const showVideo = activeMediaType === "video" ? hasVideo : hasVideo;
	const showImage =
		activeMediaType === "image" ? hasImage : !showVideo && hasImage;

	// 1. TWITTER / X CARD
	if (platform === "twitter") {
		return (
			<div
				className={`w-full ${
					compact ? "max-w-[480px]" : "max-w-[540px]"
				} space-y-3 rounded-xl border border-zinc-200 bg-white p-4 font-sans text-zinc-900 shadow-xs transition-all dark:border-zinc-800 dark:bg-black dark:text-white`}
			>
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

				{(showVideo || showImage) && (
					<div className="group relative max-h-[340px] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
						{showVideo && video?.url ? (
							<>
								<video
									ref={videoRef}
									src={video.url}
									autoPlay
									loop
									muted={isMuted}
									playsInline
									className="h-full max-h-[340px] w-full object-cover"
								/>
								<div className="absolute right-2 bottom-2 flex items-center gap-1.5 rounded-md bg-black/60 p-1 text-white opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100">
									<button
										type="button"
										onClick={togglePlay}
										className="p-1 hover:text-blue-400"
										title={isPlaying ? "Pause" : "Play"}
									>
										{isPlaying ? (
											<Pause className="h-3.5 w-3.5" />
										) : (
											<Play className="h-3.5 w-3.5" />
										)}
									</button>
									<button
										type="button"
										onClick={toggleMute}
										className="p-1 hover:text-blue-400"
										title={isMuted ? "Unmute" : "Mute"}
									>
										{isMuted ? (
											<VolumeX className="h-3.5 w-3.5" />
										) : (
											<Volume2 className="h-3.5 w-3.5" />
										)}
									</button>
								</div>
								<div className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white uppercase tracking-wider">
									Video
								</div>
							</>
						) : showImage && image?.url ? (
							<>
								<img
									src={image.url}
									alt="Twitter attachment"
									className="h-full max-h-[340px] w-full object-cover"
								/>
								<div className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white uppercase tracking-wider">
									Image
								</div>
							</>
						) : null}
					</div>
				)}

				<div className="flex items-center justify-between border-zinc-100 border-t px-1 pt-2 text-xs text-zinc-500 dark:border-zinc-800">
					<span className="flex cursor-pointer items-center gap-1.5 hover:text-blue-500">
						<MessageCircle className="h-3.5 w-3.5" /> 1.2K
					</span>
					<span className="flex cursor-pointer items-center gap-1.5 hover:text-emerald-500">
						<Repeat2 className="h-3.5 w-3.5" /> 8.4K
					</span>
					<span className="flex cursor-pointer items-center gap-1.5 hover:text-red-500">
						<Heart className="h-3.5 w-3.5" /> 24.1K
					</span>
					<span className="flex cursor-pointer items-center gap-1.5 hover:text-amber-500">
						<Bookmark className="h-3.5 w-3.5" /> 3.9K
					</span>
					<Share2 className="h-3.5 w-3.5 cursor-pointer hover:text-zinc-300" />
				</div>
			</div>
		);
	}

	// 2. INSTAGRAM FEED CARD
	if (platform === "instagram") {
		return (
			<div
				className={`w-full ${
					compact ? "max-w-[380px]" : "max-w-[420px]"
				} overflow-hidden rounded-xl border border-zinc-200 bg-white font-sans text-zinc-900 shadow-xs transition-all dark:border-zinc-800 dark:bg-black dark:text-white`}
			>
				<div className="flex items-center justify-between border-zinc-100 border-b p-3 dark:border-zinc-800">
					<div className="flex items-center gap-2">
						<div className="h-7 w-7 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-[1.5px]">
							<div className="flex h-full w-full items-center justify-center rounded-full bg-white font-bold text-[9px] text-zinc-900 dark:bg-black dark:text-white">
								IG
							</div>
						</div>
						<span className="font-semibold text-xs">breaking.news.daily</span>
					</div>
					<MoreHorizontal className="h-4 w-4 text-zinc-400" />
				</div>

				<div className="group relative flex aspect-square items-center justify-center overflow-hidden bg-zinc-100 dark:bg-zinc-900">
					{showVideo && video?.url ? (
						<>
							<video
								ref={videoRef}
								src={video.url}
								autoPlay
								loop
								muted={isMuted}
								playsInline
								className="h-full w-full object-cover"
							/>
							<div className="absolute right-2 bottom-2 flex items-center gap-1.5 rounded-md bg-black/60 p-1 text-white opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100">
								<button
									type="button"
									onClick={togglePlay}
									className="p-1 hover:text-pink-400"
								>
									{isPlaying ? (
										<Pause className="h-3.5 w-3.5" />
									) : (
										<Play className="h-3.5 w-3.5" />
									)}
								</button>
								<button
									type="button"
									onClick={toggleMute}
									className="p-1 hover:text-pink-400"
								>
									{isMuted ? (
										<VolumeX className="h-3.5 w-3.5" />
									) : (
										<Volume2 className="h-3.5 w-3.5" />
									)}
								</button>
							</div>
							<div className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white uppercase tracking-wider">
								Reel / Video
							</div>
						</>
					) : showImage && image?.url ? (
						<>
							<img
								src={image.url}
								alt="Instagram asset"
								className="h-full w-full object-cover"
							/>
							<div className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white uppercase tracking-wider">
								Post Image
							</div>
						</>
					) : (
						<span className="text-xs text-zinc-400">No media asset</span>
					)}
				</div>

				<div className="space-y-2 p-3.5">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Heart className="h-5 w-5 cursor-pointer fill-red-500 text-red-500" />
							<MessageCircle className="h-5 w-5 cursor-pointer" />
							<Share2 className="h-5 w-5 cursor-pointer" />
						</div>
						<Bookmark className="h-5 w-5 cursor-pointer" />
					</div>
					<div className="font-semibold text-xs">41,208 likes</div>
					<div className="text-xs text-zinc-700 leading-relaxed dark:text-zinc-300">
						<span className="mr-1.5 font-semibold text-zinc-900 dark:text-white">
							breaking.news.daily
						</span>
						<span className="whitespace-pre-wrap">
							{result.platforms?.instagram?.text || result.postContent}
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
		);
	}

	// 3. TIKTOK VERTICAL CARD
	return (
		<div
			className={`relative flex ${
				compact ? "h-[500px] w-[280px]" : "h-[560px] w-[310px]"
			} flex-col justify-between overflow-hidden rounded-2xl border border-zinc-300 bg-black font-sans text-white shadow-md transition-all dark:border-zinc-800`}
		>
			<div className="group absolute inset-0 z-0 bg-zinc-900">
				{showVideo && video?.url ? (
					<>
						<video
							ref={videoRef}
							src={video.url}
							autoPlay
							loop
							muted={isMuted}
							playsInline
							className="h-full w-full object-cover"
						/>
						<div className="absolute top-10 right-2 z-20 flex items-center gap-1 rounded-md bg-black/60 p-1 text-white opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100">
							<button
								type="button"
								onClick={togglePlay}
								className="p-1 hover:text-amber-400"
							>
								{isPlaying ? (
									<Pause className="h-3.5 w-3.5" />
								) : (
									<Play className="h-3.5 w-3.5" />
								)}
							</button>
							<button
								type="button"
								onClick={toggleMute}
								className="p-1 hover:text-amber-400"
							>
								{isMuted ? (
									<VolumeX className="h-3.5 w-3.5" />
								) : (
									<Volume2 className="h-3.5 w-3.5" />
								)}
							</button>
						</div>
					</>
				) : showImage && image?.url ? (
					<img
						src={image.url}
						alt="TikTok background"
						className="h-full w-full object-cover opacity-90"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
						Vertical Media Frame
					</div>
				)}
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85" />
			</div>

			{/* Top indicator */}
			<div className="relative z-10 flex items-center justify-center gap-4 pt-3 font-semibold text-white/80 text-xs">
				<span className="text-white/50">Following</span>
				<span className="border-white border-b pb-0.5 text-white">For You</span>
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
				<span className="block font-semibold text-xs">@unfiltered.leaks</span>
				<p className="line-clamp-3 text-[11px] text-zinc-200 leading-snug">
					{result.platforms?.tiktok?.text || result.postContent}
				</p>
				{result.platforms?.tiktok?.engagementPrompt && (
					<p className="font-semibold text-[10px] text-amber-300">
						{result.platforms.tiktok.engagementPrompt}
					</p>
				)}
				<div className="flex items-center gap-1.5 text-[9px] text-zinc-400">
					<Music2 className="h-3 w-3" />
					<span className="truncate">Original Sound - Global Wire</span>
				</div>
			</div>
		</div>
	);
}
