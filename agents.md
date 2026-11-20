# Install CanopyChat with an AI agent

Source: https://canopychat.app/agents

[CanopyChat](https://canopychat.app/) / [Download](https://canopychat.app/#downloads) / Install with an agent

# Install CanopyChat with an AI agent

Want your coding agent to download and install CanopyChat for you? Give it this page. The same text is at [canopychat.app/agents.md](https://canopychat.app/agents.md) as plain Markdown, which is easier for an agent to read.

**The computer apps are betas.** Windows, Mac and Linux are all in beta. Each system has its own page with a prompt written for it: [Windows](https://canopychat.app/windows), [Mac](https://canopychat.app/mac), [Linux](https://canopychat.app/linux).

## Tell your agent

Paste this into Claude Code, Codex or any agent that can run commands on your computer.

```
Install CanopyChat on this computer. Follow the instructions at https://canopychat.app/agents.md and ask me before you run anything that needs sudo.
```

## Ask the user first

- Confirm before you install anything. Say which file you will download and which command you will run.
- Installing the Linux package needs `sudo`. Do not ask for the user’s password and do not type one; let them run the `sudo` step themselves or approve it.
- On Windows, SmartScreen and any administrator prompt are the user’s to click. On a Mac, the TestFlight Accept and Install buttons are the user’s to click. Stop and tell them what to do.
- Tell the user the computer apps are in beta, and that feature requests and bug reports go to support@canopychat.app.
- Do not sign in for the user. First start asks for an email address and a 6-digit code that is sent to it. Leave that to the user.
- Download only from `downloads.canopychat.app`. Do not use mirrors or other sites.

## Pick the platform

- **Ubuntu or Debian, x86-64:** the `.deb` (Ubuntu 22.04 or newer).
- **Ubuntu or Debian, ARM64** (for example NVIDIA DGX Spark): the `.deb` (Ubuntu 24.04 or newer).
- **Other Linux:** the AppImage (not tested on every distribution).
- **Windows 10 or 11, x64:** the setup `.exe`. Guide for people: [canopychat.app/windows](https://canopychat.app/windows).
- **Mac:** a free TestFlight beta, not on the Mac App Store yet. You can open the invite but not finish the install; see [Mac](#mac). Guide for people: [canopychat.app/mac](https://canopychat.app/mac).
- **iPhone, iPad, Android:** App Store or Google Play, from [canopychat.app](https://canopychat.app/#downloads). Nothing for an agent to do.

Check the architecture: `uname -m` prints `x86_64` or `aarch64`. On Debian and Ubuntu, `dpkg --print-architecture` prints `amd64` or `arm64`.

## Find the current file

Each platform has a small JSON manifest that always describes the newest release:

- Linux: [downloads.canopychat.app/linux/latest.json](https://downloads.canopychat.app/linux/latest.json)
- Windows: [downloads.canopychat.app/windows/latest.json](https://downloads.canopychat.app/windows/latest.json)

The Linux manifest has a `files` object with the keys `amd64-deb`, `arm64-deb`, `x86_64-appimage` and `aarch64-appimage`. Each entry has `url` (always the newest), `versionedUrl`, `sha256` and `size` in bytes. The Windows manifest has `version`, `url`, `versionedUrl`, `sha256` and `size` at the top level.

## Ubuntu and Debian

One command, from any folder. It downloads the `.deb` for this computer and installs it:

```
curl -fLO https://downloads.canopychat.app/linux/CanopyChat-$(dpkg --print-architecture).deb && sudo apt install ./CanopyChat-$(dpkg --print-architecture).deb
```

Keep the `./` before the file name, and run it in a folder you can write to. To check the download first, compare its hash with the manifest:

```
sha256sum CanopyChat-$(dpkg --print-architecture).deb
curl -fsS https://downloads.canopychat.app/linux/latest.json
```

The hash must equal the `sha256` of the `amd64-deb` or `arm64-deb` entry. If it does not, delete the file and stop.

The package pulls in WebKitGTK, GTK 3 and GStreamer through `apt`. That can add a few hundred MB on a fresh system. The app itself is about 550 MB on disk. `libvulkan1` is recommended so the local model can use the graphics card.

## Other Linux (AppImage)

```
curl -fLO https://downloads.canopychat.app/linux/CanopyChat-$(uname -m).AppImage && chmod +x CanopyChat-$(uname -m).AppImage && ./CanopyChat-$(uname -m).AppImage
```

`uname -m` gives `x86_64` or `aarch64`, which are the two file names. The AppImage needs the system’s graphics and web libraries.

## Windows

Download [CanopyChat-Setup.exe](https://downloads.canopychat.app/windows/CanopyChat-Setup.exe) (about 165 MB), check its SHA-256 against the `sha256` in the Windows manifest, then start it. In PowerShell:

```
$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest https://downloads.canopychat.app/windows/CanopyChat-Setup.exe -OutFile "$env:USERPROFILE\Downloads\CanopyChat-Setup.exe"
(Get-FileHash "$env:USERPROFILE\Downloads\CanopyChat-Setup.exe" -Algorithm SHA256).Hash.ToLower()
Invoke-RestMethod https://downloads.canopychat.app/windows/latest.json | Select-Object version, sha256, size
Start-Process "$env:USERPROFILE\Downloads\CanopyChat-Setup.exe"
```

If the hashes differ, delete the file and stop. The installer is not code-signed yet, so Windows SmartScreen shows “Windows protected your PC”; the user chooses **More info**, then **Run anyway**. Any administrator prompt is also theirs. When the installer finishes, CanopyChat is in the Start menu. From version 0.3.6 the app updates itself from Settings.

## Mac

The Mac app is a free TestFlight beta while it is in App Review. TestFlight is Apple’s app, signed in with the user’s Apple Account, so you cannot complete this install. Do this instead:

1.  Check that TestFlight is installed (`ls /Applications/TestFlight.app`). If not, tell the user to install it from the Mac App Store first.
2.  Open the invite for them: `open "https://testflight.apple.com/join/f5xCZmVv"`.
3.  Tell them to choose **Accept**, then **Install** in TestFlight, and to say when it has finished.
4.  Then start the app with `open -a CanopyChat`. If that fails, the install has not finished.

Updates come through TestFlight. There is nothing to download from downloads.canopychat.app for a Mac.

## Check that it worked

- Debian and Ubuntu: `command -v canopychat && dpkg -s canopy-chat | grep '^Version'` prints the launcher path and the installed version. Compare it with `version` in the manifest.
- Windows: CanopyChat appears in the Start menu once the installer finishes. The version is in the app’s Settings.
- To start it, run `canopychat &` in a terminal on the computer’s desktop, or open CanopyChat from the applications menu. Over SSH there is no screen, so skip this step and rely on the check above.
- If the window is blank, see [Troubleshooting](#troubleshooting).
- Then tell the user it is ready for them to sign in.

## Updates and uninstall

- From version 0.3.6, the app checks for updates itself (Settings, then Check for updates).
- Remove on Debian and Ubuntu with `sudo apt remove canopy-chat`. That keeps chats and settings. To delete them too, remove `~/.local/share/canopychat`, and only if the user asks.

## Troubleshooting

### E: Unsupported file ./CanopyChat-amd64.deb given on commandline

The file is not in the current folder. Run `ls CanopyChat-*.deb`, or run the one-line command again.

### The window opens but stays blank

Some computers with an NVIDIA graphics driver (the NVIDIA DGX Spark, for one) draw a blank window. Close the app and start it like this:

```
WEBKIT_DISABLE_DMABUF_RENDERER=1 canopychat &
```

A later version will do this by itself.

### Architecture mismatch

You have the file for the other architecture. Use `dpkg --print-architecture` to choose.

For anything else, see the [Linux](https://canopychat.app/linux), [Windows](https://canopychat.app/windows) or [Mac](https://canopychat.app/mac) guide, or email <support@canopychat.app> with the distribution, `uname -m` and the exact error.

Back to [canopychat.app](https://canopychat.app/) or [Support](https://canopychat.app/support).
