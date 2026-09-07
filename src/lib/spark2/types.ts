/**
 * Clean, decoupled type definitions for the Spark 2 ComfyUI client SDK.
 */

export interface Spark2ClientOptions {
  /** Hostname and port of the Spark2 ComfyUI server, e.g., 'localhost:8188' or 'pc-4172.kl.dfki.de:8188' */
  apiHost: string;
  /** Use HTTPS / WSS protocol */
  ssl?: boolean;
  /** Path prefix if proxying through a gateway */
  pathPrefix?: string;
  /** Additional HTTP headers to send with requests */
  headers?: Record<string, string>;
}

export interface PromptResult {
  prompt_id: string;
  number: number;
  node_errors?: Record<string, unknown>;
}

export interface HistoryEntry {
  prompt: [number, string, Record<string, unknown>, unknown, unknown];
  outputs: Record<string, Record<string, unknown>>;
  status: { status_str: string; completed: boolean };
}

export interface ComfyUIEventMap {
  executed: {
    node: string;
    output: Record<string, unknown>;
    prompt_id: string;
  };
  execution_error: {
    prompt_id: string;
    exception_message?: string;
    exception_type?: string;
    node_id?: string;
  };
  execution_success: { prompt_id: string };
  execution_start: { prompt_id: string };
  executing: { node: string | null; prompt_id: string };
  status: { status: { exec_info: { queue_remaining: number } } };
  progress: { value: number; max: number; prompt_id: string; node: string };
  reconnecting: undefined;
  reconnected: undefined;
}

export interface GenerationProgress {
  stage: 'preparing' | 'uploading' | 'queued' | 'executing' | 'downloading' | 'complete' | 'error';
  progress: number; // 0 to 100
  message?: string;
  promptId?: string;
}

export interface InputMediaItem {
  nodeId: string;
  inputField: string;
  name: string;
  data: Buffer;
}

export interface WorkflowRequest {
  workflow: Record<string, any>;
  inputMedia?: InputMediaItem[];
  outputNodeId: string;
  mediaType: 'image' | 'video' | 'text';
  timeout?: number;
  onProgress?: (progress: GenerationProgress) => void;
  signal?: AbortSignal;
}

export interface OutputFile {
  filename: string;
  subfolder?: string;
  type?: string;
}

export interface WorkflowResult {
  outputs: Array<{
    buffer: Buffer;
    filename: string;
  }>;
  rawText?: string;
}

export interface GenerationResult {
  type: 'image' | 'video' | 'text';
  buffer: Buffer;
  filename: string;
  contentType: string;
  text?: string; // Used for text results
  metadata?: {
    model?: string;
    prompt?: string;
    [key: string]: unknown;
  };
}

export interface GenerateImageOptions {
  model?: 'flux' | 'flux-dev' | 'flux2';
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  timeout?: number;
  onProgress?: (progress: GenerationProgress) => void;
  signal?: AbortSignal;
  savePath?: string; // If provided, auto-saves to this local path
}

export interface GenerateVideoOptions {
  model?: 'hunyuan';
  width?: number;
  height?: number;
  length?: number;
  steps?: number;
  seed?: number;
  timeout?: number;
  onProgress?: (progress: GenerationProgress) => void;
  signal?: AbortSignal;
  savePath?: string; // If provided, auto-saves to this local path
}

export interface ImageToTextOptions {
  task?: 'detailed_caption' | 'brief_caption' | 'more_detailed_caption';
  timeout?: number;
  onProgress?: (progress: GenerationProgress) => void;
  signal?: AbortSignal;
  savePath?: string; // If provided, auto-saves text to this local path
}
