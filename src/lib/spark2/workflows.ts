/**
 * Workflow setup parameterizers.
 * Deeply clones and injects parameters into imported static JSON templates.
 */

// Import static JSON workflows using resolveJsonModule
import flux2Wf from './templates/flux2_wf.json';
import flux1Wf from './templates/image_generation_wf.json';
import hunyuanWf from './templates/hunyuan-t2v.json';
import florenceWf from './templates/image_to_text_florence.json';

import {
  GenerateImageOptions,
  GenerateVideoOptions,
  ImageToTextOptions,
  WorkflowRequest,
  InputMediaItem
} from './types';

// Helper to generate a random seed if none is provided
function resolveSeed(seed?: number): number {
  if (seed !== undefined && seed >= 0) return seed;
  return Math.floor(Math.random() * 100000000000000);
}

// Helper to deeply clone static JSON structures
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================================
// Text to Image Setup
// ============================================================================

export function setupTextToImage(prompt: string, options?: GenerateImageOptions): WorkflowRequest {
  const model = options?.model ?? 'flux'; // Default to Flux Schnell
  const seed = resolveSeed(options?.seed);
  const steps = options?.steps ?? (model === 'flux' ? 4 : 20);
  const width = options?.width ?? 1024;
  const height = options?.height ?? 1024;

  if (model === 'flux2') {
    // Flux.2 workflow setup
    const wf = deepClone(flux2Wf) as Record<string, any>;
    
    // Node 6: Positive text prompt
    if (wf['6']?.inputs) {
      wf['6'].inputs.text = prompt;
    }
    // Node 5: Empty latent dimensions
    if (wf['5']?.inputs) {
      wf['5'].inputs.width = width;
      wf['5'].inputs.height = height;
    }
    // Node 17: BasicScheduler steps
    if (wf['17']?.inputs) {
      wf['17'].inputs.steps = steps;
    }
    // Node 25: RandomNoise seed
    if (wf['25']?.inputs) {
      wf['25'].inputs.noise_seed = seed;
    }
    // Node 9: SaveImage output prefix
    const randomPrefix = `flux2_${Math.floor(Math.random() * 100000)}`;
    if (wf['9']?.inputs) {
      wf['9'].inputs.filename_prefix = randomPrefix;
    }

    return {
      workflow: wf,
      outputNodeId: '9',
      mediaType: 'image',
      timeout: options?.timeout,
      onProgress: options?.onProgress,
      signal: options?.signal
    };
  } else {
    // Flux.1 Schnell / Flux.1 Dev setup (defaults to Schnell)
    const wf = deepClone(flux1Wf) as Record<string, any>;

    // Node 2: Positive prompt
    if (wf['2']?.inputs) {
      wf['2'].inputs.text = prompt;
    }
    // Node 4: Empty latent dimensions
    if (wf['4']?.inputs) {
      wf['4'].inputs.width = width;
      wf['4'].inputs.height = height;
    }
    // Node 8: KSampler or KSamplerAdvanced steps & seed
    if (wf['8']?.inputs) {
      wf['8'].inputs.steps = steps;
      if ('end_at_step' in wf['8'].inputs) {
        wf['8'].inputs.end_at_step = steps;
      }
      if ('noise_seed' in wf['8'].inputs) {
        wf['8'].inputs.noise_seed = seed;
      } else {
        wf['8'].inputs.seed = seed;
      }
      
      // If Flux Dev, adjust CFG (default is 1 for Schnell)
      if (model === 'flux-dev') {
        wf['8'].inputs.cfg = 3.5; // Optimal CFG guidance for flux-dev
        wf['8'].inputs.denoise = 1.0;
      }
    }
    // Node 7: SaveImage output prefix
    const randomPrefix = `${model}_${Math.floor(Math.random() * 100000)}`;
    if (wf['7']?.inputs) {
      wf['7'].inputs.filename_prefix = randomPrefix;
    }

    return {
      workflow: wf,
      outputNodeId: '7',
      mediaType: 'image',
      timeout: options?.timeout,
      onProgress: options?.onProgress,
      signal: options?.signal
    };
  }
}

// ============================================================================
// Text to Video Setup
// ============================================================================

export function setupTextToVideo(prompt: string, options?: GenerateVideoOptions): WorkflowRequest {
  const seed = resolveSeed(options?.seed);
  const steps = options?.steps ?? 25;
  const width = options?.width ?? 848;
  const height = options?.height ?? 480;
  const length = options?.length ?? 73; // ~3 seconds at 24fps
  const guidance = options?.guidance ?? 3.5; // Optimal for Hunyuan to prevent over-saturation/artifacts

  const wf = deepClone(hunyuanWf) as Record<string, any>;

  // Node 44: CLIP Text positive prompt
  if (wf['44']?.inputs) {
    wf['44'].inputs.text = prompt;
  }
  // Node 45: Empty latent dimensions & length
  if (wf['45']?.inputs) {
    wf['45'].inputs.width = width;
    wf['45'].inputs.height = height;
    wf['45'].inputs.length = length;
  }
  // Node 17: BasicScheduler steps
  if (wf['17']?.inputs) {
    wf['17'].inputs.steps = steps;
  }
  // Node 26: FluxGuidance (CFG for Hunyuan)
  if (wf['26']?.inputs) {
    wf['26'].inputs.guidance = guidance;
  }
  // Node 73: VAEDecodeTiled (larger tile_size eliminates seam line artifacts)
  if (wf['73']?.inputs) {
    wf['73'].inputs.tile_size = 384;
    wf['73'].inputs.overlap = 96;
  }
  // Node 25: RandomNoise seed
  if (wf['25']?.inputs) {
    wf['25'].inputs.noise_seed = seed;
  }
  // Node 99: SaveVideo output prefix
  const randomPrefix = `hunyuan_${Math.floor(Math.random() * 100000)}`;
  if (wf['99']?.inputs) {
    wf['99'].inputs.filename_prefix = `video/${randomPrefix}`;
  }

  return {
    workflow: wf,
    outputNodeId: '99',
    mediaType: 'video',
    timeout: options?.timeout ?? 900000, // 15 minutes default
    onProgress: options?.onProgress,
    signal: options?.signal
  };
}

// ============================================================================
// Image to Text Setup
// ============================================================================

export function setupImageToText(imageBuffer: Buffer, options?: ImageToTextOptions): WorkflowRequest {
  const task = options?.task ?? 'detailed_caption';
  
  const wf = deepClone(florenceWf) as Record<string, any>;

  // Node 1: Florence2Run task
  if (wf['1']?.inputs) {
    wf['1'].inputs.task = task;
    wf['1'].inputs.seed = resolveSeed();
  }

  // Node 4: SaveText output filename
  const textFilename = `caption_${Math.floor(Math.random() * 100000)}.txt`;
  if (wf['4']?.inputs) {
    wf['4'].inputs.file = textFilename;
  }

  // Create input asset binding
  const inputMedia: InputMediaItem[] = [
    {
      nodeId: '3',
      inputField: 'image',
      name: 'input_image.png',
      data: imageBuffer
    }
  ];

  return {
    workflow: wf,
    inputMedia,
    outputNodeId: '4',
    mediaType: 'text',
    timeout: options?.timeout,
    onProgress: options?.onProgress,
    signal: options?.signal
  };
}
