/**
 * Unified Standalone Spark 2 Client SDK.
 * Entry point for external media generation tasks.
 */

import { ComfyUIDirectClient } from './comfyui-client';
import { WorkflowExecutor } from './workflow-executor';
import { setupTextToImage, setupTextToVideo, setupImageToText } from './workflows';
import {
  Spark2ClientOptions,
  GenerateImageOptions,
  GenerateVideoOptions,
  ImageToTextOptions,
  GenerationResult
} from './types';

import fs from 'fs/promises';
import path from 'path';

export class Spark2Client {
  private client: ComfyUIDirectClient;
  private executor: WorkflowExecutor;

  constructor(options: Spark2ClientOptions) {
    this.client = new ComfyUIDirectClient(options);
    this.executor = new WorkflowExecutor(this.client);
  }

  /**
   * Check if the Spark2 server is reachable and active.
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!this.client.connected) {
        await this.client.connect();
      }
      return this.client.connected;
    } catch {
      return false;
    }
  }

  /**
   * Cleanly terminate the WebSocket client and disconnect.
   */
  close(): void {
    this.client.disconnect();
  }

  /**
   * Fetch the current running and pending tasks from ComfyUI's queue.
   */
  async getQueue(): Promise<{ queue_running: any[]; queue_pending: any[] }> {
    return this.client.getQueue();
  }

  /**
   * Cancel all current executing and pending tasks in the ComfyUI queue.
   */
  async clearQueue(): Promise<void> {
    await this.client.clearQueue();
  }

  /**
   * Generate an image from a text prompt.
   * Supports Flux.1 Schnell, Flux.1 Dev, and Flux.2.
   * Returns a GenerationResult containing the raw buffer, filename, and metadata.
   * If savePath is provided in options, auto-saves the file to local disk.
   */
  async generateImage(prompt: string, options?: GenerateImageOptions): Promise<GenerationResult> {
    const setup = setupTextToImage(prompt, options);
    
    // Execute workflow pipeline
    const result = await this.executor.executeWorkflow(setup);
    
    if (result.outputs.length === 0) {
      throw new Error('Image generation completed successfully but returned no image outputs.');
    }
    
    const output = result.outputs[0];
    const imageResult: GenerationResult = {
      type: 'image',
      buffer: output.buffer,
      filename: output.filename,
      contentType: 'image/png',
      metadata: {
        model: options?.model ?? 'flux',
        prompt,
        seed: setup.workflow['8']?.inputs?.noise_seed ?? setup.workflow['25']?.inputs?.noise_seed
      }
    };

    // Auto-save if savePath is specified
    if (options?.savePath) {
      await this.saveToFile(options.savePath, output.buffer);
    }

    return imageResult;
  }

  /**
   * Generate a video from a text prompt.
   * Supports Hunyuan Video.
   * Returns a GenerationResult containing the raw MP4 video buffer, filename, and metadata.
   * If savePath is provided in options, auto-saves the file to local disk.
   */
  async generateVideo(prompt: string, options?: GenerateVideoOptions): Promise<GenerationResult> {
    const setup = setupTextToVideo(prompt, options);
    
    // Execute workflow pipeline
    const result = await this.executor.executeWorkflow(setup);
    
    if (result.outputs.length === 0) {
      throw new Error('Video generation completed successfully but returned no video outputs.');
    }
    
    const output = result.outputs[0];
    const videoResult: GenerationResult = {
      type: 'video',
      buffer: output.buffer,
      filename: output.filename,
      contentType: 'video/mp4',
      metadata: {
        model: options?.model ?? 'hunyuan',
        prompt,
        seed: setup.workflow['25']?.inputs?.noise_seed
      }
    };

    // Auto-save if savePath is specified
    if (options?.savePath) {
      await this.saveToFile(options.savePath, output.buffer);
    }

    return videoResult;
  }

  /**
   * Describe or analyze an image using Florence-2.
   * Takes a raw image Buffer, runs image captioning, and returns the result object.
   * If savePath is provided, auto-saves the text response to a local file.
   */
  async imageToText(imageBuffer: Buffer, options?: ImageToTextOptions): Promise<GenerationResult & { text: string }> {
    const setup = setupImageToText(imageBuffer, options);
    
    // Execute workflow pipeline
    const result = await this.executor.executeWorkflow(setup);
    
    const textOutput = result.rawText || '';
    const textBuffer = Buffer.from(textOutput, 'utf-8');
    
    const textResult = {
      type: 'text' as const,
      buffer: textBuffer,
      filename: 'caption.txt',
      contentType: 'text/plain',
      text: textOutput,
      metadata: {
        model: 'florence2',
        task: options?.task ?? 'detailed_caption'
      }
    };

    // Auto-save if savePath is specified
    if (options?.savePath) {
      await this.saveToFile(options.savePath, textBuffer);
    }

    return textResult;
  }

  // Helper to save buffer content safely to a local file
  private async saveToFile(filePath: string, buffer: Buffer): Promise<void> {
    const resolvedPath = path.resolve(filePath);
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
    await fs.writeFile(resolvedPath, buffer);
    console.log(`[Spark2Client] Successfully saved output to: ${resolvedPath}`);
  }
}
