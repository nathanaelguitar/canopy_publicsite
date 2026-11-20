# Install CanopyChat on Windows (beta)

Source: https://canopychat.app/windows

[CanopyChat](https://canopychat.app/) / [Download](https://canopychat.app/#downloads) / Windows

# Install CanopyChat on Windows

A desktop app for Windows 10 and 11 on 64-bit PCs. The free plan runs a small model on your computer, and a paid plan unlocks cloud models.

**The Windows app is a beta.** We are taking feature requests and bug reports at <support@canopychat.app>.

Other systems: [Mac](https://canopychat.app/mac) [Linux](https://canopychat.app/linux) [Install with an agent](https://canopychat.app/agents)

## Download and install

One file. Download it, open it, and tell Windows it is fine to run.

[Download CanopyChat-Setup.exe](https://downloads.canopychat.app/windows/CanopyChat-Setup.exe) about 165 MB · Windows 10 and 11, 64-bit

1.  Open `CanopyChat-Setup.exe` from your Downloads folder.
2.  Windows may show **“Windows protected your PC”**. That is SmartScreen, because the installer is new and not yet code-signed. Choose **More info**, then **Run anyway**.
3.  Follow the installer. When it finishes, CanopyChat is in your Start menu.

## What you get

- The CanopyChat app on your PC: private chat that answers on your computer first. Your chats stay on the machine.
- The free plan runs Canopy Lite, our small language model, on your computer. A [paid plan](https://canopychat.app/plans) adds cloud models for bigger jobs.
- Sign in with your email: we send a 6-digit code, no password. The same account works on your phone.
- In-app updates from version 0.3.6 on, so you install by hand only once.

## Supported systems

- **Windows 10 and Windows 11**, 64-bit (x64). There is no ARM build for Windows yet.
- The installer is not code-signed yet, so SmartScreen warns about it. The [checksum](#install) lets you confirm the file is ours.

## Install by hand

Download [CanopyChat-Setup.exe](https://downloads.canopychat.app/windows/CanopyChat-Setup.exe) (about 165 MB) and open it. If Windows says **“Windows protected your PC”**, choose **More info**, then **Run anyway**. Then follow the installer.

### Check the download

Want to be sure the file is the one we published? Open PowerShell and run this. It prints the SHA-256 of the file you downloaded, then the `sha256`, `version` and `size` we publish in [latest.json](https://downloads.canopychat.app/windows/latest.json). The two hashes must match.

```
(Get-FileHash "$env:USERPROFILE\Downloads\CanopyChat-Setup.exe" -Algorithm SHA256).Hash.ToLower()
Invoke-RestMethod https://downloads.canopychat.app/windows/latest.json | Select-Object version, sha256, size
```

If they differ, delete the file and download it again from downloads.canopychat.app. Do not run it.

### Download from PowerShell

Prefer the terminal? This saves the installer to your Downloads folder and opens it:

```
$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest https://downloads.canopychat.app/windows/CanopyChat-Setup.exe -OutFile "$env:USERPROFILE\Downloads\CanopyChat-Setup.exe"; Start-Process "$env:USERPROFILE\Downloads\CanopyChat-Setup.exe"
```

## Install with an agent

Have a coding agent on this PC, like Claude Code or Codex? Paste this into it. It points the agent at [canopychat.app/agents.md](https://canopychat.app/agents.md), which has the full instructions, and sets the rules: it asks you before it runs the installer, it leaves administrator prompts to you, and it never signs in for you.

```
Install CanopyChat on this Windows computer. Follow the Windows instructions at https://canopychat.app/agents.md. Download only https://downloads.canopychat.app/windows/CanopyChat-Setup.exe and check its SHA-256 against https://downloads.canopychat.app/windows/latest.json before anything else. Tell me before you run the installer. If Windows asks for administrator approval or shows a SmartScreen warning, stop and let me click it myself. Do not sign in to CanopyChat for me.
```

The agent will run the same commands as above: download with `Invoke-WebRequest`, compare the hash with `Get-FileHash`, then start the installer. The installer's own windows, SmartScreen and the sign-in screen are yours to click through. When it is done, open CanopyChat from the Start menu and sign in.

## First start

Open **CanopyChat** from the Start menu. Sign in with your email: we send a 6-digit code, no password. The free plan runs on your computer; a paid plan unlocks cloud models.

To see which version you have, open Settings inside the app. The newest version is listed as `version` in [latest.json](https://downloads.canopychat.app/windows/latest.json).

## Updates

From version 0.3.6, CanopyChat checks for new versions by itself. In Settings, choose **Check for updates**, then **Update now**: the installer opens for you, and SmartScreen may ask again. If you have 0.3.5 or older, download the installer above and run it once; it replaces the old version.

## Uninstall

Open Windows **Settings**, then **Apps**, find **CanopyChat** in the list of installed apps and choose **Uninstall**. On Windows 10 the list is called Apps & features.

## Known gaps

The honest list of what the Windows beta does not do yet:

- No list of your other computers and no remote control of them from this app. The Mac app has it.
- Model recommendations are limited to Canopy Lite for now. Other local models are not suggested yet.
- The installer is not code-signed, so SmartScreen warns about it on every install and update.
- Features arrive over time, and some screens are rougher than on the phone. If something is missing that you need, tell <support@canopychat.app>.

## Troubleshooting

### “Windows protected your PC”

That is SmartScreen, because the installer is not code-signed yet. Choose **More info**, then **Run anyway**. If there is no More info link, a policy on your PC blocks unsigned apps (common on work computers); ask whoever manages it, or email us.

### Not sure the file is ours

Compare its SHA-256 with [latest.json](https://downloads.canopychat.app/windows/latest.json) using the [commands above](#check-the-download). Only download from downloads.canopychat.app.

### The download is very slow in PowerShell

Older PowerShell draws a progress bar that slows `Invoke-WebRequest` down a lot. The command above turns it off with `$ProgressPreference = 'SilentlyContinue'`. Or download the file in your browser.

### Something else

Email <support@canopychat.app> with your Windows version, the CanopyChat version from Settings and the exact message you saw. Screenshots help.

Back to [canopychat.app](https://canopychat.app/) or [Support](https://canopychat.app/support).
