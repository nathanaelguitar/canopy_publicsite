# What Is an AI Coding Agent, and How Is It Different From Autocomplete? | CanopyChat

Source: https://canopychat.app/blog/what-is-an-ai-coding-agent

AI explained · November 9, 2026

# What Is an AI Coding Agent, and How Is It Different From Autocomplete?

**An AI coding agent is a program that takes a task in plain language and does the work: it reads your project, edits files, runs commands and tests, and keeps going until the job is done or it needs your input.** That is different from autocomplete, which finishes the line you are typing, and from chat, which answers questions but leaves the typing to you.

## Autocomplete, chat and agents: what is the difference?

- **Autocomplete** suggests the next few lines while you type. You stay in control of every keystroke.
- **Chat** answers a question or drafts a snippet. You copy the result into your project yourself.
- **An agent** acts. It opens files, makes changes across several of them, runs your tests, reads the errors and tries again.

## What does an agent actually do in a session?

Say you ask for a failing test to be fixed. An agent typically runs the test to see the failure, searches the code for the cause, edits the file, runs the test again, and reports what it changed. Each of those steps is a tool call the agent makes on your behalf, and good agents show you each one.

## What should you check before trusting one?

- **Approvals.** Can you choose between asking before every action and letting it run freely? You want that dial.
- **Undo.** Can you put your files back the way they were before a prompt? Checkpoints make experiments safe.
- **Where it runs.** Does it work in your folder on your computer, or does your code go somewhere else first?
- **Which model.** Are you locked to one provider, or can you bring your own subscription, API key or a local model?
- **Review.** Can you see proposed changes as a diff before they land?

## Where does Canopy Code fit?

[Canopy Code](https://canopychat.app/canopy-code) is a terminal coding agent from CanopyChat. It covers the checklist above: approval modes, `/restore` checkpoints, work in your own project folder, and your choice of ChatGPT, Claude, API keys or local models. You can also follow a session from your iPhone. See [what is new in the latest release](https://canopychat.app/blog/canopy-code-terminal-coding-agent).
