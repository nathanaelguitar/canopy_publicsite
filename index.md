# CanopyChat | Eco-Friendly Intelligence

Source: https://canopychat.app/

# Private intelligence that lives closer to you.

CanopyChat answers right on your phone or computer and keeps your chats, photos, files, and location in your hands.

## Download

[Windows](https://downloads.canopychat.app/windows/CanopyChat-Setup.exe "Windows 10 and 11 · about 165 MB") [Mac](https://testflight.apple.com/join/f5xCZmVv "Free Mac beta on TestFlight") [iPhone](https://apps.apple.com/us/app/canopychat/id6788203137 "iPhone and iPad · App Store") [Android](https://play.google.com/store/apps/details?id=com.nathanaelguitar.canopychat "Android · Google Play") Linux [\>\_ Canopy Code](#install "Install Canopy Code (for developers)")

Installing on Windows or Linux

**Windows:** open `CanopyChat-Setup.exe`. The installer is new and not yet code-signed, so Windows may say “Windows protected your PC.” Choose **More info**, then **Run anyway**.

**Linux** (x86-64: Ubuntu 22.04 or newer; ARM64: Ubuntu 24.04 or newer): pick the file for your computer. Not sure which? Run `uname -m`: `x86_64` means x86-64, `aarch64` means ARM64.

- [Linux x86-64 (.deb)](https://downloads.canopychat.app/linux/CanopyChat-amd64.deb)
- [Linux ARM64 (.deb, e.g. DGX Spark, Raspberry Pi 5, Ampere)](https://downloads.canopychat.app/linux/CanopyChat-arm64.deb)

Or install in one line from any folder. It downloads the right file for your computer and installs it:

```
curl -fLO https://downloads.canopychat.app/linux/CanopyChat-$(dpkg --print-architecture).deb && sudo apt install ./CanopyChat-$(dpkg --print-architecture).deb
```

Downloaded it in your browser? It is in your Downloads folder: `cd ~/Downloads && sudo apt install ./CanopyChat-$(dpkg --print-architecture).deb`. More in the [Linux guide](https://canopychat.app/linux).

**Updates:** from version 0.3.6, CanopyChat checks for new versions by itself. In Settings, choose **Check for updates**, then **Update now**. On Windows the installer opens for you; on Linux the new package is saved to your Downloads folder.

Open CanopyChat and sign in with your email: we send a 6-digit code, no password. Your plan unlocks cloud models; the free plan runs on your computer.

[![](assets/flame-face-96.png?v=3)Meet Flame](https://canopychat.app/flame) [How It Works](#how-it-works)

Signed in on your computer? [Link it here](https://canopychat.app/link)

![](assets/app-icon.png)

**Quiet Coffee Nearby** with Canopy

Find a quiet coffee spot near me.

Happy to help. Want me to use your location to check what's close by?

Yes, somewhere with outdoor seating.

Fern & Grounds is a six-minute walk — a calm patio under the trees, open until 6pm. Sources shown when web search is used

Message your assistant… ↑

For developers

## Install Canopy Code

Comfortable in a terminal? Canopy Code is the coding agent behind CanopyChat, on macOS, Linux and Windows. Free to use with ChatGPT, Claude or your own models, and you can drive it from your phone with remote control. [More about Canopy Code](https://canopychat.app/canopy-code)

    # macOS (Apple silicon)

    brew install nathanaelguitar/canopy/canopy-code

    canopy

    # Linux (x64 or arm64)

    brew install nathanaelguitar/canopy/canopy-code

    canopy

    # Windows (x64, PowerShell)

    scoop install https://github.com/nathanaelguitar/canopy-code-releases/releases/latest/download/canopy-code.json

    canopy

- Paste it into Terminal on an Apple silicon Mac. Need Homebrew first? Get it at [brew.sh](https://brew.sh).
- Paste it into your shell on 64-bit Intel, AMD or ARM Linux. Homebrew runs on Linux too: get it at [brew.sh](https://brew.sh).
- Paste it into PowerShell on 64-bit Windows. Need Scoop first? Get it at [scoop.sh](https://scoop.sh).
- Using Claude? Install Claude Code too (`brew install --cask claude-code`), then choose **Sign in with Anthropic** in `/auth`.
- Using Claude? Install Claude Code too (`curl -fsSL https://claude.ai/install.sh | bash`), then choose **Sign in with Anthropic** in `/auth`.
- Using Claude? Install Claude Code too (`irm https://claude.ai/install.ps1 | iex`), then choose **Sign in with Anthropic** in `/auth`.
- Use VS Code? Install the extension: [download the VSIX](https://downloads.canopychat.app/vscode/canopy-code-vscode-latest.vsix), or run `code --install-extension canopy-code-vscode-latest.vsix` from the folder it downloaded to. Needs VS Code 1.106 or newer and Canopy Code installed first.
- Want remote control from your phone? [Create a Canopy account](https://canopychat.app/signup), then [link your computer](https://canopychat.app/link).

Easy on the planet

## Intelligence under your own canopy.

Everyday questions are answered right on your phone or computer. When a job needs more muscle, CanopyChat calls on the cloud, and only then.

### Hybrid by design

Local first, cloud when it counts. Quick answers stay on your device, where they're fast and private. Bigger jobs, like Flame working through a project, get extra horsepower from the cloud.

### Privacy comes first

We keep everything we can on your device. Anything that goes to the cloud travels encrypted, without your name or account attached, and isn't kept afterward, unless it powers something you turned on, like Flame's memory. [How we handle your data](https://canopychat.app/privacy#cloud)

### A lighter footprint

Less infrastructure, less energy, less impact. Just you and your assistant, under the canopy.

Climate commitment • via Stripe Climate

### Permanent removal, not just offsets.

CanopyChat contributes a percentage of revenue to help advance *emerging permanent carbon-removal* technologies through Stripe Climate. Not credits that expire — tech that pulls carbon out for good.

CO₂ → ↓

### Yours, on your device

Your chat history lives on your phone or computer, not in someone else's database.

### You choose what's kept

Your conversations aren't stored in the cloud by default. Anything that is, like Flame's memory, is something you switched on.

### Up to date when it matters

Ask about something current or nearby, and CanopyChat brings in fresh, local answers.
