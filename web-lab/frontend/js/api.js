/**
 * Backend API Client for the CanopyChat Local Canopy Lore V1 Web Lab
 * Handles health checking, model setup/status polling, streaming chat completions over SSE, and mock simulation.
 */

export const DEFAULT_BACKEND_URL = 'http://127.0.0.1:8790';
export const MODEL_TARGET = 'canopy-lore-v1';
export const MODEL_DISPLAY_NAME = 'Canopy Lore V1';
const DEFAULT_MAX_OUTPUT_TOKENS = 64;
const RETIRED_AUDIT_BACKEND_URLS = new Set([
  'http://192.168.12.128:8791'
]);
// The 27B local model can keep the backend busy while it is generating. Keep
// health/status probes patient enough that a slow inference is not displayed
// as a disconnected backend in the web lab.
const CONTROL_PLANE_TIMEOUT_MS = 15000;

function normalizeBackendUrl(value) {
  const normalized = String(value || DEFAULT_BACKEND_URL).trim().replace(/\/+$/, '');
  return RETIRED_AUDIT_BACKEND_URLS.has(normalized) ? DEFAULT_BACKEND_URL : normalized;
}

export class CanopyApiClient {
  constructor(baseUrl = DEFAULT_BACKEND_URL) {
    this.baseUrl = normalizeBackendUrl(baseUrl);
    this.isMockMode = false;
    this.selectedModelId = MODEL_TARGET;
    this.selectedModelName = MODEL_DISPLAY_NAME;
  }

  setBaseUrl(url) {
    this.baseUrl = normalizeBackendUrl(url);
  }

  setMockMode(enabled) {
    this.isMockMode = Boolean(enabled);
  }

  /**
   * Check backend server health
   */
  async checkHealth({ allowDefaultFallback = true } = {}) {
    if (this.isMockMode) {
      return { status: 'mock', ok: true, model: MODEL_DISPLAY_NAME, latencyMs: 4, baseUrl: this.baseUrl };
    }

    const primaryBaseUrl = this.baseUrl;
    const primary = await this._checkHealthAt(primaryBaseUrl);
    if (primary.ok || !allowDefaultFallback || primaryBaseUrl === DEFAULT_BACKEND_URL) {
      return { ...primary, baseUrl: primaryBaseUrl };
    }

    const fallback = await this._checkHealthAt(DEFAULT_BACKEND_URL);
    if (fallback.ok) {
      this.baseUrl = DEFAULT_BACKEND_URL;
      return {
        ...fallback,
        baseUrl: DEFAULT_BACKEND_URL,
        recoveredFrom: primaryBaseUrl
      };
    }

    return { ...primary, baseUrl: primaryBaseUrl };
  }

