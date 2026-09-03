import { NextRequest, NextResponse } from "next/server";

export async function GET() {
	const spark2Url = process.env.SPARK2_URL || "http://pc-4172.kl.dfki.de:8188";
	const ollamaHost = process.env.OLLAMA_HOST || "http://pc-4172.kl.dfki.de:11434";

	let comfyOk = false;
	let ollamaOk = false;
	let gpuInfo = "NVIDIA GB10";
	let vramFree = "Unknown";

	// Test ComfyUI
	try {
		const res = await fetch(`${spark2Url}/system_stats`, { signal: AbortSignal.timeout(3000) });
		if (res.ok) {
			const data = await res.json();
			comfyOk = true;
			if (data.devices?.[0]) {
				gpuInfo = data.devices[0].name.split(":")[1]?.trim() || "GB10";
				const freeGb = Math.round(data.devices[0].vram_free / (1024 * 1024 * 1024));
				const totalGb = Math.round(data.devices[0].vram_total / (1024 * 1024 * 1024));
				vramFree = `${freeGb}GB / ${totalGb}GB`;
			}
		}
	} catch {}

	// Test Ollama
	try {
		const res = await fetch(`${ollamaHost}/api/tags`, { signal: AbortSignal.timeout(3000) });
		if (res.ok) {
			ollamaOk = true;
		}
	} catch {}

	return NextResponse.json({
		success: comfyOk && ollamaOk,
		spark: {
			comfyui: comfyOk ? "ONLINE" : "OFFLINE",
			ollama: ollamaOk ? "ONLINE" : "OFFLINE",
			gpu: gpuInfo,
			vram: vramFree,
			host: "pc-4172.kl.dfki.de",
		},
	});
}
