/**
 * Standalone direct ComfyUI WebSocket/HTTP Client.
 * Decoupled from core DI container and framework timeouts.
 */

import {
  Spark2ClientOptions,
  PromptResult,
  HistoryEntry,
  ComfyUIEventMap
} from './types';

type EventHandler<T = any> = (data: T) => void;

export class ComfyUIDirectClient {
  private ws: WebSocket | null = null;
  private readonly clientId: string;
  private readonly apiHost: string;
  private readonly ssl: boolean;
  private readonly pathPrefix: string;
  private readonly headers: Record<string, string>;

  private listeners = new Map<string, Set<EventHandler>>();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly baseReconnectDelayMs = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private _connected = false;

  constructor(options: Spark2ClientOptions) {
    this.clientId = this.generateClientId();
    this.apiHost = options.apiHost.replace(/^https?:\/\//, ''); // Strip http(s):// if present
    this.ssl = options.ssl ?? false;
    this.pathPrefix = options.pathPrefix ?? '';
    this.headers = options.headers ?? {};
  }

  // ==========================================================================
  // Connection lifecycle
  // ==========================================================================

  async connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const wsUrl = this.buildWsUrl();
      console.log(`[Spark2Client] Connecting to WebSocket: ${wsUrl}`);

      const WS = this.resolveWebSocket();
      const hasHeaders = Object.keys(this.headers).length > 0;

      // Note: Node.js 'ws' accepts headers as a third argument, browser standard WebSocket does not.
      const WsConstructor = WS as any;
      if (hasHeaders && typeof window === 'undefined') {
        this.ws = new WsConstructor(wsUrl, undefined, {
          headers: this.headers,
        }) as WebSocket;
      } else {
        this.ws = new WS(wsUrl);
      }

      const onOpen = () => {
        this._connected = true;
        this.reconnectAttempts = 0;
        cleanup();
        console.log('[Spark2Client] WebSocket Connected');
        resolve();
      };

      const onError = (err: Event) => {
        cleanup();
        const msg = (err as ErrorEvent)?.message || 'WebSocket connection failed';
        reject(new Error(`WebSocket connection failed: ${msg}`));
      };

      const cleanup = () => {
        this.ws?.removeEventListener('open', onOpen);
        this.ws?.removeEventListener('error', onError);
      };

      this.ws.addEventListener('open', onOpen);
      this.ws.addEventListener('error', onError);

      // Persistent event handlers
      this.ws.addEventListener('message', (ev: MessageEvent) => this.handleMessage(ev));
      this.ws.addEventListener('close', () => {
        this._connected = false;
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      });
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._connected = false;
  }

  get connected(): boolean {
    return this._connected && this.ws !== null && this.ws.readyState === 1;
  }

  // ==========================================================================
  // HTTP API
  // ==========================================================================

