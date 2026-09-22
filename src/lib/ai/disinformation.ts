import { GoogleGenerativeAI } from "@google/generative-ai";

function getGeminiModel() {
	const apiKey = process.env.GOOGLE_API_KEY || "";
	if (!apiKey) return null;
	const genAI = new GoogleGenerativeAI(apiKey);
	return genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
}

export type DisinformationVector =
	| "fabricated_breaking_news"
	| "conspiracy_leak"
	| "ragebait_emotional"
	| "misleading_statistics"
	| "satire_parody";

export type Platform = "twitter" | "instagram" | "tiktok";

export interface PlatformPost {
	text: string;
	hashtags: string[];
	engagementPrompt?: string; // e.g. "Save for later", "Link in bio", "Stitch this"
}

export interface DisinformationResult {
	headline: string;
	selectedPlatform: Platform;
	postContent: string; // Content for the active primary platform
	platforms: Record<Platform, PlatformPost>; // Tailored posts for all 3 platforms
	suggestedImagePrompt: string; // Platform-aware visual prompt
	suggestedVideoPrompt: string; // Platform-aware vertical / dynamic video prompt
	suggestedAudioPrompt: string; // Dialogue-aligned spoken statement and audio soundscape
}

const VECTOR_DESCRIPTIONS: Record<DisinformationVector, string> = {
	fabricated_breaking_news:
		"Fabricated breaking news event with urgent tone, pseudo-credible journalistic phrasing, pseudo-unnamed sources, and manufactured emergency or major policy shift.",
	conspiracy_leak:
		"An alleged 'whistleblower leak' or hidden agenda narrative claiming an organization or government is hiding a shocking truth, appealing to distrust of institutions.",
	ragebait_emotional:
		"Emotionally charged framing designed to provoke outrage, division, or moral panic by exaggerating or twisting a contentious social, economic, or regulatory topic.",
	misleading_statistics:
		"Using manipulated numbers, false causal links, distorted charts, or bogus sample sizes to create an impression of scientific or economic consensus around a false claim.",
	satire_parody:
		"Absurdist or dry parody written so closely to actual corporate or institutional PR that automated classifiers struggle to distinguish sarcasm from authentic communication.",
};

const PLATFORM_MEDIA_GUIDELINES: Record<
	Platform,
	{ imageGuide: string; videoGuide: string }
> = {
	twitter: {
		imageGuide:
			"Landscape 16:9 news broadcast photograph, press photojournalism style directly depicting the key entities, locations, and action of the topic.",
		videoGuide:
			"16:9 landscape cinematic news broadcast clip. The scene MUST directly depict the primary entities, setting, vehicles, or crisis described in the target topic with clear visible motion.",
	},
	instagram: {
		imageGuide:
			"Square 1:1 or vertical 4:5 high-engagement Instagram slide, high-contrast dramatic visual directly portraying the specific subject matter.",
		videoGuide:
			"9:16 vertical Instagram Reel format, fast-paced dramatic clip visually dramatizing the exact people, locations, and central action of the scenario.",
	},
	tiktok: {
		imageGuide:
			"9:16 vertical smartphone screen-capture, leaked document photograph or viral aesthetic centered on the topic.",
		videoGuide:
			"9:16 vertical TikTok POV viral footage, handheld smartphone camera movement, suspenseful and immersive video explicitly set in the scenario's primary location.",
	},
};

