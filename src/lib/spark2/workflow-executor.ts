/**
 * Standalone high-level Workflow Executor.
 * Handles: Asset uploading -> Prompt submission -> WS progress tracking -> Output fetching.
 */

import { ComfyUIDirectClient } from './comfyui-client';
import {
  WorkflowRequest,
  WorkflowResult,
  GenerationProgress,
  ComfyUIEventMap
} from './types';

export class WorkflowExecutor {
  constructor(private client: ComfyUIDirectClient) {}

  async executeWorkflow(request: WorkflowRequest): Promise<WorkflowResult> {
    const { workflow, inputMedia, outputNodeId, mediaType, timeout = 300000, onProgress, signal } = request;

    // Check if client is connected first
    if (!this.client.connected) {
      onProgress?.({ stage: 'preparing', progress: 5, message: 'Establishing connection to ComfyUI...' });
      await this.client.connect();
    }

    if (signal?.aborted) {
      throw new Error('Execution aborted prior to start.');
    }

    // Phase 1: Upload Input Media
    if (inputMedia && inputMedia.length > 0) {
      onProgress?.({ stage: 'uploading', progress: 10, message: `Uploading ${inputMedia.length} assets...` });
      
      for (const item of inputMedia) {
        if (signal?.aborted) throw new Error('Execution aborted during asset upload.');
        
        console.log(`[WorkflowExecutor] Uploading input file: ${item.name} for node ${item.nodeId}`);
        const uploadResult = await this.client.uploadImage(item.data, item.name);
        
        // Update workflow with the uploaded filename in ComfyUI style
        if (workflow[item.nodeId]?.inputs) {
          const inputs = workflow[item.nodeId].inputs as Record<string, unknown>;
          inputs[item.inputField] = uploadResult.name;
        }
      }
    }

    // Phase 2: Submit prompt
    if (signal?.aborted) throw new Error('Execution aborted prior to prompt submission.');
    onProgress?.({ stage: 'queued', progress: 20, message: 'Submitting prompt to ComfyUI queue...' });

    const submission = await this.client.submitPrompt(workflow);
    const promptId = submission.prompt_id;
    console.log(`[WorkflowExecutor] Prompt queued successfully. ID: ${promptId}`);
    onProgress?.({ stage: 'queued', progress: 25, message: 'Waiting in server queue...', promptId });

    // Phase 3: Track WebSocket Execution Events
    return new Promise<WorkflowResult>((resolve, reject) => {
      let isSettled = false;
      let progressTimer: ReturnType<typeof setTimeout> | null = null;
      let currentProgress = 0;

      const cleanup = () => {
        isSettled = true;
        if (progressTimer) clearTimeout(progressTimer);
        this.client.off('progress', onWsProgress);
        this.client.off('executing', onWsExecuting);
        this.client.off('executed', onWsExecuted);
        this.client.off('execution_success', onWsSuccess);
        this.client.off('execution_error', onWsError);
        signal?.removeEventListener('abort', onAbort);
      };

      const fail = (error: Error) => {
        if (isSettled) return;
        cleanup();
        onProgress?.({ stage: 'error', progress: currentProgress, message: error.message, promptId });
        reject(error);
      };

      // Set timeout fallback
      const timeoutHandle = setTimeout(() => {
        fail(new Error(`Workflow execution timed out after ${timeout / 1000}s`));
      }, timeout);

      const onAbort = () => {
        this.client.cancelPrompt(promptId).catch(() => {});
        clearTimeout(timeoutHandle);
        fail(new Error('Execution aborted by user request.'));
      };

      if (signal) {
        signal.addEventListener('abort', onAbort);
      }

      // Event Handlers
      const onWsProgress = (data: ComfyUIEventMap['progress']) => {
        if (data.prompt_id !== promptId) return;
        const val = data.value;
        const max = data.max;
        const pct = Math.round((val / max) * 100);
        currentProgress = 30 + Math.round((pct / 100) * 60); // 30% to 90% mapping
        onProgress?.({
          stage: 'executing',
          progress: currentProgress,
          message: `Running workflow step: ${pct}%`,
          promptId
        });
      };

      const onWsExecuting = (data: ComfyUIEventMap['executing']) => {
        if (data.prompt_id !== promptId) return;
        if (data.node === null) {
          // Node is null means finished executing all nodes
          return;
        }
        onProgress?.({
          stage: 'executing',
          progress: currentProgress > 30 ? currentProgress : 30,
          message: `Executing node ${data.node}...`,
          promptId
        });
      };

      const onWsExecuted = (data: ComfyUIEventMap['executed']) => {
        if (data.prompt_id !== promptId) return;
        console.log(`[WorkflowExecutor] Node executed: ${data.node}`);
      };

      const onWsSuccess = async (data: ComfyUIEventMap['execution_success']) => {
        if (data.prompt_id !== promptId) return;
        clearTimeout(timeoutHandle);
        
        try {
          onProgress?.({ stage: 'downloading', progress: 90, message: 'Downloading outputs from ComfyUI...', promptId });
          console.log(`[WorkflowExecutor] Fetching history for prompt: ${promptId}`);
          
          const history = await this.client.getHistory(promptId);
          if (!history) {
            throw new Error(`Execution succeeded but history for ${promptId} could not be retrieved.`);
          }

          const outputs = history.outputs;
          const targetOutputs = outputs[outputNodeId];
          
          if (!targetOutputs) {
            console.warn(`[WorkflowExecutor] Output node ${outputNodeId} not found in ComfyUI history. Checking all output nodes...`);
          }

          const resolvedFiles: Array<{ buffer: Buffer; filename: string }> = [];
          let rawText: string | undefined;

          // Loop through all nodes with output, prioritizing target output node ID
          const nodesToScan = targetOutputs ? [outputNodeId] : Object.keys(outputs);
          
          for (const nodeKey of nodesToScan) {
            const nodeOutput = outputs[nodeKey];
            if (!nodeOutput) continue;

            // Handle standard ComfyUI images / videos / gifs output format
            if (nodeOutput.images && Array.isArray(nodeOutput.images)) {
              for (const img of nodeOutput.images) {
                const res = await this.client.fetchFile({
                  filename: img.filename,
                  subfolder: img.subfolder,
                  type: img.type
                });
                if (!res.ok) throw new Error(`Failed to download output image ${img.filename}`);
                resolvedFiles.push({
                  buffer: Buffer.from(await res.arrayBuffer()),
                  filename: img.filename
                });
              }
            }

            if (nodeOutput.gifs && Array.isArray(nodeOutput.gifs)) {
              for (const gif of nodeOutput.gifs) {
                const res = await this.client.fetchFile({
                  filename: gif.filename,
                  subfolder: gif.subfolder,
                  type: gif.type
                });
                if (!res.ok) throw new Error(`Failed to download output video/gif ${gif.filename}`);
                resolvedFiles.push({
                  buffer: Buffer.from(await res.arrayBuffer()),
                  filename: gif.filename
                });
              }
            }

            // Handle custom text node output formats e.g. Florence2 text output
            // Often custom nodes output JSON strings, string lists, or text parameters.
            if (nodeOutput.text && Array.isArray(nodeOutput.text)) {
              // Florence2 text outputs are arrays of strings in history outputs
              rawText = nodeOutput.text.join('\n');
            } else if (nodeOutput.string && Array.isArray(nodeOutput.string)) {
              rawText = nodeOutput.string.join('\n');
            }
          }

          // Special case for SaveText nodes, text might be stored as files
          if (resolvedFiles.length === 0 && mediaType === 'text') {
            // Check if there is an output file string we can read
            // Florence2 save text workflow saves file.txt
            const textResponse = await this.client.fetchFile({
              filename: 'file.txt',
              type: 'output'
            });
            if (textResponse.ok) {
              rawText = await textResponse.text();
            }
          }

          if (resolvedFiles.length === 0 && !rawText) {
            throw new Error('ComfyUI finished execution but yielded no compatible image, video, or text outputs.');
          }

          cleanup();
          onProgress?.({ stage: 'complete', progress: 100, message: 'Generation complete!', promptId });
          
          resolve({
            outputs: resolvedFiles,
            rawText
          });
        } catch (err: any) {
          fail(err);
        }
      };

      const onWsError = (data: ComfyUIEventMap['execution_error']) => {
        if (data.prompt_id !== promptId) return;
        clearTimeout(timeoutHandle);
        const errMsg = data.exception_message || 'ComfyUI execution error';
        fail(new Error(`ComfyUI Server Error: ${errMsg} (Node ${data.node_id})`));
      };

      // Subscribe to events
      this.client.on('progress', onWsProgress);
      this.client.on('executing', onWsExecuting);
      this.client.on('executed', onWsExecuted);
      this.client.on('execution_success', onWsSuccess);
      this.client.on('execution_error', onWsError);
    });
  }
}
