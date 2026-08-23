/**
 * Experimental browser-local runner for Canopy Lite.
 *
 * The GGUF is deliberately supplied by the user rather than fetched with a
 * Hugging Face token. Browser inference necessarily exposes the model to the
 * browser; this is a convenience/testing path, not an IP-protection boundary.
 */

const WLLAMA_VERSION = '3.1.1';
const WLLAMA_MODULE_URL = `https://esm.sh/@wllama/wllama@${WLLAMA_VERSION}`;
const WLLAMA_WASM_URL = `https://cdn.jsdelivr.net/npm/@wllama/wllama@${WLLAMA_VERSION}/esm/wasm/wllama.wasm`;
// Temporary public test model. This is intentionally not the private Canopy Lite artifact.
export const PUBLIC_CANOPY_LITE_MODEL = {
  name: 'Qwen3.5-2B-Q4_K_M.gguf',
  quantization: 'Q4_K_M (4-bit)',
  url: 'https://huggingface.co/unsloth/Qwen3.5-2B-GGUF/resolve/main/Qwen3.5-2B-Q4_K_M.gguf?download=true'
};

export class BrowserLocalCanopyLite {
  constructor({ onStatus } = {}) {
    this.onStatus = onStatus || (() => {});
    this.runtime = null;
    this.modelFile = null;
    this.loading = false;
    this.ready = false;
  }

  setStatusListener(listener) {
    this.onStatus = typeof listener === 'function' ? listener : () => {};
  }

  supportsWebGPU() {
    return typeof navigator !== 'undefined' && Boolean(navigator.gpu);
  }

  getStatus() {
    return {
      ready: this.ready,
      loading: this.loading,
      fileName: this.modelFile?.name || null,
      webgpu: this.supportsWebGPU()
    };
  }

  getHardwareAssessment() {
    const memory = Number.isFinite(navigator.deviceMemory) ? navigator.deviceMemory : null;
    const cores = navigator.hardwareConcurrency || null;
    const canUseWebGPU = this.supportsWebGPU();
    const likelyCompatible = canUseWebGPU || (memory === null ? true : memory >= 4);
    return { memory, cores, canUseWebGPU, likelyCompatible };
  }

  emit(status, detail = '') {
    this.onStatus({ ...this.getStatus(), status, detail });
  }

  async ensureRuntime() {
    if (this.runtime) return this.runtime;
    this.emit('loading-runtime', 'Loading the browser inference runtime…');
    const module = await import(WLLAMA_MODULE_URL);
    const Wllama = module.Wllama || module.default?.Wllama;
    if (!Wllama) throw new Error('The browser inference runtime could not be loaded.');
    this.runtime = new Wllama({ default: WLLAMA_WASM_URL }, {
      logger: { debug: () => {}, log: () => {}, warn: (...args) => console.warn('[Canopy Lite]', ...args) }
    });
    return this.runtime;
  }

  async loadFile(file) {
    if (!file || !/\.gguf$/i.test(file.name)) {
      throw new Error('Choose a Canopy Lite .gguf model file.');
    }
    this.loading = true;
    this.ready = false;
    this.modelFile = file;
    this.emit('loading-model', 'Preparing local intelligence…');
    try {
      const runtime = await this.ensureRuntime();
      await runtime.loadModel([file], {
        n_ctx: 2048,
        n_gpu_layers: this.supportsWebGPU() ? 999 : 0,
        progressCallback: ({ loaded, total }) => {
          const percent = total ? Math.round((loaded / total) * 100) : 0;
          this.emit('loading-model', `Preparing local intelligence… ${percent}%`);
        }
      });
      this.ready = true;
      this.emit('ready', 'Local intelligence is ready in this browser.');
    } catch (error) {
      this.modelFile = null;
      this.ready = false;
      this.emit('error', error.message);
      throw new Error(`Canopy Lite could not load in this browser: ${error.message}`);
    } finally {
      this.loading = false;
    }
  }

  async loadPublicModel(model = PUBLIC_CANOPY_LITE_MODEL) {
    this.loading = true;
    this.ready = false;
    this.modelFile = { name: model.name };
    this.emit('downloading-model', 'Downloading local intelligence…');
    try {
      const response = await fetch(model.url, { mode: 'cors', cache: 'force-cache' });
      if (!response.ok || !response.body) {
        throw new Error(`The public model download failed (HTTP ${response.status}).`);
      }
      const total = Number(response.headers.get('content-length')) || 0;
      const reader = response.body.getReader();
      const chunks = [];
      let loaded = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.byteLength;
        const percent = total ? Math.round((loaded / total) * 100) : null;
        this.emit('downloading-model', percent === null ? 'Downloading local intelligence…' : `Downloading local intelligence… ${percent}%`);
      }
      const file = new File(chunks, model.name, { type: 'application/octet-stream' });
      await this.loadFile(file);
      this.emit('ready', 'Local intelligence is ready in this browser.');
    } catch (error) {
      this.modelFile = null;
      this.ready = false;
      this.emit('error', error.message);
      throw error;
    } finally {
      this.loading = false;
    }
  }

  async streamChat(messages, options = {}, onToken, signal) {
    if (!this.ready || !this.runtime) {
      throw new Error('Choose a Canopy Lite model file in Settings before starting a browser-local chat.');
    }
    const stream = await this.runtime.createChatCompletion({
      messages,
      stream: true,
      max_tokens: options.max_tokens ?? 256,
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? 0.9
    });
    let accumulated = '';
    for await (const chunk of stream) {
      if (signal?.aborted) throw new Error('Request cancelled');
      const delta = typeof chunk === 'string'
        ? chunk
        : chunk?.choices?.[0]?.delta?.content || chunk?.choices?.[0]?.text || '';
      if (delta) {
        accumulated += delta;
        onToken?.(delta, accumulated);
      }
    }
    if (!accumulated.trim()) throw new Error('Canopy Lite returned an empty response.');
    return accumulated;
  }

  async unload() {
    if (this.runtime?.exit) await this.runtime.exit();
    this.runtime = null;
    this.modelFile = null;
    this.ready = false;
    this.emit('idle', 'Browser model unloaded.');
  }
}
