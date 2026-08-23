# Browser-local Canopy Lite experiment

The Web Lab now has an opt-in browser-local path for the small Canopy Lite GGUF.

1. Open Web Lab and choose Settings.
2. Select **Canopy Lite**.
3. Turn on **Canopy Lite in this browser**.
4. Choose the Canopy Lite `.gguf` file from the local computer.
5. Click Done and start a chat.

This path uses Wllama/WebAssembly and WebGPU when the browser supports it. The existing Canopy Lore local backend remains the default and is not changed by this experiment.

The browser cannot safely download a private Hugging Face model using a server token. A future one-click download would require a short-lived, authenticated model URL from the delivery service. A browser-loaded model is also extractable by the person using that browser, so this is a testing/convenience path rather than a model-protection mechanism.

If the model is too slow or the tab runs out of memory, use a smaller Canopy Lite file or return to the local backend. The current browser runner uses a 2,048-token context and selects WebGPU automatically when available.