  async _checkHealthAt(baseUrl) {
    const startTime = performance.now();
    let timeoutId;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), CONTROL_PLANE_TIMEOUT_MS);

      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      const latencyMs = Math.round(performance.now() - startTime);

      if (response.ok) {
        let data = {};
        try { data = await response.json(); } catch {}
        return { status: 'online', ok: true, data, latencyMs };
      } else {
        return { status: 'error', ok: false, httpStatus: response.status, latencyMs };
      }
    } catch (err) {
      return {
        status: 'offline',
        ok: false,
        error: err.name === 'AbortError' ? 'Connection timed out' : `Backend unreachable (${baseUrl})`,
        latencyMs: Math.round(performance.now() - startTime)
      };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch model status (e.g. ready, downloading, loading, not_downloaded, error)
   */
  async getModelStatus() {
    if (this.isMockMode) {
      return { status: 'ready', model: MODEL_DISPLAY_NAME, ready: true };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONTROL_PLANE_TIMEOUT_MS);

      const response = await fetch(`${this.baseUrl}/v1/model/status`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.selectedModelId = data.selected_model || data.model || this.selectedModelId;
      this.selectedModelName = data.display_name || this.selectedModelName;
      return {
        status: data.status || (data.ready ? 'ready' : 'not_downloaded'),
        ready: Boolean(data.ready || data.status === 'ready'),
        error: data.error || null,
        detail: data.detail || null,
        model: data.model || MODEL_TARGET,
        displayName: data.display_name || this.selectedModelName,
        selectedModel: data.selected_model || this.selectedModelId,
        recommendedModel: data.recommended_model || null,
        downloadedBytes: Number(data.downloaded_bytes || 0),
        totalBytes: Number(data.total_bytes || 0),
        runtime: data.runtime || null
      };
    } catch (err) {
      return {
        status: 'offline',
        ready: false,
        error: err.message
      };
    }
  }

  /**
   * Trigger one-time model preparation / download
   */
  async downloadModel(modelId = this.selectedModelId) {
    if (this.isMockMode) {
      return { ok: true, status: 'ready' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/model/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ model: modelId })
      });

      if (!response.ok) {
        let errBody = '';
        try { errBody = await response.text(); } catch {}
        throw new Error(errBody || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { ok: true, status: data.status || 'downloading' };
    } catch (err) {
      throw new Error(`Failed to initialize setup: ${err.message}`);
    }
  }

  /**
   * Fetch available models
   */
  async getModels() {
    if (this.isMockMode) {
      return [{ id: MODEL_TARGET, name: MODEL_DISPLAY_NAME, object: 'model', owned_by: 'local' }];
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.data || [data];
    } catch (err) {
      return [{ id: MODEL_TARGET, name: MODEL_DISPLAY_NAME, object: 'model' }];
    }
  }

  async getCapabilities() {
    if (this.isMockMode) {
      return {
        hardware: { memory_gib: 16, operating_system: 'Simulation' },
        recommended_model: MODEL_TARGET,
        selected_model: this.selectedModelId,
        selection_reason: 'Simulation uses Canopy Lore V1.',
        models: await this.getModels()
      };
    }
    const response = await fetch(`${this.baseUrl}/v1/system/capabilities`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async selectModel(modelId) {
    if (this.isMockMode) {
      this.selectedModelId = modelId === 'auto' ? MODEL_TARGET : modelId;
      return { status: 'ready', selected_model: this.selectedModelId };
    }
    const response = await fetch(`${this.baseUrl}/v1/model/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ model: modelId })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
    this.selectedModelId = data.selected_model || modelId;
    this.selectedModelName = data.display_name || this.selectedModelName;
    return data;
  }

  /**
   * Stream chat completion from the selected local Canopy model
   * @param {Array<{role: string, content: string}>} messages
   * @param {Object} options
   * @param {Function} onToken (partialChunk, fullAccumulatedText)
   * @param {AbortSignal} signal
   */
  async streamChat(messages, options = {}, onToken, signal) {
    if (this.isMockMode) {
      return this._mockStreamChat(messages, options, onToken, signal);
    }

    // A custom endpoint may be temporary (for example, a LAN audit bridge).
    // Recover to the standard local server before beginning a long generation.
    if (this.baseUrl !== DEFAULT_BACKEND_URL) {
      await this.checkHealth();
    }

    const payload = {
      model: this.selectedModelId,
      messages: messages,
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? 0.9,
      max_tokens: options.max_tokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
      stream: true
    };

    let response;
    try {
      response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(payload),
        signal: signal
      });
    } catch (fetchErr) {
      if (fetchErr.name === 'AbortError') {
        throw new Error('Request cancelled');
      }
      throw new Error(`Cannot connect to the local Canopy backend at ${this.baseUrl}. Start the local service, or enable Local Simulation Mode in Settings.`);
    }

    if (!response.ok) {
      let errorBody = '';
      try { errorBody = await response.text(); } catch {}
      let detail = errorBody || response.statusText;
      try {
        const parsed = JSON.parse(errorBody);
        detail = parsed.error?.message || parsed.error?.detail || detail;
      } catch {}
      if (response.status === 503) {
        throw new Error(`Canopy Lore is not ready yet. Open Settings → Test Connection, then use Retry Setup. ${detail}`);
      }
      throw new Error(`Server returned HTTP ${response.status}: ${detail}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported by server response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulatedText = '';
    let buffer = '';
    let streamFinished = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep unfinished trailing line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') {
              streamFinished = true;
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error?.message) {
                throw new Error(parsed.error.message);
              }
              const deltaContent = parsed.choices?.[0]?.delta?.content || '';
              if (deltaContent) {
                accumulatedText += deltaContent;
                if (typeof onToken === 'function') {
                  onToken(deltaContent, accumulatedText);
                }
              }
            } catch (jsonErr) {
              console.warn('Failed to parse SSE chunk:', dataStr, jsonErr);
            }
          }
        }
        // OpenAI-compatible SSE servers may leave the HTTP connection alive
        // after their terminal event. Stop reading as soon as the protocol
        // says the completion is done instead of waiting for socket close.
        if (streamFinished) break;
      }
    } catch (streamErr) {
      if (streamErr.name === 'AbortError') {
        throw new Error('Request cancelled');
      }
      throw streamErr;
    } finally {
      reader.releaseLock();
    }

    if (!accumulatedText.trim()) {
      throw new Error('Empty response received from model.');
    }

    return accumulatedText;
  }

  /**
   * Realistic local stream generator for testing UI states when backend server is offline
   */
  async _mockStreamChat(messages, options, onToken, signal) {
    const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || 'Hello';
    
    const mockResponses = [
      `It is wonderful to connect with you. As a local **${MODEL_DISPLAY_NAME}** intelligence running directly on your Mac, I process everything privately on-device with zero data leaving your machine.\n\nHere are some of the ways I can help you today:\n- **Thoughtful Writing**: Polish essays, draft notes, and refine articles.\n- **Focus & Planning**: Organize weekly priorities, structured schedules, and project roadmaps.\n- **Creative Ideation**: Brainstorm concepts, craft stories, and explore fresh ideas.\n\nHow would you like to begin?`,
      
      `That is an insightful question regarding: *${lastUserMsg}*.\n\nHere are three helpful perspectives to consider:\n\n1. **Core Clarity**: Start by identifying the primary outcome you want to achieve.\n2. **Practical Steps**: Break the objective down into distinct, low-friction milestones.\n3. **Sustainable Rhythm**: Focus on consistent progress while protecting time for reflection.\n\nWould you like to explore any of these areas further?`,

      `Here is a thoughtful way to approach this:\n\n- **Step 1 (Vision)**: Define the core message and the audience you want to reach.\n- **Step 2 (Structure)**: Create a clean outline with clear headings and key takeaways.\n- **Step 3 (Refinement)**: Polish the tone to ensure it feels genuine, engaging, and concise.\n\n> *"Rooted intelligence brings private, thoughtful computing back into your hands."*\n\nLet me know if you would like me to draft a working version for you!`
    ];

    const chosenResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    const words = chosenResponse.split(/(\s+)/);
    let accumulatedText = '';

    await new Promise((resolve, reject) => {
      const initialTimer = setTimeout(resolve, 350);
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(initialTimer);
          reject(new Error('Request cancelled'));
        });
      }
    });

    for (const word of words) {
      if (signal?.aborted) {
        throw new Error('Request cancelled');
      }

      accumulatedText += word;
      if (typeof onToken === 'function') {
        onToken(word, accumulatedText);
      }

      const delay = Math.floor(Math.random() * 25) + 15;
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, delay);
        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new Error('Request cancelled'));
          });
        }
      });
    }

    return accumulatedText;
  }
}
