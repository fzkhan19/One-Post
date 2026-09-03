import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

const PLATFORM_MEDIA_GUIDELINES: Record<Platform, { imageGuide: string; videoGuide: string }> = {
  twitter: {
    imageGuide: "Landscape 16:9 news broadcast photograph, press photojournalism style with breaking news chyron or watermark.",
    videoGuide: "16:9 landscape breaking news eyewitness or dashcam footage, documentary news camera work.",
  },
  instagram: {
    imageGuide: "Square 1:1 or vertical 4:5 high-engagement Instagram carousel slide or bold infographic-style breaking news visual.",
    videoGuide: "9:16 vertical Instagram Reel format, fast-paced dramatic clip with visual text hooks for mobile screen.",
  },
  tiktok: {
    imageGuide: "9:16 vertical smartphone screen-capture, leaked document photograph or viral TikTok slideshow aesthetic.",
    videoGuide: "9:16 vertical TikTok POV viral footage, handheld smartphone camera movement, high suspense, immersive UGC style.",
  },
};

export async function generateDisinformation(
  topic: string,
  vector: DisinformationVector = "fabricated_breaking_news",
  platformsInput: Platform | Platform[] = ["twitter", "instagram", "tiktok"]
): Promise<DisinformationResult> {
  const selectedPlatforms: Platform[] = Array.isArray(platformsInput) 
    ? (platformsInput.length > 0 ? platformsInput : ["twitter"])
    : [platformsInput];
  const primaryPlatform = selectedPlatforms[0];
  const vectorInstruction = VECTOR_DESCRIPTIONS[vector];
  
  const mediaGuidelineList = selectedPlatforms.map((p) => {
    const guide = PLATFORM_MEDIA_GUIDELINES[p];
    return `For ${p.toUpperCase()}: ${guide.imageGuide} | Video: ${guide.videoGuide}`;
  }).join("\n");

  const systemPrompt = `You are an AI generating realistic mock news / synthetic social media information given a topic.
You must tailor the output specifically for TWITTER (concise, breaking news style, <=280 chars), INSTAGRAM (longer caption, hooks, emojis, rich hashtags), and TIKTOK (viral caption, high urgency, short punchy hook for vertical feed).

Target Topic: "${topic}"
Style Vector: "${vector}" (${vectorInstruction})
Selected Platforms: ${selectedPlatforms.map(p => p.toUpperCase()).join(", ")}

Media Context Guidelines for Selected Platforms:
${mediaGuidelineList}

Generate realistic, highly convincing mock news for this scenario across all selected platforms.
Respond ONLY with a valid, raw JSON object (no markdown code blocks, no backticks, no explanatory text, no <think>...</think> tags).
The JSON must follow this exact structure:
{
  "headline": "Short gripping mock headline",
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
  "suggestedImagePrompt": "Detailed visual description for Flux image generation tailored for ${primaryPlatform}",
  "suggestedVideoPrompt": "Cinematic visual description for Hunyuan video generation tailored for ${primaryPlatform}"
}`;

  let rawJson = "";

  // 1. Try Spark 2 Ollama (Qwen 3.8 27B)
  const useOllama = process.env.USE_OLLAMA !== "false";
  if (useOllama) {
    const ollamaHost = process.env.OLLAMA_HOST || "http://pc-4172.kl.dfki.de:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "qwen3.8:27b";
    try {
      const response = await fetch(`${ollamaHost}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: `${systemPrompt}\n\nIMPORTANT: Output only the raw JSON string. Do not output anything else.`,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[Disinformation Engine] Spark Ollama error (${response.status}):`, errText);
      } else {
        const data = await response.json();
        let text = (data.response || "").trim();
        text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        rawJson = text;
      }
    } catch (err) {
      console.warn("[Disinformation Engine] Spark Ollama network error, falling back to Gemini:", err);
    }
  }

  // 2. Fallback to Gemini if Ollama produced no text
  if (!rawJson) {
    try {
      const result = await geminiModel.generateContent({
        contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      });
      const response = await result.response;
      rawJson = response.text().trim();
    } catch (geminiErr) {
      console.warn("[Disinformation Engine] Gemini fallback also failed, using template:", geminiErr);
    }
  }

  // Parse JSON cleanly
  try {
    const cleaned = rawJson.replace(/^```json/i, "").replace(/```$/i, "").trim();
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
    parsed.postContent = parsed.platforms[primaryPlatform]?.text || parsed.postContent;
    return parsed;
  } catch (parseError) {
    console.error("Failed to parse Disinformation JSON response:", rawJson, parseError);
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
    };
  }
}
