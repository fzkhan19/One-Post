"use client";

import { useEffect, useState } from "react";
import { LinkedInAuth } from "@/components/LinkedInAuth";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

interface AccountManagerProps {
	linkedInToken: string;
	onLinkedInSuccess: (token: string) => void;
	onDisconnect: (platform: string) => void;
}

export function AccountManager({ linkedInToken, onLinkedInSuccess, onDisconnect }: AccountManagerProps) {
	const [linkedinExpiration, setLinkedinExpiration] = useState<string | null>(null);

	useEffect(() => {
		const expiration = localStorage.getItem("linkedin_token_expiration");
		if (expiration) {
			const date = new Date(Number.parseInt(expiration));
			setLinkedinExpiration(date.toLocaleDateString() + " at " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
		} else {
			setLinkedinExpiration(null);
		}
	}, [linkedInToken]);

	return (
		<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
			{/* LinkedIn Card */}
			<div className="border-[3px] border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.15)]">
				<div className="flex flex-row items-center space-x-4 bg-zinc-100 dark:bg-zinc-800 border-b-[3px] border-black dark:border-white p-4">
					<div className="border-2 border-black dark:border-white bg-[#0077b5] p-2 text-white">
						<Icons.linkedin className="h-6 w-6" />
					</div>
					<div>
						<h3 className="text-sm font-black uppercase tracking-tighter">LINKEDIN_PRO</h3>
						<p className="text-[10px] font-bold uppercase opacity-60">PROFESSIONAL_GRAPH</p>
					</div>
				</div>
				<div className="p-6">
					<AnimatePresence mode="wait">
						{linkedInToken ? (
							<motion.div
								key="connected"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="space-y-4"
							>
								<div className="flex items-center space-x-2 text-accent font-black text-xs uppercase tracking-widest">
									<CheckCircle2 className="h-5 w-5" />
									<span>LINK_ESTABLISHED</span>
								</div>
								
								{linkedinExpiration && (
									<div className="text-[10px] bg-zinc-50 dark:bg-zinc-900 p-3 border-2 border-black dark:border-white font-bold">
										<p className="text-zinc-500 uppercase mb-1">TTL_EXPIRY:</p>
										<p className="uppercase">{linkedinExpiration}</p>
									</div>
								)}

								<Button
									variant="outline"
									className="w-full rounded-none border-2 border-black dark:border-white hover:bg-red-500 hover:text-white transition-none font-black text-xs uppercase"
									onClick={() => onDisconnect("linkedin")}
								>
									KILL_CONNECTION
								</Button>
							</motion.div>
						) : (
							<motion.div
								key="disconnected"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="space-y-4"
							>
								<div className="flex items-center space-x-2 text-zinc-400 font-black text-xs uppercase tracking-widest">
									<XCircle className="h-5 w-5" />
									<span>NO_STREAM_DETECTED</span>
								</div>
								<LinkedInAuth
									clientId={process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID!}
									redirectUri={process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI!}
									onSuccess={onLinkedInSuccess}
								/>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>

			{/* Twitter (X) Card */}
			<div className="border-[3px] border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] transition-all">
				<div className="flex flex-row items-center space-x-4 bg-zinc-100 dark:bg-zinc-800 border-b-[3px] border-black dark:border-white p-4">
					<div className="border-2 border-black dark:border-white bg-black p-2 text-white">
						<Icons.x className="h-6 w-6" />
					</div>
					<div>
						<h3 className="text-sm font-black uppercase tracking-tighter">X_STREAM</h3>
						<p className="text-[10px] font-bold uppercase opacity-60">REALTIME_FEED</p>
					</div>
				</div>
				<div className="p-6">
					<div className="flex items-center space-x-2 text-accent font-black text-xs uppercase tracking-widest">
						<CheckCircle2 className="h-5 w-5" />
						<span>ENV_KEYS_LOADED</span>
					</div>
					<p className="mt-4 text-[10px] font-bold text-zinc-500 uppercase italic">// STATIC_CONFIG_ACTIVE</p>
				</div>
			</div>

			{/* Bluesky Card */}
			<div className="border-[3px] border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] transition-all">
				<div className="flex flex-row items-center space-x-4 bg-zinc-100 dark:bg-zinc-800 border-b-[3px] border-black dark:border-white p-4">
					<div className="border-2 border-black dark:border-white bg-blue-500 p-2 text-white">
						<Icons.globe className="h-6 w-6" />
					</div>
					<div>
						<h3 className="text-sm font-black uppercase tracking-tighter">AT_PROTO</h3>
						<p className="text-[10px] font-bold uppercase opacity-60">DECENTRALIZED_NET</p>
					</div>
				</div>
				<div className="p-6">
					<div className="flex items-center space-x-2 text-accent font-black text-xs uppercase tracking-widest">
						<CheckCircle2 className="h-5 w-5" />
						<span>AUTH_SYNC_COMPLETE</span>
					</div>
					<p className="mt-4 text-[10px] font-bold text-zinc-500 uppercase italic">// PDS_NODE_CONNECTED</p>
				</div>
			</div>
		</div>
	);
}