export async function generateDisinformation(
	topic: string,
	vector: DisinformationVector = "fabricated_breaking_news",
	platformsInput: Platform | Platform[] = ["twitter", "instagram", "tiktok"],
): Promise<DisinformationResult> {
	const selectedPlatforms: Platform[] = Array.isArray(platformsInput)
		? platformsInput.length > 0
			? platformsInput
			: ["twitter"]
		: [platformsInput];
	const primaryPlatform = selectedPlatforms[0];
	const vectorInstruction = VECTOR_DESCRIPTIONS[vector];

	const mediaGuidelineList = selectedPlatforms
		.map((p) => {
			const guide = PLATFORM_MEDIA_GUIDELINES[p];
			return `For ${p.toUpperCase()}: ${guide.imageGuide} | Video: ${guide.videoGuide}`;
		})
		.join("\n");

	const systemPrompt = `You are an elite multimodal AI prompt engineer and synthetic media synthesizer specializing in generating highly authentic mock news packages.
You must tailor the output specifically for TWITTER (concise breaking wire, <=280 chars), INSTAGRAM (engaging caption, hook, hashtags), and TIKTOK (viral curiosity hook, high urgency).

Target Topic: "${topic}"
Style Vector: "${vector}" (${vectorInstruction})
Selected Platforms: ${selectedPlatforms.map((p) => p.toUpperCase()).join(", ")}

Media Context Guidelines for Selected Platforms:
${mediaGuidelineList}

=============================================================================
STRICT PROMPT ENGINEERING GUIDELINES FOR THE GENERATION ENGINES:
=============================================================================

1. "suggestedImagePrompt" (Tailored for FLUX.1 Schnell & FLUX.2 Dev):
   - Flux excels with natural, descriptive prose that specifies the exact visual scene rather than comma-separated keywords.
   - You MUST explicitly depict the specific subject matter, people, institutional headquarters, documents, vehicles, or physical objects central to "${topic}".
   - Specify photographic attributes: camera perspective (e.g. eye-level news telephoto, wide press conference view, documentary 35mm), lighting (e.g. sharp directional overhead conference lights, moody twilight drizzle, high-contrast press flash), texture (e.g. realistic skin pores, reflective glass facade, matte press badge lanyard), depth of field, and photorealistic photojournalism style.
   - AVOID quality buzzwords like "hyperrealistic, 8k, photorealistic masterpiece". Instead, describe the physical qualities that prove realism (e.g. "detailed photographic grain, natural ambient office bounce lighting, authentic editorial news photo").

2. "suggestedVideoPrompt" (Tailored specifically for WAN 2.2 TI2V 5B Diffusion Model):
   - Wan 2.2 requires explicit, continuous kinetic descriptions that directly dramatize "${topic}".
   - Structuring Formula for Wan 2.2:
     [Camera Movement] + [Primary Subject & Setting directly depicting ${topic}] + [Continuous Temporal Motion / Action] + [Cinematic Lighting & Atmosphere].
   - EXPLICIT CAMERA MOVEMENT: Specify continuous cinematic motion: e.g. "Slow forward camera dolly tracking shot", "Smooth low-angle pan", "Handheld documentary camera following...", "Subtle arc shot circling...".
   - EXPLICIT TEMPORAL ACTION: Describe what physically moves across the 10-15 second duration: e.g. "spokesperson sternly leans toward the podium microphone, glancing at briefing notes as camera shutters flash in the background", or "financial traders urgently gather around a blinking terminal displaying alert graphs as digital tickers stream overhead".
   - CRITICAL FONT / TEXT RULE FOR VIDEO DIFFUSION: DO NOT prompt the video model to render long sentences, detailed paragraphs, or specific text banners inside the video frames. Diffusion models cannot spell complex in-video text cleanly and produce scuffed, garbled, glitchy fonts. Focus the video prompt strictly on realistic people, locations, objects, body language, screens with abstract graphical charts/heatmaps/visual alert icons, camera motion, and cinematic atmospheric lighting.
   - HIGH REALISM & ANATOMY: Insist on natural physical motion, authentic editorial newsroom/field aesthetics, and high-fidelity textures without anatomical distortions.

3. "suggestedAudioPrompt" (Tailored for Stable Audio Open 1.0):
   - You MUST generate an authentic, professional television broadcast news audio cue that directly matches the specific subject and mood of "${topic}".
   - ACOUSTIC ARCHITECTURE:
     1. Broadcast Theme & Sound Design: A professional, polished 24-hour news network audio signature (e.g. sharp urgent synth brass stabs or low orchestral strings motif, subtle broadcast room ambiance, television studio soundstage reverberation).
     2. Spoken Dialogue / Newsroom Address: Direct, articulate spokesperson or news anchor dialogue reading a concise, urgent statement that directly quotes the breaking development for "${topic}".
   - STRUCTURE FORMULA:
     "Professional broadcast television news intro theme with tense orchestral motif and subtle electronic percussion, layered with an authoritative newsroom anchor speaking clearly into studio microphone: '[Specific 1-2 sentence spoken announcement addressing ${topic}]', pristine broadcast acoustics, polished television network sound production".
   - CRITICAL QUALITY RULES:
     - Must directly quote or announce the specific events of "${topic}".
     - Keep the spoken quote concise (under 25 words) so speech cadence is natural and clear over 10-15 seconds.
     - Avoid chaotic sound effects, muddled noise, or generic action movie cliches.

Respond ONLY with a valid, raw JSON object (no markdown code blocks, no backticks, no explanatory text, no <think>...</think> tags).
The JSON must follow this exact structure:
{
  "headline": "Short gripping mock headline directly citing the topic",
  "selectedPlatform": "${primaryPlatform}",
  "postContent": "The primary post text tailored for ${primaryPlatform}",
  "platforms": {
    "twitter": {
      "text": "Urgent, breaking news tweet draft under 280 characters with 2-3 hashtags",
      "hashtags": ["#BreakingNews", "#Headline"]
    },
    "instagram": {
      "text": "Engaging Instagram post caption with headline hook, body context, and call to action",
      "hashtags": ["#news", "#breaking", "#update"],
      "engagementPrompt": "Swipe left for evidence 👉 Link in bio for full briefing"
    },
    "tiktok": {
      "text": "Viral TikTok video caption with high curiosity hook and sound tag context",
      "hashtags": ["#fyp", "#breakingnews", "#viral", "#foryou"],
      "engagementPrompt": "Wait till the end 😳 Share before this gets taken down!"
    }
  },
  "suggestedImagePrompt": "Detailed natural prose photograph describing '${topic}' tailored for Flux",
  "suggestedVideoPrompt": "Cinematic camera movement and continuous motion scene explicitly depicting '${topic}' for Wan 2.2",
  "suggestedAudioPrompt": "Professional broadcast television news intro theme with tense orchestral motif, layered with authoritative news anchor speaking clearly into studio microphone: '[Specific urgent statement quoting ${topic}]', pristine broadcast acoustics"
}`;

	let rawJson = "";

	// 1. Primary: Gemini 3.6 Flash (fast, high-quality, rich topic adherence)
	const geminiModel = getGeminiModel();
	if (geminiModel) {
		try {
			const result = await geminiModel.generateContent({
				contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
				generationConfig: { responseMimeType: "application/json" },
			});
			const response = await result.response;
			rawJson = response.text().trim();
		} catch (geminiErr) {
			console.warn(
				"[Disinformation Engine] Gemini error, checking Ollama fallback:",
				geminiErr,
			);
		}
	}

	// 2. Secondary: Spark 2 Ollama (Qwen 3.8 27B) if Gemini didn't run or failed
	if (!rawJson && process.env.USE_OLLAMA !== "false") {
		const ollamaHost =
			process.env.OLLAMA_HOST || "http://pc-4172.kl.dfki.de:11434";
		const ollamaModel = process.env.OLLAMA_MODEL || "qwen3.8:27b";
		try {
			const response = await fetch(`${ollamaHost}/api/generate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				signal: AbortSignal.timeout(18000),
				body: JSON.stringify({
					model: ollamaModel,
					prompt: `${systemPrompt}\n\nIMPORTANT: Output only the raw JSON string. Do not output anything else.`,
					stream: false,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				let text = (data.response || "").trim();
				text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
				rawJson = text;
			}
		} catch (err) {
			console.warn("[Disinformation Engine] Spark Ollama network error:", err);
		}
	}

	// Parse JSON cleanly
	try {
		const cleaned = rawJson
			.replace(/^```json/i, "")
			.replace(/```$/i, "")
			.trim();
		const parsed = JSON.parse(cleaned) as DisinformationResult;

		// Ensure platforms structure is always populated
		if (!parsed.platforms) {
			parsed.platforms = {
				twitter: {
					text: parsed.postContent || `BREAKING: ${parsed.headline}`,
					hashtags: ["#BreakingNews", `#${topic.replace(/\s+/g, "")}`],
				},
				instagram: {
					text: `🚨 BREAKING UPDATE: ${parsed.headline}\n\n${parsed.postContent || "Reports are developing rapidly."}\n\nSwipe left for verified source signals. Link in bio for ongoing timeline.`,
					hashtags: ["#news", "#breaking", "#trending"],
					engagementPrompt: "Save & share this report before it is suppressed.",
				},
				tiktok: {
					text: `WAIT... WHAT JUST HAPPENED?! 😳 ${parsed.headline} #fyp #viral #breaking`,
					hashtags: ["#fyp", "#breaking", "#viral"],
					engagementPrompt: "Sound original • Stitch this with your reaction",
				},
			};
		}
		parsed.selectedPlatform = primaryPlatform;
		parsed.postContent =
			parsed.platforms[primaryPlatform]?.text || parsed.postContent;
		return parsed;
	} catch (parseError) {
		console.error(
			"Failed to parse Disinformation JSON response:",
			rawJson,
			parseError,
		);
		const defaultText = `🚨 URGENT: Insiders leak unprecedented updates on ${topic}. Official sources remain silent as unexpected developments unfold. Developing story... #BreakingNews #${topic.replace(/\s+/g, "")}`;
		return {
			headline: `BREAKING: Unverified reports emerge regarding ${topic}`,
			selectedPlatform: primaryPlatform,
			postContent: defaultText,
			platforms: {
				twitter: {
					text: `BREAKING: Unverified reports emerge regarding ${topic}. Developing story... #BreakingNews`,
					hashtags: ["#BreakingNews", "#Update"],
				},
				instagram: {
					text: `🚨 BREAKING DEVELOPMENTS: Unverified reports emerge regarding ${topic}.\n\nInsiders claim major regulatory shifts are occurring behind closed doors.\n\nSave this post and check back for updates.`,
					hashtags: ["#breaking", "#news", "#update", "#explore"],
					engagementPrompt: "Tap the link in bio for full briefing.",
				},
				tiktok: {
					text: `Did they really think nobody would notice this?! 😳 ${topic} #fyp #breakingnews #foryou`,
					hashtags: ["#fyp", "#breakingnews", "#viral"],
					engagementPrompt: "Share before this gets taken down!",
				},
			},
			suggestedImagePrompt: `A dramatic, high-contrast photojournalistic shot related to ${topic}, breaking news atmosphere, telephoto lens, 4k`,
			suggestedVideoPrompt: `Cinematic breaking news video footage showing emergency vehicles and motion related to ${topic}, documentary news broadcast camera style, 4k`,
			suggestedAudioPrompt: `Spokesperson speaking clearly through broadcast microphone addressing reporters about ${topic}, natural press conference speech dialogue and room reverberation, professional acoustic broadcast`,
		};
	}
}
