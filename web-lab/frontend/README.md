# CanopyChat Local Web Lab

A browser frontend prototype for **CanopyChat**, isolated under `web_lab/frontend/`, built to run either **Canopy Lore V1** or **Canopy Lite** locally. Apple Silicon uses MLX for Lore by default; Windows, Linux, and manual cross-platform testing use PrismML's GGUF runtime.

This implementation faithfully reproduces the visual identity, warm oak wood-grain aesthetics, typography hierarchy, and interaction quality of the native CanopyChat iOS application.

---

## Quick Start

From the repository root, start both the local model backend and frontend with:

```bash
./web_lab/start_local.sh
```

The launcher starts both local services and waits for the backend health check. The first chat offers a clear setup action; model weights are not downloaded until the user chooses it. Stop the services later with `./web_lab/stop_local.sh`.

### 1. Start the Frontend
From the `web_lab/frontend` directory:

```bash
# Using Python's built-in static server
python3 -m http.server 3000

# Or using npx serve
npx serve -l 3000 .
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Backend Contract & Configuration

### Expected Backend Endpoint
By default, the frontend connects to the local OpenAI-compatible Canopy backend at:

```text
http://127.0.0.1:8790
```

### Endpoints Used
- `GET /health`: Used by the status pill to check reachability and server latency.
- `GET /v1/models`: Checks available local model targets.
- `GET /v1/system/capabilities`: Reports memory, disk, acceleration, and the recommended model.
- `POST /v1/model/select`: Changes the local model and unloads the previous one.
- `GET /v1/model/status`: Polls status of Canopy Lore V1 (`ready`, `downloading`, `loading`, `not_downloaded`, `error`).
- `POST /v1/model/download`: Initiates first-time on-device model preparation.
- `POST /v1/chat/completions`: Streams chat completions over Server-Sent Events (SSE) with:
  ```json
  {
    "model": "canopy-lore-v1",
    "messages": [
      { "role": "system", "content": "..." },
      { "role": "user", "content": "..." }
    ],
    "temperature": 0.7,
    "top_p": 0.9,
    "max_tokens": 64,
    "stream": true
  }
  ```

### First-Run Model Setup
- The capable model is presented as **Canopy Lore V1**; the lower-memory fallback is **Canopy Lite**.
- When the model is not yet prepared, a calm **"Start chatting"** setup card appears in the chat canvas.
- On activation, the client triggers `POST /v1/model/download` and polls `GET /v1/model/status` while the chosen model is planted locally.
- If the model is already ready, setup is skipped and the composer is immediately active.

### Overriding the Backend URL
You can customize or override the backend URL in two ways:
1. **In the UI**: Click the **Status Pill** or the **Settings (Gear)** icon in the sidebar/footer to open the *Settings & Backend* modal, enter your custom URL (e.g. `http://localhost:8080`), and click **Done**. The setting is persisted in `localStorage`.
2. **Local Simulation Mode**: If the inference service is stopped or still downloading weights, toggle **Local Simulation Mode** in Settings to test UI states without a model.

---

## Model Constraints & Scope

- **Text-Only Models**: Canopy Lore V1 and Canopy Lite are text-only in this web lab. Image uploads, camera input, and attachment analyses are disabled and clearly marked unavailable.
- **Privacy & Local Isolation**: This is an isolated local testing prototype. No cloud authentication, subscription checks, founding member gates, or external telemetry pipelines are included.
- **Isolated from Mobile Codebases**: This prototype lives entirely inside `web_lab/frontend/` and does not modify `iphone/` or `android/`.

---

## Key Features & Visual Design

- **Procedural Oak Canvas (`js/oakCanvas.js`)**: Real-time rendering of warm oak planks, vertical seams with highlights, sinusoidal wood grain streaks, cathedral grain arcs, knots with growth rings, afternoon sun glow, and ambient vignettes.
- **Light & Dark Oak Themes**: Switch effortlessly between warm cream/oak light theme and deep forest/brown dark theme.
- **"Your Grove" Full-Width Landing**: Workspace category filtering (All, Personal, Work, Creative, Research), pinned conversations, relative timestamps, search preview, soft delete with undo toast, and a primary "Start New Conversation" card.
- **ChatGPT-Style Collapsible Sidebar in Chat View**: Clean left sidebar that appears when inside a conversation, with conversation history, pinned items, and workspace tabs.
- **Smooth Streaming & Smart Anchor**: Real-time markdown rendering with streaming cursor, stop generation button, and smart anchor scrolling that keeps the beginning of new assistant answers in view as text streams.
- **Rich Markdown Support**: Fenced code blocks with language badge and copy button, tables, blockquotes, lists, and headings.
- **Typing Indicator**: Floating card with breathing amber orb and progressive status lines ("Please keep this page open while the response loads.", "Canopy is composing…", etc.).
- **Keyboard-First Shortcuts**: `Enter` to send, `Shift+Enter` for newlines, `Esc` to stop generation or dismiss focus, `⌘K` for New Chat, `⌘B` for Sidebar toggle.
