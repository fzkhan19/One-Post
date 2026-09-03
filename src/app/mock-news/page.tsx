"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertTriangle, 
  ArrowLeft, 
  Check, 
  Copy, 
  Cpu, 
  Download, 
  ExternalLink, 
  Eye, 
  Flame, 
  Layers, 
  Loader2, 
  Radio, 
  Search, 
  Send, 
  ShieldAlert, 
  Sparkles, 
  Zap,
  MessageCircle,
  Heart,
  Repeat2,
  Bookmark,
  Share2,
  Music2,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { DisinformationVector, DisinformationResult, Platform } from "@/lib/ai/disinformation";

const VECTORS: { id: DisinformationVector; name: string; tag: string; description: string }[] = [
  {
    id: "fabricated_breaking_news",
    name: "BREAKING_NEWS_HOAX",
    tag: "FABRICATED_EVENT",
    description: "Urgent breaking-news framing with simulated insider/unnamed sources.",
  },
  {
    id: "conspiracy_leak",
    name: "CONSPIRACY_LEAK",
    tag: "COVERT_AGENDA",
    description: "Alleged suppressed documents or hidden institutional motives.",
  },
  {
    id: "ragebait_emotional",
    name: "RAGEBAIT_OUTRAGE",
    tag: "POLARIZATION_HOOK",
    description: "Extreme emotional provocation targeting socio-political fractures.",
  },
  {
    id: "misleading_statistics",
    name: "STATISTICAL_DISTORTION",
    tag: "PSEUDO_EMPIRICAL",
    description: "Manipulated percentages, false correlations, or spurious consensus.",
  },
  {
    id: "satire_parody",
    name: "ADVERSARIAL_SATIRE",
    tag: "MIMICRY_BLUR",
    description: "Dry irony imitating official corporate/governmental communications.",
  },
];

