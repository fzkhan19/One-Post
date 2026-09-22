# One-Post Knowledge Base & Architectural Reference

This document serves as the persistent repository reference for One-Post, capturing core architecture, deployment topologies, feature specifications, architectural decisions, and credentials/endpoints.

---

## 1. System Architecture & Infrastructure

### Production VPS
- **Provider**: Oracle Cloud Infrastructure (OCI)
- **Public IP**: `92.5.50.60`
- **DNS Hostnames**: `mocknews.92.5.50.60.nip.io`, `92.5.50.60.nip.io`
- **SSH User**: `ubuntu`
- **SSH Port**: `22`
- **Identity Key (Local)**: `C:\Users\Khan\.ssh\id_rsa` / `personal` / `id_ed25519`
- **Reverse Proxy**: Nginx listening on port `80`, proxying to Next.js on `127.0.0.1:3000`
- **Process Manager**: PM2 running `one-post` (`bun run start` or `next start`)
- **Static Media Alias**: `/generated/` mapped directly to `/home/ubuntu/One-Post/public/generated/`
- **CI/CD Deployment**: GitHub Actions self-hosted runner installed as a systemd service (`/home/ubuntu/actions-runner`) under label `self-hosted`

### Spark 2 GPU Cluster
- **ComfyUI Server**: `http://pc-4172.kl.dfki.de:8188` (WebSocket: `ws://pc-4172.kl.dfki.de:8188/ws`)
- **Ollama LLM Server**: `http://pc-4172.kl.dfki.de:11434`
  - Active Models: `qwen3.8:27b`, `mistral-small:24b`
- **Network Topology / VPS Tunnel**:
  - The DFKI GPU cluster (`pc-4172.kl.dfki.de`) is on the internal DFKI university network and cannot be reached directly from the Oracle Cloud public VPS.
  - An SSH reverse tunnel is forwarded to the VPS:
    `ssh -f -N -T -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -i "C:\Users\Khan\Downloads\ssh-key-2026-09-03.key" -R 8188:pc-4172.kl.dfki.de:8188 -R 11434:pc-4172.kl.dfki.de:11434 ubuntu@92.5.50.60`
  - On the VPS, `.env.local` routes to `SPARK2_URL=http://localhost:8188` and `OLLAMA_HOST=http://localhost:11434`.
- **Hardware Architecture**: NVIDIA GB10 Blackwell GPU / unified memory architecture (128 GB VRAM)
- **Thermal & Memory Safety Limit**: **Max 40 GB VRAM consumption**. All active production workflows (Flux, Wan 2.2, Stable Audio) operate within **1.6 GB to 3.2 GB peak PyTorch VRAM** (< 8% of the hardware limit).

---

## 2. Credentials & Service Integrations

> All sensitive variables are sourced from `.env.local`:

| Service | Environment Key | Configuration / Identifier | Notes |
| :--- | :--- | :--- | :--- |
| **Gemini AI** | `GOOGLE_API_KEY` | `process.env.GOOGLE_API_KEY` (configured in `.env.local`) | Model: `gemini-3.6-flash` |
| **Ollama Cluster** | `OLLAMA_HOST` | `http://pc-4172.kl.dfki.de:11434` | Fallback model: `qwen3.8:27b` |
| **Spark 2 ComfyUI**| `SPARK2_URL` | `http://pc-4172.kl.dfki.de:8188` | `SPARK2_SSL=false` |
| **LinkedIn OAuth** | `NEXT_PUBLIC_LINKEDIN_CLIENT_ID` | `773qt5lobw3fgd` | Redirect: `https://localhost:3000/code` |
| **LinkedIn Secret**| `LINKEDIN_CLIENT_SECRET` | Referenced in `.env.local` | Account: `faizpathan1717@gmail.com` |
| **Twitter (X) API**| `TWITTER_API_KEY` | Referenced in `.env.local` | OAuth 1.0a / 2.0 user context |
| **Twitter Secret** | `TWITTER_API_SECRET` | Referenced in `.env.local` | |
| **Twitter Token**  | `TWITTER_ACCESS_TOKEN` | `1767867780282580992-...` (in `.env.local`) | |
| **Twitter Secret** | `TWITTER_ACCESS_SECRET` | Referenced in `.env.local` | |
| **Bluesky API**    | `BLUESKY_HANDLE` | `faiz-khan.com` | Atproto API |
| **Bluesky Password**| `BLUESKY_APP_PASSWORD`| Referenced in `.env.local` | App-specific token |

---

## 3. Disinformation Feature Architecture & Decisions

