# Canopy Code: A Terminal Coding Agent for Any Model, Now in VS Code | CanopyChat

Source: https://canopychat.app/blog/canopy-code-terminal-coding-agent

Release notes · November 9, 2026

# Canopy Code: a terminal coding agent for any model, now in VS Code

**Canopy Code is a coding agent that runs in your terminal.** You describe a job in plain language, and it reads your project, edits files and runs commands using the model you choose, whether that is ChatGPT, Claude, an API key or a model on your own machine. It is the developer tool from [CanopyChat](https://canopychat.app/). Release 2026.11.05 adds a VS Code extension.

Looking for promo codes for Canopy the humidifier and shower filter brand? This is a different Canopy: a coding tool for developers.

## What is Canopy Code?

You open a terminal in a project folder, type `canopy`, and tell it what you want: fix this failing test, add a setting, explain how this module works. It reads the code, makes the changes and runs commands, and shows you each step. You choose how much it may do on its own, from asking before every action to running freely.

It is written in Rust and runs on macOS (Apple silicon), Linux (x64 and arm64) and 64-bit Windows. Your settings, sessions and logins live in `~/.canopy` on your own computer.

## Which models does Canopy Code work with?

Canopy Code is not tied to one provider. From `/auth` you can sign in with ChatGPT, use your Claude subscription, add an API key for any OpenAI-compatible, Anthropic or Gemini endpoint, or point it at a local model through Ollama, LM Studio, vLLM or llama.cpp. Release 2026.11.05 also adds Antigravity CLI integration for Gemini models.

You can change your mind mid-session. `/model` switches models, even across providers, and Canopy Code compacts the conversation first so a long session still fits the new model. Using your own accounts and keys does not need a CanopyChat plan.

## What is new in release 2026.11.05?

### A VS Code extension

The first Canopy Code extension for VS Code ships with this release. It is a native sidebar that uses the same Canopy account and the same shared sessions as the terminal, so a session you start in one place shows up in the other. It supports:

- session history and streaming conversations, including tool activity
- model selection
- editor selection and file context
- approval cards for actions that need your OK
- proposed changes shown as side-by-side diffs

Install the Canopy Code CLI for your platform first, then install the extension from the [release page](https://github.com/nathanaelguitar/canopy-code/releases/tag/v2026.11.05) and reload VS Code:

``` blog-code
code --install-extension canopy-code-vscode-0.1.0.vsix
```

### Fixes and small additions

- Pasted macOS screenshots are copied into Canopy-owned session storage, so they no longer vanish before the model can read them.
- Images sent through DeepSeek V4.1 Flash on Sail Research are kept as images instead of being flattened to text.
- `/usage` shows your signed-in Canopy account's plan and monthly token usage. `/usage chatgpt` still shows ChatGPT usage.

## Can I control Canopy Code from my phone?

Yes. Sign this computer in to your Canopy account with `canopy sign-in`, then type `/rc` in a session. The session appears in the CanopyChat app on your iPhone, where you can follow it, send new instructions and approve actions. The connection is encrypted end to end, and a new phone has to be confirmed on the computer before it can connect. Remote control needs a Canopy account and a plan, see [plans](https://canopychat.app/plans).

## Other things it does

- **Checkpoints.** Every prompt gets a file checkpoint, and `/restore` puts your files back the way they were.
- **Advisor.** `/advisor` lets a second model of your choice give guidance to the main one.
- **Extensions.** Add MCP servers, skills and lifecycle hooks, plus your own slash commands.
- **Scripts.** `canopy exec` runs a job without the interface.

## How do I install Canopy Code?

On macOS (Apple silicon):

``` blog-code
brew install nathanaelguitar/canopy/canopy-code
```

On Linux (x64 or arm64, glibc 2.30 or newer, such as Ubuntu 20.04 or Debian 11):

``` blog-code
brew install nathanaelguitar/canopy/canopy-code
```

On Windows (PowerShell):

``` blog-code
scoop install https://github.com/nathanaelguitar/canopy-code/releases/latest/download/canopy-code.json
```

Then run `canopy` in a project folder and type `/auth` to connect a model. There is no build for Intel Macs yet. Every release also has archives with SHA-256 checksums on [GitHub Releases](https://github.com/nathanaelguitar/canopy-code/releases).

For the full overview, see the [Canopy Code page](https://canopychat.app/canopy-code).
