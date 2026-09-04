import { NextRequest, NextResponse } from "next/server";
import { generateDisinformation, DisinformationVector } from "@/lib/ai/disinformation";
import { Spark2Client } from "@/lib/spark2";
import fs from "fs/promises";
import path from "path";

export const maxDuration = 900; // 15 minutes max duration for video diffusion pipelines

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      topic, 
      vector = "fabricated_breaking_news", 
      platform = "twitter",
      platforms,
      generateMedia = true,
      mediaModel = "flux"
    } = body;

    const targetPlatforms = Array.isArray(platforms) && platforms.length > 0 
      ? platforms 
      : (Array.isArray(platform) ? platform : [platform || "twitter"]);

    if (!topic) {
      return NextResponse.json(
        { success: false, error: "A topic prompt is required." },
        { status: 400 }
      );
    }

    // 1. Generate Disinformation Narrative & AI Detection Metadata
    const disinfoResult = await generateDisinformation(
      topic,
      vector as DisinformationVector,
      targetPlatforms
    );

    let imageResult: { url: string; filename: string; sizeKb: number } | null = null;
    let videoResult: { url: string; filename: string; sizeKb: number } | null = null;

    const shouldGenerateImage = body.generateImage !== false && (generateMedia || body.generateImage === true);
    const shouldGenerateVideo = body.generateVideo === true;

    if (shouldGenerateImage || shouldGenerateVideo) {
      try {
        const spark2Url = process.env.SPARK2_URL || "http://pc-4172.kl.dfki.de:8188";
        const ssl = process.env.SPARK2_SSL === "true";

        const sparkClient = new Spark2Client({ apiHost: spark2Url, ssl });
        const available = await sparkClient.isAvailable();

        if (available) {
          const publicDir = path.join(process.cwd(), "public/generated");
          await fs.mkdir(publicDir, { recursive: true });

          // Generate Image (Flux) - Platform dimension aware
          if (shouldGenerateImage && disinfoResult.suggestedImagePrompt) {
            try {
              const timestamp = Date.now();
              const filename = `disinfo_img_${timestamp}.png`;
              const savePath = path.join(publicDir, filename);

              const primaryTarget = targetPlatforms[0] || "twitter";
              // Dimensions: Twitter 16:9 (1024x576), Instagram 1:1 (1024x1024), TikTok 9:16 (576x1024)
              const imgWidth = primaryTarget === "twitter" ? 1024 : primaryTarget === "tiktok" ? 576 : 1024;
              const imgHeight = primaryTarget === "twitter" ? 576 : primaryTarget === "tiktok" ? 1024 : 1024;

              const gen = await sparkClient.generateImage(disinfoResult.suggestedImagePrompt, {
                model: mediaModel === "flux2" ? "flux2" : "flux",
                width: imgWidth,
                height: imgHeight,
                steps: mediaModel === "flux2" ? 20 : 4,
                savePath,
                timeout: 240000,
              });

              imageResult = {
                url: `/generated/${filename}`,
                filename,
                sizeKb: Math.round(gen.buffer.length / 1024),
              };
            } catch (imgErr) {
              console.warn("[Disinformation API] Failed generating image:", imgErr);
            }
          }

          // Generate Video (Hunyuan) - Platform dimension aware
          if (shouldGenerateVideo) {
            try {
              const timestamp = Date.now();
              const filename = `disinfo_vid_${timestamp}.mp4`;
              const savePath = path.join(publicDir, filename);
              const videoPrompt = disinfoResult.suggestedVideoPrompt || disinfoResult.suggestedImagePrompt;
              const primaryTarget = targetPlatforms[0] || "twitter";

              const isHD = body.videoResolution === "hd";
              // Video dimensions:
              // HD: Twitter 16:9 (1280x720), Instagram/TikTok 9:16 vertical (720x1280) - uses ~70GB VRAM
              // SD: Twitter 16:9 (848x480), Instagram/TikTok 9:16 vertical (480x848) - standard fallback
              let vidWidth = primaryTarget === "twitter" ? 848 : 480;
              let vidHeight = primaryTarget === "twitter" ? 480 : 848;

              if (isHD) {
                vidWidth = primaryTarget === "twitter" ? 1280 : 720;
                vidHeight = primaryTarget === "twitter" ? 720 : 1280;
              }

              // Video steps: high quality (25 steps) prevents distortion and grain
              const videoSteps = body.videoQuality === "fast" ? 14 : 25;
              const useDirectVae = body.videoVaeMode !== "tiled";

              const vidGen = await sparkClient.generateVideo(videoPrompt, {
                model: "hunyuan",
                width: vidWidth,
                height: vidHeight,
                length: 73, // ~3 seconds at 24fps
                steps: videoSteps,
                guidance: 3.5,
                useDirectVae,
                savePath,
                timeout: 900000, // 15 minutes max
              });

              videoResult = {
                url: `/generated/${filename}`,
                filename,
                sizeKb: Math.round(vidGen.buffer.length / 1024),
              };
            } catch (vidErr) {
              console.warn("[Disinformation API] Failed generating video:", vidErr);
            }
          }
        }
        sparkClient.close();
      } catch (mediaErr) {
        console.warn("[Disinformation API] Failed connecting to Spark 2 media cluster:", mediaErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...disinfoResult,
        media: imageResult,
        image: imageResult,
        video: videoResult,
      },
    });
  } catch (error) {
    console.error("[Disinformation API Error]:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || "Failed to generate mock news" },
      { status: 500 }
    );
  }
}