### Multi-Platform Copy Synthesis
- **Engine**: Google Gemini `gemini-3.6-flash` with local fallback to Spark 2 Ollama `qwen3.8:27b`.
- **Vectors**: Fabricated Breaking News, Conspiracy Leak, Ragebait Emotional, Misleading Statistics, Satire Parody.
- **Platform Customization**: Generates simultaneously tailored copies for **𝕏 Twitter** (under 280 chars), **Instagram** (structured body + hook + CTA), and **TikTok** (high-curiosity hook + viral tags).

### Synthetic Image Generation
- **Models Supported**:
  - `flux` (Flux Schnell): 4 steps, ultra-fast generation (~6-8s).
  - `flux2` (Flux.2 Dev): 20 steps, maximum adherence and photorealism.
- **Resolutions**:
  - Twitter: 16:9 Landscape (`1024x576`)
  - Instagram: 1:1 Square (`1024x1024`)
  - TikTok: 9:16 Vertical Portrait (`576x1024`)

### Synthetic Video & Audio Pipeline (Agreed Technical Decision)
- **Primary Video Engine**: **Wan 2.2 TI2V 5B** (`wan2.2_ti2v_5B_fp16.safetensors`).
- **Decision on LTX-Video**: **Purged completely**. LTX-Video suffered from severe latent drift, facial distortions, and blur over long sequences (>49 frames).
- **Sampling Parameters for Artifact-Free Realism**:
  - Sampler: **`uni_pc`** (Unified Predictor-Corrector) with simple scheduling.
  - Steps: `16`
  - Guidance (CFG): `6.0`
  - Negative Anatomical Conditioning: `distorted face, deformed eyes, extra limbs, bad anatomy, blur, low quality, distortion, cartoon, 3d render, watermark, deformed iris, mutated hands, artifacts`
- **Durations & Frame Rates**:
  - Presets: `[5s]` (81 frames at 16fps), `[10s]` (161 frames), `[12s]` (193 frames), `[15s]` (241 frames).
  - Enforced minimum: `Math.max(5, videoDuration)`.
- **Dialogue-Aligned Cinematic Audio**:
  - Engine: **Stable Audio Open 1.0** (`stable_audio_open_1.0.safetensors` + `t5_base.safetensors`).
  - Loudness Normalizer: `NormalizeAudioLoudness` (`lufs: -22.0`) to balance audible presence with comfortable listening volume without harsh blaring.
  - Multiplexer: `VHS_VideoCombine` encoding H.264 MP4 with synchronized stereo audio track.
  - Negative Audio Conditioning: `harsh digital clipping, mumble, muffled, silent, glitch, ear rape, low quality noise, distortion`.
  - Positive Audio Prompt: Layered broadcast television news intro theme with tense orchestral motif and electronic percussion, combined with an authoritative newsroom anchor dialogue announcement directly quoting the breaking development for the scenario in pristine broadcast acoustics.

### Runs History & Social Mocks Gallery
- **Storage**: Sequential JSON records in `public/generated/disinfo_runs_history.json`.
- **Batch Structure**: Sequential IDs (`run-1`, `run-2`, `run-5`), capturing:
  - Scenario topic and manipulation vector.
  - Platform copy for Twitter, Instagram, and TikTok.
  - Generated Image URL, filename, size, prompt, and model.
  - Generated Video URL, filename, size, prompt, duration, and model.
- **UI Display**: Authentic interactive mock cards reproducing:
  - 𝕏 Twitter dark/light feed card with verified badges and metric counters.
  - Instagram reel / post card with carousel metadata and action buttons.
  - TikTok vertical video card with music marquee, share sidebar, and engagement hooks.
  - Integrated custom HTML5 video controls with instant play/pause and mute/unmute overlay toggles.

---

## 4. Deployment Workflow & VPS Maintenance

### CI/CD Pipeline (`.github/workflows/deploy.yml`)
- Triggered on: `git push origin main`
- Runner: `self-hosted` (runs locally inside `/home/ubuntu/One-Post`)
- Steps:
  1. `git fetch origin main && git reset --hard origin/main`
  2. `bun install --frozen-lockfile --ignore-scripts`
  3. `bun run build`
  4. `pm2 reload one-post || pm2 restart one-post`

### VPS Cleanup Protocol (Minecraft & Resource Maintenance)
To clean up residual processes or Minecraft servers causing system hangs:
```bash
# 1. Stop all Minecraft/Java processes
sudo pkill -9 -f "minecraft|paper|spigot|forge|java"

# 2. Disable & remove systemd units if registered
sudo systemctl stop minecraft || true
sudo systemctl disable minecraft || true

# 3. Clean up directory space
rm -rf ~/minecraft ~/server ~/paper* ~/*.jar

# 4. Ensure PM2 and GitHub Actions runner are active
pm2 resurrect || pm2 start "bun run start" --name "one-post"
sudo systemctl restart actions.runner.*
```
