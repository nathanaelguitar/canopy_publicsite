# Can You Run AI on Your Own Computer? A Plain Guide to Local Models | CanopyChat

Source: https://canopychat.app/blog/run-ai-models-locally

AI explained · November 9, 2026

# Can You Run AI on Your Own Computer? A Plain Guide to Local Models

**Yes, you can run an AI model on your own computer.** A local model runs on your hardware instead of a company’s servers, so your prompts and files do not have to leave your machine, and it keeps working without an internet connection. The trade-off is that the biggest models need more memory than most laptops have.

## What do you need to run a local model?

Memory is the main limit. As a rough rule, a small model of about 7 to 8 billion parameters, compressed to 4-bit, fits in around 5 to 6 GB of memory. Larger models need proportionally more. Apple silicon Macs share one pool of memory between the processor and graphics, which is why they handle local models well. A dedicated graphics card with plenty of video memory does the same job on a PC.

## Which tools should you start with?

- **Ollama** downloads and runs models with one command and exposes a local server.
- **LM Studio** is a desktop app with a model browser and a built-in chat.
- **llama.cpp** is the open-source engine many other tools are built on, for people who want control.
- **vLLM** is aimed at serving models on a GPU machine, for example a home server.

## What are local models good at, and where do they fall short?

Small local models are good at everyday writing help, summaries, simple questions and private notes. They are weaker at long, multi-step reasoning and large codebases than the biggest cloud models. Many people use both: local for private and routine work, a larger cloud model for the hard jobs.

## How do Canopy products use local models?

[CanopyChat](https://canopychat.app/) on a computer starts with Canopy Lite, a model that runs right on your machine, with a quick hardware check that picks the right size. It needs no account to start. When a job is too big for your computer, [Plus](https://canopychat.app/plans) lets Canopy cloud models step in. And [Canopy Code](https://canopychat.app/canopy-code), the terminal coding agent, has built-in providers for Ollama and LM Studio and works with other OpenAI-compatible servers such as vLLM and llama.cpp.
