/**
 * Experimental browser-local runner for Canopy Lite.
 *
 * The GGUF is deliberately supplied by the user rather than fetched with a
 * Hugging Face token. Browser inference necessarily exposes the model to the
 * browser; this is a convenience/testing path, not an IP-protection boundary.
 */

const WLLAMA_VERSION = '3.1.1';
// esm.sh currently returns 404 for this package's bare entry URL. Keep two
// browser-safe ESM origins so a transient CDN issue does not block setup.
const WLLAMA_MODULE_URLS = [
  `https://cdn.jsdelivr.net/npm/@wllama/wllama@${WLLAMA_VERSION}/esm/index.js`,
  `https://unpkg.com/@wllama/wllama@${WLLAMA_VERSION}/esm/index.js`
];
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
    // The public browser download is about 1.3 GB before runtime and browser
    // overhead. CPU/WASM needs more headroom than a GPU path.
    const likelyCompatible = canUseWebGPU || (memory === null ? true : memory >= 6);
    return { memory, cores, canUseWebGPU, likelyCompatible };
  }

  emit(status, detail = '') {
    this.onStatus({ ...this.getStatus(), status, detail });
  }

  async ensureRuntime() {
    if (this.runtime) return this.runtime;
    this.emit('loading-runtime', 'Loading the browser inference runtime…');
    let module;
    let lastError;
    for (const moduleUrl of WLLAMA_MODULE_URLS) {
      try {
        module = await import(moduleUrl);
        break;
      } catch (error) {
        lastError = error;
        console.warn('[Canopy Lite] runtime import failed', moduleUrl, error);
      }
    }
    if (!module) throw lastError || new Error('The browser inference runtime could not be loaded.');
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
      console.warn('[Canopy Lite] local model setup failed', error);
      this.emit('error', error.message);
      throw new Error('Canopy Lite could not finish preparing in this browser.');
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
      // The runtime downloads straight into its own storage-backed cache and
      // streams from there, avoiding extra full-size copies of the model in
      // page memory (chunks array + File + worker filesystem).
      const runtime = await this.ensureRuntime();
      const gpuReady = typeof runtime.isSupportWebGPU === 'function' ? runtime.isSupportWebGPU() : this.supportsWebGPU();
      console.warn('[Canopy Lite] stage=load-start', JSON.stringify({
        webgpuActive: gpuReady,
        cores: navigator.hardwareConcurrency ?? null,
        deviceMemory: Number.isFinite(navigator.deviceMemory) ? navigator.deviceMemory : null,
        crossOriginIsolated: Boolean(self.crossOriginIsolated)
      }));
      let sawTransferProgress = false;
      await runtime.loadModelFromUrl(model.url, {
        n_ctx: 2048,
        progressCallback: ({ loaded, total }) => {
          if (!sawTransferProgress) {
            sawTransferProgress = true;
            console.warn('[Canopy Lite] stage=transfer-start');
            this.emit('downloading-model', 'Downloading local intelligence…');
          }
          const percent = total ? Math.round((loaded / total) * 100) : null;
          this.emit('downloading-model', percent === null ? 'Downloading local intelligence…' : `Downloading local intelligence… ${percent}%`);
        }
      });
      console.warn('[Canopy Lite] stage=load-complete', JSON.stringify({ usedCachedCopy: !sawTransferProgress }));
      this.ready = true;
      this.emit('ready', 'Local intelligence is ready in this browser.');
    } catch (error) {
      this.modelFile = null;
      this.ready = false;
      console.warn('[Canopy Lite] stage=load-failed public model setup failed', error);
      this.emit('error', error.message);
      throw new Error('Canopy Lite could not finish preparing in this browser.');
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