export default function MockNewsPage() {
  const [topic, setTopic] = useState("");
  const [vector, setVector] = useState<DisinformationVector>("fabricated_breaking_news");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["twitter", "instagram", "tiktok"]);
  const [previewPlatform, setPreviewPlatform] = useState<Platform>("twitter");
  const [includeImage, setIncludeImage] = useState(true);
  const [includeVideo, setIncludeVideo] = useState(true);
  const [mediaModel, setMediaModel] = useState<"flux" | "flux2">("flux");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [result, setResult] = useState<(DisinformationResult & {
    image?: { url: string; filename: string; sizeKb: number } | null;
    video?: { url: string; filename: string; sizeKb: number } | null;
    media?: { url: string; filename: string; sizeKb: number } | null;
  }) | null>(null);
  const [sparkStatus, setSparkStatus] = useState<{ comfyui: string; ollama: string; vram: string } | null>(null);

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
      } else {
        return [...prev, p];
      }
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
    setResult(null);

    try {
      toast.info(`Generating mock news for [${selectedPlatforms.join(", ")}] on Spark 2...`);
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

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        toast.success("Mock news sample (Text + Assets) generated!");
      } else {
        toast.error(data.error || "Failed to generate mock news.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during generation.");
    } finally {
      setIsGenerating(false);
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
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
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
    <article className="flex min-h-[100dvh] flex-col items-center bg-[#e5e5e5] dark:bg-black p-4 md:p-8 font-mono overflow-auto">
      {/* Grid Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.08]"
        style={{
          backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="w-full max-w-6xl z-10 space-y-6">
        {/* Terminal Header Card */}
        <div className="border-[3px] border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
          {/* Top Bar */}
          <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between border-b-[3px] border-black dark:border-white">
            <div className="flex items-center gap-3">
              <Link 
                href="/"
                className="flex items-center gap-1.5 text-xs font-black uppercase hover:underline bg-black px-2 py-0.5"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </Link>
              <div className="h-4 w-[2px] bg-white/40" />
              <ShieldAlert className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-black tracking-widest uppercase">
                MOCK_NEWS_GENERATOR // SYNTHETIC INFORMATION PIPELINE
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase">
              <span className="bg-black text-white px-2 py-0.5 border border-white">
                SPARK2: {sparkStatus?.ollama === "ONLINE" ? `ONLINE (${sparkStatus.vram})` : "ACTIVE"}
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Context Banner */}
            <div className="border-2 border-black dark:border-white bg-zinc-100 dark:bg-zinc-800 p-4 text-xs font-bold flex items-start gap-3">
              <Zap className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div className="space-y-1">
                <p className="font-black uppercase tracking-wider">MOCK NEWS INPUT GENERATOR</p>
                <p className="opacity-90 leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Provide any scenario or topic. This tool uses the Spark 2 server to generate synthetic mock news headlines, social media posts, and visual assets ready to be fed directly as test input into your AI detection pipeline.
                </p>
              </div>
            </div>

            {/* Input Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Topic & Configuration */}
              <div className="md:col-span-7 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                      <span className="text-red-600 dark:text-red-400">▶</span> Input Target Topic / Scenario:
                    </Label>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">e.g. CBDC, Outage, Climate Leak</span>
                  </div>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="ENTER SCENARIO (e.g., European Central Bank issues mandatory digital euro protocol)..."
                    className="h-14 text-base font-bold rounded-none border-[3px] border-black dark:border-white bg-zinc-50 dark:bg-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px]"
                  />
                </div>

                {/* Vector Selection */}
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-tight text-zinc-600 dark:text-zinc-400">
                    Select Disinformation Manipulation Vector:
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {VECTORS.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVector(v.id)}
                        className={`text-left p-3 border-2 transition-all ${
                          vector === v.id
                            ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black font-black shadow-[3px_3px_0px_0px_rgba(220,38,38,1)]"
                            : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-black"
                        }`}
                      >
                        <div className="text-[10px] uppercase font-mono tracking-widest opacity-80">
                          {v.tag}
                        </div>
                        <div className="text-xs font-bold uppercase mt-0.5">{v.name}</div>
                        <div className="text-[9px] mt-1 opacity-70 leading-tight line-clamp-2">
                          {v.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Platform & Media Controls */}
              <div className="md:col-span-5 space-y-6">
                <div className="border-[3px] border-black dark:border-white p-5 bg-zinc-50 dark:bg-zinc-800/60 space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-2">
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <Radio className="w-4 h-4 text-red-600" /> Target Social Platforms
                    </span>
                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">
                      Select multiple ({selectedPlatforms.length}/3 active)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: "twitter", label: "𝕏 Twitter", desc: "16:9 Landscape" },
                      { id: "instagram", label: "📸 Instagram", desc: "1:1 / 4:5 Feed" },
                      { id: "tiktok", label: "🎵 TikTok", desc: "9:16 Vertical" },
                    ] as const).map((p) => {
                      const isSelected = selectedPlatforms.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePlatform(p.id)}
                          className={`py-2 px-2 text-xs font-black uppercase border-2 border-black dark:border-white transition-all flex flex-col items-center justify-center gap-0.5 relative ${
                            isSelected
                              ? "bg-black text-white dark:bg-white dark:text-black shadow-[3px_3px_0px_0px_rgba(220,38,38,1)]"
                              : "bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 opacity-60 hover:opacity-100 hover:bg-zinc-100"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span>{p.label}</span>
                            {isSelected && <span className="text-red-500 font-black">✓</span>}
                          </div>
                          <span className="text-[9px] font-mono opacity-80">{p.desc}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t-2 border-black dark:border-white space-y-4">
                    <span className="text-xs font-black uppercase text-zinc-500">Spark 2 Synthetic Media Generation:</span>
                    
                    {/* Image generation toggle */}
                    <div className="space-y-2 bg-zinc-50 dark:bg-zinc-800 p-2.5 border border-black dark:border-white">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase flex items-center gap-1.5">
                          🖼️ 1. Photo / Image Asset:
                        </span>
                        <input
                          type="checkbox"
                          checked={includeImage}
                          onChange={(e) => setIncludeImage(e.target.checked)}
                          className="w-4 h-4 rounded-none border-2 border-black accent-red-600 cursor-pointer"
                        />
                      </div>
                      {includeImage && (
                        <div className="flex items-center gap-2 text-[10px] font-bold pt-1">
                          <span className="text-zinc-500 uppercase">Model:</span>
                          <button
                            type="button"
                            onClick={() => setMediaModel("flux")}
                            className={`px-2 py-0.5 border border-black dark:border-white uppercase ${
                              mediaModel === "flux" ? "bg-black text-white dark:bg-white dark:text-black" : ""
                            }`}
                          >
                            Flux Schnell
                          </button>
                          <button
                            type="button"
                            onClick={() => setMediaModel("flux2")}
                            className={`px-2 py-0.5 border border-black dark:border-white uppercase ${
                              mediaModel === "flux2" ? "bg-black text-white dark:bg-white dark:text-black" : ""
                            }`}
                          >
                            Flux.2 Dev
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Video generation toggle */}
                    <div className="space-y-1 bg-zinc-50 dark:bg-zinc-800 p-2.5 border border-black dark:border-white">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase flex items-center gap-1.5">
                          🎥 2. Video Footage Asset:
                        </span>
                        <input
                          type="checkbox"
                          checked={includeVideo}
                          onChange={(e) => setIncludeVideo(e.target.checked)}
                          className="w-4 h-4 rounded-none border-2 border-black accent-red-600 cursor-pointer"
                        />
                      </div>
                      {includeVideo && (
                        <p className="text-[10px] font-bold text-zinc-500 pt-0.5">
                          Engine: Hunyuan Video (~3s dynamic video on Spark 2)
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full h-16 rounded-none border-[3px] border-black dark:border-white bg-red-600 hover:bg-red-700 text-white font-black text-lg uppercase tracking-tight shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      GENERATING ADVERSARIAL SAMPLE...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      SYNTHESIZE MOCK NEWS SAMPLE
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Results Display */}
            {result && (
              <div className="space-y-8 pt-6 border-t-[3px] border-black dark:border-white animate-in fade-in duration-300">
                {/* Result Header & Headline */}
                <div className="border-[3px] border-black dark:border-white bg-zinc-100 dark:bg-zinc-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">
                      SYNTHESIZED_HEADLINE //
                    </span>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight mt-0.5">
                      {result.headline}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyPostToClipboard}
                      className="rounded-none border-2 border-black dark:border-white font-bold text-xs uppercase h-9"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Text Post
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadJsonPayload}
                      className="rounded-none border-2 border-black dark:border-white font-bold text-xs uppercase h-9"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Export Mock News JSON
                    </Button>
                  </div>
                </div>

                {/* Post Body & Accompanying Media */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Post Content */}
                  <div className="md:col-span-7 border-[3px] border-black dark:border-white bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]">
                    <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase">MOCK POST DRAFT:</span>
                        <div className="flex gap-1">
                          {selectedPlatforms.map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPreviewPlatform(p)}
                              className={`px-2 py-0.5 text-[10px] font-black uppercase border border-black dark:border-white ${
                                previewPlatform === p
                                  ? "bg-black text-white dark:bg-white dark:text-black"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">
                        {(result.platforms?.[previewPlatform]?.text || result.postContent).length} CHARS
                      </span>
                    </div>
                    <Textarea
                      value={result.platforms?.[previewPlatform]?.text || result.postContent}
                      readOnly
                      rows={7}
                      className="w-full text-base font-bold bg-zinc-50 dark:bg-zinc-800 p-4 rounded-none border-2 border-black dark:border-white resize-none"
                    />
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyPostToClipboard}
                        className="rounded-none border-2 border-black dark:border-white font-black text-xs uppercase"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1.5" /> COPY POST TEXT
                      </Button>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">
                        LOCAL GENERATION ONLY (NO SOCIAL BROADCAST)
                      </span>
                    </div>
                  </div>

                  {/* Media Assets Preview (Photo & Video) */}
                  <div className="md:col-span-5 space-y-4">
                    {/* Generated Image Asset */}
                    <div className="border-[3px] border-black dark:border-white bg-white dark:bg-zinc-900 p-5 space-y-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]">
                      <span className="text-xs font-black uppercase flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-red-600" /> SPARK 2 IMAGE (FLUX)
                        </span>
                        {result.image && (
                          <span className="text-[10px] bg-black text-white px-2 py-0.5">
                            {result.image.sizeKb} KB
                          </span>
                        )}
                      </span>
                      {result.image?.url ? (
                        <div className="space-y-2">
                          <div className="border-2 border-black dark:border-white overflow-hidden bg-black flex items-center justify-center max-h-[220px]">
                            <img
                              src={result.image.url}
                              alt="Mock news generated media"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase truncate">
                              File: {result.image.filename}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadMediaFile(result.image!.url, result.image!.filename)}
                              className="rounded-none border border-black dark:border-white text-[10px] font-black uppercase h-7 px-2.5"
                            >
                              <Download className="w-3 h-3 mr-1" /> Download Image
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-zinc-400 p-4 text-center text-xs font-bold text-zinc-500 uppercase">
                          No image asset generated.
                        </div>
                      )}
                      <div className="pt-2 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
                        <span className="font-bold">Prompt: </span>
                        {result.suggestedImagePrompt}
                      </div>
                    </div>

                    {/* Generated Video Asset */}
                    <div className="border-[3px] border-black dark:border-white bg-white dark:bg-zinc-900 p-5 space-y-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]">
                      <span className="text-xs font-black uppercase flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-red-600" /> SPARK 2 VIDEO (HUNYUAN)
                        </span>
                        {result.video && (
                          <span className="text-[10px] bg-red-600 text-white px-2 py-0.5">
                            {result.video.sizeKb} KB
                          </span>
                        )}
                      </span>
                      {result.video?.url ? (
                        <div className="space-y-2">
                          <div className="border-2 border-black dark:border-white overflow-hidden bg-black flex items-center justify-center max-h-[220px]">
                            <video
                              src={result.video.url}
                              controls
                              autoPlay
                              loop
                              muted
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase truncate">
                              File: {result.video.filename}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadMediaFile(result.video!.url, result.video!.filename)}
                              className="rounded-none border border-black dark:border-white text-[10px] font-black uppercase h-7 px-2.5"
                            >
                              <Download className="w-3 h-3 mr-1" /> Download Video
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-zinc-400 p-4 text-center text-xs font-bold text-zinc-500 uppercase">
                          {includeVideo ? "Video generation skipped or in queue." : "Video generation disabled."}
                        </div>
                      )}
                      {result.suggestedVideoPrompt && (
                        <div className="pt-2 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
                          <span className="font-bold">Video Motion Prompt: </span>
                          {result.suggestedVideoPrompt}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SOCIAL MEDIA MOCK SCREEN PREVIEW (Twitter, Instagram, TikTok) */}
                <div className="border-[3px] border-black dark:border-white bg-zinc-950 text-white p-6 space-y-6 shadow-[8px_8px_0px_0px_rgba(220,38,38,1)]">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                    <div>
                      <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">
                        MULTI-PLATFORM SIMULATION //
                      </span>
                      <h3 className="text-base md:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                        <span>📱 LIVE SOCIAL MEDIA POST PREVIEWS</span>
                        <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-none font-bold">
                          AUTHENTIC UI
                        </span>
                      </h3>
                    </div>

                    {/* Platform switcher tabs */}
                    <div className="flex border border-zinc-700 bg-zinc-900 p-1 gap-1">
                      {selectedPlatforms.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPreviewPlatform(p)}
                          className={`px-3 py-1.5 text-xs font-black uppercase transition-all ${
                            previewPlatform === p
                              ? "bg-white text-black font-bold"
                              : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          {p === "twitter" ? "𝕏 Twitter / X" : p === "instagram" ? "📸 Instagram" : "🎵 TikTok"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mock Screen Content */}
                  <div className="flex justify-center p-2 sm:p-6 bg-zinc-900/60 border border-zinc-800">
                    {/* 1. TWITTER / X MOCK FEED CARD */}
                    {previewPlatform === "twitter" && (
                      <div className="w-full max-w-[580px] bg-black border border-zinc-800 p-4 font-sans space-y-3 shadow-xl">
                        {/* Twitter Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-xs">
                              ⚡
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-white hover:underline cursor-pointer">
                                  Global Intelligence Wire
                                </span>
                                <span className="text-blue-400 text-xs font-bold">✓</span>
                                <span className="text-zinc-500 text-xs">@GlobalIntelWire</span>
                                <span className="text-zinc-600 text-xs">· 4m</span>
                              </div>
                              <span className="text-[11px] text-zinc-400 font-mono">Disinformation Sim Node</span>
                            </div>
                          </div>
                          <MoreHorizontal className="w-4 h-4 text-zinc-500 cursor-pointer" />
                        </div>

                        {/* Tweet Text */}
                        <p className="text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed">
                          {result.platforms?.twitter?.text || result.postContent}
                        </p>

                        {/* Media Attachment */}
                        {(result.video?.url || result.image?.url) && (
                          <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 max-h-[340px]">
                            {result.video?.url ? (
                              <video
                                src={result.video.url}
                                controls
                                autoPlay
                                loop
                                muted
                                className="w-full h-full object-cover max-h-[340px]"
                              />
                            ) : (
                              <img
                                src={result.image!.url}
                                alt="Twitter attachment"
                                className="w-full h-full object-cover max-h-[340px]"
                              />
                            )}
                          </div>
                        )}

                        {/* Twitter Action Bar */}
                        <div className="flex items-center justify-between pt-2 px-2 text-zinc-500 text-xs border-t border-zinc-900">
                          <span className="flex items-center gap-1.5 hover:text-blue-400 cursor-pointer">
                            <MessageCircle className="w-4 h-4" /> 1.2K
                          </span>
                          <span className="flex items-center gap-1.5 hover:text-green-400 cursor-pointer">
                            <Repeat2 className="w-4 h-4" /> 8.4K
                          </span>
                          <span className="flex items-center gap-1.5 hover:text-red-400 cursor-pointer">
                            <Heart className="w-4 h-4" /> 24.1K
                          </span>
                          <span className="flex items-center gap-1.5 hover:text-blue-400 cursor-pointer">
                            <Bookmark className="w-4 h-4" /> 3.9K
                          </span>
                          <Share2 className="w-4 h-4 hover:text-white cursor-pointer" />
                        </div>
                      </div>
                    )}

                    {/* 2. INSTAGRAM FEED MOCK */}
                    {previewPlatform === "instagram" && (
                      <div className="w-full max-w-[460px] bg-black border border-zinc-800 font-sans shadow-xl">
                        {/* IG Header */}
                        <div className="flex items-center justify-between p-3.5 border-b border-zinc-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-[2px]">
                              <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-black">
                                IG
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-xs text-white">breaking.news.alert</span>
                                <span className="text-blue-400 text-[10px]">●</span>
                              </div>
                              <span className="text-[10px] text-zinc-400">Original audio</span>
                            </div>
                          </div>
                          <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                        </div>

                        {/* Media Box (Square or Video) */}
                        <div className="aspect-square bg-zinc-900 flex items-center justify-center overflow-hidden">
                          {result.video?.url ? (
                            <video
                              src={result.video.url}
                              controls
                              autoPlay
                              loop
                              muted
                              className="w-full h-full object-cover"
                            />
                          ) : result.image?.url ? (
                            <img
                              src={result.image.url}
                              alt="Instagram media"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-zinc-500 font-mono">NO VISUAL ASSET</span>
                          )}
                        </div>

                        {/* IG Actions */}
                        <div className="p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-white">
                            <div className="flex items-center gap-4">
                              <Heart className="w-5 h-5 text-red-500 fill-red-500 cursor-pointer" />
                              <MessageCircle className="w-5 h-5 cursor-pointer" />
                              <Share2 className="w-5 h-5 cursor-pointer" />
                            </div>
                            <Bookmark className="w-5 h-5 cursor-pointer" />
                          </div>
                          <div className="text-xs font-bold text-white">41,208 likes</div>
                          <div className="text-xs text-zinc-200 leading-relaxed">
                            <span className="font-bold text-white mr-1.5">breaking.news.alert</span>
                            <span className="whitespace-pre-wrap">
                              {result.platforms?.instagram?.text || result.postContent}
                            </span>
                          </div>
                          {result.platforms?.instagram?.engagementPrompt && (
                            <div className="text-[11px] text-blue-400 font-medium">
                              {result.platforms.instagram.engagementPrompt}
                            </div>
                          )}
                          <div className="text-[10px] text-zinc-500 uppercase pt-1">38 MINUTES AGO</div>
                        </div>
                      </div>
                    )}

                    {/* 3. TIKTOK VERTICAL PHONE MOCK */}
                    {previewPlatform === "tiktok" && (
                      <div className="w-[340px] h-[600px] bg-black border-[3px] border-zinc-700 rounded-[28px] overflow-hidden relative font-sans shadow-2xl flex flex-col justify-between">
                        {/* Background Media */}
                        <div className="absolute inset-0 z-0 bg-zinc-900">
                          {result.video?.url ? (
                            <video
                              src={result.video.url}
                              controls={false}
                              autoPlay
                              loop
                              muted
                              className="w-full h-full object-cover"
                            />
                          ) : result.image?.url ? (
                            <img
                              src={result.image.url}
                              alt="TikTok background"
                              className="w-full h-full object-cover opacity-90"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500 font-mono">
                              VERTICAL VIDEO PREVIEW
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
                        </div>

                        {/* Top Bar */}
                        <div className="relative z-10 flex items-center justify-center gap-6 pt-4 text-sm font-bold text-white/80">
                          <span className="text-white/60">Following</span>
                          <span className="text-white border-b-2 border-white pb-0.5">For You</span>
                        </div>

                        {/* Right Sidebar Interactions */}
                        <div className="absolute right-3 bottom-20 z-10 flex flex-col items-center gap-4 text-white">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-xs font-black">
                              +
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <Heart className="w-7 h-7 fill-white cursor-pointer" />
                            <span className="text-[10px] font-bold">142.5K</span>
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <MessageCircle className="w-7 h-7 fill-white cursor-pointer" />
                            <span className="text-[10px] font-bold">3,892</span>
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <Bookmark className="w-7 h-7 fill-white cursor-pointer" />
                            <span className="text-[10px] font-bold">18.1K</span>
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <Share2 className="w-7 h-7 fill-white cursor-pointer" />
                            <span className="text-[10px] font-bold">9,410</span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-white animate-spin flex items-center justify-center text-[10px]">
                            <Music2 className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Bottom Overlay Info */}
                        <div className="relative z-10 p-4 space-y-2 text-white max-w-[250px]">
                          <span className="font-bold text-sm block">@unfiltered.leaks</span>
                          <p className="text-xs line-clamp-3 text-zinc-100">
                            {result.platforms?.tiktok?.text || result.postContent}
                          </p>
                          {result.platforms?.tiktok?.engagementPrompt && (
                            <p className="text-[10px] text-yellow-400 font-bold">
                              {result.platforms.tiktok.engagementPrompt}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-300">
                            <Music2 className="w-3 h-3" />
                            <span className="truncate">Original Sound - Breaking News Audio</span>
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

        {/* Footer info */}
        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">
          <span>AI Fake News Detection Benchmark Demo // Ready for 23 September</span>
          <span>Engine: Spark 2 Qwen 3.8 27B + Flux.1</span>
        </div>
      </div>
    </article>
  );
}