  async submitPrompt(workflow: Record<string, unknown>): Promise<PromptResult> {
    const url = this.buildHttpUrl('/prompt');
    const body = JSON.stringify({ prompt: workflow, client_id: this.clientId });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.headers },
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`submitPrompt failed (${response.status}): ${text}`);
    }

    return response.json();
  }

  async getHistory(promptId: string): Promise<HistoryEntry | null> {
    const url = this.buildHttpUrl(`/history/${promptId}`);
    const response = await fetch(url, { headers: this.headers });
    if (!response.ok) return null;
    const data = await response.json();
    return data[promptId] ?? null;
  }

  async interruptPrompt(): Promise<void> {
    const url = this.buildHttpUrl('/interrupt');
    try {
      console.log('[Spark2Client] Sending global interrupt');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.headers },
      });
      if (!response.ok) {
        console.warn(`[Spark2Client] Interrupt failed: ${response.status}`);
      }
    } catch (err) {
      console.warn(`[Spark2Client] Failed to interrupt prompt: ${err}`);
    }
  }

  async cancelPrompt(promptId: string): Promise<void> {
    const queueUrl = this.buildHttpUrl('/queue');
    try {
      const deleteRes = await fetch(queueUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.headers },
        body: JSON.stringify({ delete: [promptId] }),
      });
      if (deleteRes.ok) {
        console.log(`[Spark2Client] Deleted prompt ${promptId} from pending queue`);
        return;
      }
    } catch (err) {
      console.warn(`[Spark2Client] Queue delete failed for ${promptId}: ${err}`);
    }

    // Fall back to global interrupt if executing
    await this.interruptPrompt();
  }

  async getQueue(): Promise<{ queue_running: any[]; queue_pending: any[] }> {
    const url = this.buildHttpUrl('/queue');
    const response = await fetch(url, { headers: this.headers });
    if (!response.ok) throw new Error(`getQueue failed: ${response.status}`);
    return response.json();
  }

  async clearQueue(): Promise<void> {
    const url = this.buildHttpUrl('/queue');
    try {
      console.log('[Spark2Client] Wiping out all stuck queue elements...');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.headers },
        body: JSON.stringify({ clear: true })
      });
      if (response.ok) {
        console.log('[Spark2Client] Queue cleared successfully.');
      } else {
        console.warn(`[Spark2Client] Queue clear failed: ${response.status}`);
      }
    } catch (err) {
      console.warn(`[Spark2Client] Failed to clear queue: ${err}`);
    }
    await this.interruptPrompt();
  }

  async fetchFile(params: {
    filename: string;
    subfolder?: string;
    type?: string;
  }): Promise<Response> {
    const url = new URL(this.buildHttpUrl('/view'));
    url.searchParams.set('filename', params.filename);
    if (params.subfolder) url.searchParams.set('subfolder', params.subfolder);
    if (params.type) url.searchParams.set('type', params.type);

    return fetch(url.toString(), { headers: this.headers });
  }

  async uploadImage(imageBuffer: Buffer, filename: string): Promise<{ name: string; subfolder: string; type: string }> {
    const url = this.buildHttpUrl('/upload/image');
    const formData = new FormData();
    
    // Construct a blob from buffer to comply with browser/Node global FormData fetch requirements
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('image', blob, filename);
    formData.append('overwrite', 'true');

    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Upload image failed (${response.status}): ${text}`);
    }

    return response.json();
  }

  // ==========================================================================
  // Event emitter
  // ==========================================================================

  on<K extends keyof ComfyUIEventMap>(event: K, handler: EventHandler<ComfyUIEventMap[K]>): void;
  on(event: string, handler: EventHandler): void;
  on(event: string, handler: EventHandler): void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler);
  }

  off<K extends keyof ComfyUIEventMap>(event: K, handler: EventHandler<ComfyUIEventMap[K]>): void;
  off(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  once<K extends keyof ComfyUIEventMap>(event: K, handler: EventHandler<ComfyUIEventMap[K]>): void;
  once(event: string, handler: EventHandler): void;
  once(event: string, handler: EventHandler): void {
    const wrapper: EventHandler = (data: any) => {
      this.off(event, wrapper);
      handler(data);
    };
    this.on(event, wrapper);
  }

  // ==========================================================================
  // Internal Helpers
  // ==========================================================================

  private emit(event: string, data?: unknown): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      try {
        handler(data);
      } catch (err) {
        console.error(`[Spark2Client] Error in event handler for "${event}":`, err);
      }
    }
  }

  private handleMessage(event: MessageEvent): void {
    // Binary frames are image/audio preview data — ignore them entirely.
    if (typeof event.data !== 'string') return;

    try {
      const msg = JSON.parse(event.data) as { type?: string; data?: unknown };
      if (msg.type && msg.data !== undefined) {
        this.emit(msg.type, msg.data);
      }
    } catch {
      // Ignore non-JSON text messages
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[Spark2Client] Max WebSocket reconnection attempts (${this.maxReconnectAttempts}) reached.`);
      return;
    }

    const delay = Math.min(this.baseReconnectDelayMs * (2 ** this.reconnectAttempts), 15000);
    this.reconnectAttempts++;

    console.warn(`[Spark2Client] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    this.emit('reconnecting');

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        this.emit('reconnected');
      } catch (err) {
        console.error('[Spark2Client] Reconnection failed:', err);
        this.scheduleReconnect();
      }
    }, delay);
  }

  private buildWsUrl(): string {
    const protocol = this.ssl ? 'wss' : 'ws';
    return `${protocol}://${this.apiHost}${this.pathPrefix}/ws?clientId=${this.clientId}`;
  }

  private buildHttpUrl(path: string): string {
    const protocol = this.ssl ? 'https' : 'http';
    return `${protocol}://${this.apiHost}${this.pathPrefix}${path}`;
  }

  private resolveWebSocket(): typeof WebSocket {
    if (typeof WebSocket !== 'undefined') return WebSocket;
    
    // Server-side Node.js environment
    try {
      return require('ws') as unknown as typeof WebSocket;
    } catch (err) {
      throw new Error("WebSocket constructor not found. Please install the 'ws' package to run this client in a server environment.");
    }
  }

  private generateClientId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
