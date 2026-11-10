# Canopy Code | Terminal Coding Agent for Any Model

Source: https://canopychat.app/canopy-code

For developers

# Canopy Code, the coding agent for your terminal

Canopy Code is the terminal coding agent from CanopyChat. It reads your project, edits files and runs commands, using the model you choose, and you can check in on it from your iPhone.

[Install Canopy Code](#install) [See plans](https://canopychat.app/plans)

Looking for promo codes for Canopy the humidifier and shower filter brand? This is a different Canopy: a coding tool for developers.

## What Canopy Code is

Canopy Code is a coding agent that runs in your terminal. You type `canopy` in a project folder and describe the job in plain language. It reads your code, makes the changes, runs commands, and shows you what it is doing. You decide how much it may do on its own with approval modes, from asking first to running freely.

It is written in Rust and runs on macOS (Apple silicon), Linux and Windows. Canopy Code is the developer tool from [CanopyChat](https://canopychat.app/), which also makes the private chat app for iPhone, Android and computers. They are separate products that work together: Canopy Code does the coding, and the CanopyChat app on your iPhone can follow and steer it.

## Why Canopy Code

- **You choose the model.** Sign in with a ChatGPT or Claude subscription, add an API key, or point it at a model running on your own machine.
- **You can change your mind mid-session.** Switch models, even across providers, without starting over.
- **It stays on your computer.** It works in your project folder, and your settings, sessions and logins live in `~/.canopy` on your machine.
- **It follows you off the keyboard.** Start a job at your desk, then watch it, answer it and steer it from your phone.

Install

## Install Canopy Code

Install it with Homebrew on macOS and Linux, or Scoop on Windows, then run `canopy` in a project folder. Type `/auth` inside Canopy Code to connect a model.

    # macOS (Apple silicon)

    brew install nathanaelguitar/canopy/canopy-code

    canopy

    # Linux (x64 or arm64)

    brew install nathanaelguitar/canopy/canopy-code

    canopy

    # Windows (x64, PowerShell)

    scoop install https://github.com/nathanaelguitar/canopy-code/releases/latest/download/canopy-code.json

    canopy

- Paste it into Terminal on an Apple silicon Mac. Intel Macs have no build yet. Need Homebrew first? Get it at [brew.sh](https://brew.sh).
- Paste it into your shell on 64-bit Intel, AMD or ARM Linux with glibc 2.30 or newer (Ubuntu 20.04 and Debian 11 or later). Get Homebrew at [brew.sh](https://brew.sh).
- Paste it into PowerShell on 64-bit Windows 10 (version 1809) or newer, or Windows 11. Windows support is new, so please report anything odd. Need Scoop first? Get it at [scoop.sh](https://scoop.sh).
- Prefer a download? Each release has an archive per platform with a SHA-256 checksum on [GitHub Releases](https://github.com/nathanaelguitar/canopy-code/releases).
- Update later with `brew upgrade canopy-code`.
- Update later with `scoop update canopy-code`.

## Works with your own models

Canopy Code is not tied to one provider. Connect what you already have from `/auth`, or edit your settings file:

- **ChatGPT:** sign in with your ChatGPT plan.
- **Claude:** choose Sign in with Anthropic to use your Claude subscription. This runs through Claude Code, so install it and sign in there first.
- **API keys:** any OpenAI-compatible Chat Completions endpoint, plus Anthropic and Gemini endpoints.
- **Local models:** Ollama and LM Studio have built-in providers, and servers such as vLLM and llama.cpp work through their OpenAI-compatible endpoint.

Use `/model` to switch whenever you like. Canopy Code compacts the conversation first, so a long session still fits the new model. Using your own accounts and keys does not need a CanopyChat plan.

## Remote control from your iPhone

Sign this computer in to your Canopy account with `canopy sign-in`, then type `/rc` in a session. The session shows up in the [CanopyChat app on your iPhone](https://apps.apple.com/us/app/canopychat/id6788203137), where you can follow it, send new instructions, and run slash commands such as `/compact`, `/model`, `/status` and `/review`.

The phone reaches your computer through the Canopy relay, your local network, or Tailscale if you use it. The link between phone and computer is encrypted end to end, a new phone has to be confirmed on the computer before it can connect, and attention notifications carry only a session id, its title and the device name.

On macOS and Linux you can also run `canopy host install`. It keeps that computer ready as an always-on host, so you can start a new session from the app without opening a terminal. Sessions start in folders you allow, with a default folder at `~/canopy-flame`, which the app shows as [Flame’s folder](https://canopychat.app/flame).

## What else it does

### Checkpoints and /restore

Canopy Code keeps a file checkpoint for each prompt. `/restore` puts your files back the way they were before a prompt, and `/rewind` steps the conversation back.

### An advisor on call

Turn on `/advisor` and a second model of your choice offers guidance to the main one. Or run it once on a focus, like `/advisor the migration`.

### Several sessions, one machine

`/sessions` lists the other sessions running on your computer, and `/tell` leaves a note for one of them. `/btw` opens a side conversation without derailing the main one.

### Extend it your way

Add MCP servers with `/mcp`, skills with `/skills`, lifecycle hooks with `/hooks`, and your own custom slash commands. Run `/review` on your current changes any time.

### VS Code extension

A native sidebar for VS Code with session history, streaming conversations, model selection, approval cards and side-by-side diffs. It shares your account and sessions with the terminal. Install the CLI first, then the extension from the [latest release](https://github.com/nathanaelguitar/canopy-code/releases/latest).

### Talk to it

On a Mac, run `/voice setup` once, then hold Space to dictate. Speech recognition runs on your device.

### Scripts and a Web Shell

`canopy exec` runs a job without the interface, for scripts. Every install also includes a Web Shell, a browser view of a session.

## Plans

Canopy Code is free to install, and it works with your own model provider on any computer. Remote control from the CanopyChat app needs a Canopy account and a plan. [See what each plan includes](https://canopychat.app/plans), or [choose your plan](https://canopychat.app/upgrade).

## Canopy Code FAQ

### What is Canopy Code?

Canopy Code is the terminal coding agent from CanopyChat. You run it in a project folder, tell it what you want in plain language, and it reads your code, edits files and runs commands with the approval level you set.

### Is Canopy Code the same as the CanopyChat app?

No. CanopyChat is the private chat app for iPhone, Android and computers. Canopy Code is a separate command-line tool for developers. They connect through remote control, which lets the CanopyChat app on your iPhone follow and steer a Canopy Code session.

### Is Canopy Code free?

Canopy Code is free to install and use with your own model provider, such as a ChatGPT or Claude subscription, an API key, or a local model. Remote control from the CanopyChat app needs a Canopy account and a plan.

### Which models can I use with Canopy Code?

You can sign in with ChatGPT or a Claude subscription, use any OpenAI-compatible Chat Completions endpoint, Anthropic or Gemini endpoint with an API key, or run a local model through Ollama, LM Studio, vLLM or llama.cpp. You can switch models during a session with the /model command.

### Can I run a coding agent on a local model?

Yes. Canopy Code has built-in providers for Ollama and LM Studio and works with other OpenAI-compatible servers such as vLLM and llama.cpp, so the model can run on your own hardware.

### How do I control Canopy Code from my iPhone?

Sign in to your Canopy account on the computer with canopy sign-in, type /rc in a Canopy Code session, and open the CanopyChat app on your iPhone. On macOS and Linux, canopy host install also keeps the computer ready so you can start sessions from the app.

### Which systems does Canopy Code run on?

Canopy Code runs on macOS with Apple silicon, on Linux for x64 and arm64, and on 64-bit Windows 10 (version 1809 or newer) and Windows 11. There is no build for Intel Macs yet. Install it with Homebrew or Scoop, or download an archive from GitHub Releases.
