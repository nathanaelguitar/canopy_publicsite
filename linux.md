# Install CanopyChat on Linux (beta)

Source: https://canopychat.app/linux

[CanopyChat](https://canopychat.app/) / [Download](https://canopychat.app/#downloads) / Linux

# Install CanopyChat on Linux

A desktop app for Ubuntu 22.04 or newer, with packages for Fedora and openSUSE too, on x86-64 and ARM64. The free plan runs a small model on your computer, and a paid plan unlocks cloud models.

**The Linux app is a beta.** We are taking feature requests and bug reports at <support@canopychat.app>.

Other systems: [Windows](https://canopychat.app/windows) [Mac](https://canopychat.app/mac) [Install with an agent](https://canopychat.app/agents)

## Quick install

Ubuntu and Debian. One line, from any folder: it downloads the `.deb` for your computer and installs it.

```
curl -fLO https://downloads.canopychat.app/linux/CanopyChat-$(dpkg --print-architecture).deb && sudo apt install ./CanopyChat-$(dpkg --print-architecture).deb
```

Fedora. The same, with the `.rpm`:

```
curl -fLO https://downloads.canopychat.app/linux/CanopyChat-$(uname -m).rpm && sudo dnf install ./CanopyChat-$(uname -m).rpm
```

openSUSE, x86-64 only (ARM64 openSUSE is not confirmed; see [Supported systems](#supported-systems)). `zypper` asks once about the missing package signature; choose to continue only after you have checked the file’s `sha256` ([Choose a file](#choose-a-file)).

```
curl -fLO https://downloads.canopychat.app/linux/CanopyChat-$(uname -m).rpm && sudo zypper install ./CanopyChat-$(uname -m).rpm
```

Prefer to download the file?

x86-64 (Intel and AMD)

[Linux x86-64 (.deb)](https://downloads.canopychat.app/linux/CanopyChat-amd64.deb) about 285 MB · Ubuntu 22.04 or newer

Then install it from your Downloads folder:

```
cd ~/Downloads && sudo apt install ./CanopyChat-amd64.deb
```

[Linux x86-64 (.rpm)](https://downloads.canopychat.app/linux/CanopyChat-x86_64.rpm) about 218 MB · Fedora and openSUSE

Then install it from your Downloads folder, on Fedora:

```
cd ~/Downloads && sudo dnf install ./CanopyChat-x86_64.rpm
```

or on openSUSE:

```
cd ~/Downloads && sudo zypper install ./CanopyChat-x86_64.rpm
```

ARM64 (for example NVIDIA DGX Spark, Raspberry Pi 5, Ampere)

[Linux ARM64 (.deb)](https://downloads.canopychat.app/linux/CanopyChat-arm64.deb) about 235 MB · Ubuntu 24.04 or newer

Then install it from your Downloads folder:

```
cd ~/Downloads && sudo apt install ./CanopyChat-arm64.deb
```

[Linux ARM64 (.rpm)](https://downloads.canopychat.app/linux/CanopyChat-aarch64.rpm) about 189 MB · Fedora (openSUSE ARM64 is not confirmed)

Then install it from your Downloads folder, on Fedora:

```
cd ~/Downloads && sudo dnf install ./CanopyChat-aarch64.rpm
```

On openSUSE ARM64 the app is not confirmed to work with the system web engine; see [Supported systems](#supported-systems) and use the [AppImage](#other-distributions) there.

## What you get

- The CanopyChat app on your Linux desktop: private chat that answers on your computer first. Your chats stay on the machine, in `~/.local/share/canopychat`.
- The free plan runs Canopy Lite, our small language model, on your computer. A [paid plan](https://canopychat.app/plans) adds cloud models for bigger jobs.
- Sign in with your email: we send a 6-digit code, no password. The same account works on your phone.
- A `canopychat` launcher command and an entry in your applications menu.

## Supported systems

- **x86-64** (Intel and AMD): Ubuntu 22.04 or newer.
- **ARM64** (for example NVIDIA DGX Spark, Raspberry Pi 5, Ampere servers): Ubuntu 24.04 or newer. The local model engine for ARM64 needs a newer system library (glibc 2.38) than Ubuntu 22.04 has.
- **Fedora** (x86-64 and ARM64): the `.rpm`. Tested on Fedora 45, on both x86-64 and ARM64, in a container with a virtual display: it installs with `dnf`, starts and loads its web view, and removes cleanly. Not tested on a real desktop with a graphics card. These Fedora and openSUSE tests were run on the 0.3.8 files.
- **openSUSE**: the same `.rpm`. Tested on openSUSE Tumbleweed on x86-64 in a container, as above. **ARM64 openSUSE is not confirmed:** in our test its system web engine crashed when the app drew its window, so use the AppImage there.
- The `.rpm` needs WebKitGTK 4.1 and glibc 2.34 or newer. `dnf` refused it on Rocky Linux 9 when we tried. Red Hat and AlmaLinux 9 and openSUSE Leap 15 are older than those requirements too, so expect the same there (we did not try them).
- We test on Ubuntu. Other Debian-based systems may work with the `.deb` but are not tested.
- Arch and other distributions: see [Other distributions](#other-distributions).

## Choose a file

Not sure which architecture you have? Run this in a terminal on any Linux:

```
uname -m
```

`x86_64` means x86-64. `aarch64` means ARM64. On Ubuntu and Debian, `dpkg --print-architecture` prints the same choice as `amd64` or `arm64`. The `.rpm` files are named with the `uname -m` value.

- [Linux x86-64 (.deb)](https://downloads.canopychat.app/linux/CanopyChat-amd64.deb), about 285 MB
- [Linux ARM64 (.deb, e.g. DGX Spark, Raspberry Pi 5, Ampere)](https://downloads.canopychat.app/linux/CanopyChat-arm64.deb), about 235 MB
- [Linux x86-64 (.rpm, for Fedora and openSUSE)](https://downloads.canopychat.app/linux/CanopyChat-x86_64.rpm), about 218 MB
- [Linux ARM64 (.rpm, for Fedora; openSUSE ARM64 is not confirmed)](https://downloads.canopychat.app/linux/CanopyChat-aarch64.rpm), about 189 MB
- AppImage, for Arch and other distributions (untested, [details below](#other-distributions)): [x86-64](https://downloads.canopychat.app/linux/CanopyChat-x86_64.AppImage) or [ARM64](https://downloads.canopychat.app/linux/CanopyChat-aarch64.AppImage).

To check a download, run `sha256sum` on it and compare the result with the `sha256` for your file (`amd64-deb`, `arm64-deb`, `x86_64-rpm` or `aarch64-rpm`) in [latest.json](https://downloads.canopychat.app/linux/latest.json).

## Install by hand

### From the terminal

On Ubuntu and Debian. This works from any folder. It downloads the file for your computer and installs it:

```
curl -fLO https://downloads.canopychat.app/linux/CanopyChat-$(dpkg --print-architecture).deb && sudo apt install ./CanopyChat-$(dpkg --print-architecture).deb
```

If you downloaded the file in your browser, it is in your Downloads folder:

```
cd ~/Downloads && sudo apt install ./CanopyChat-$(dpkg --print-architecture).deb
```

Keep the `./` in front of the file name: it tells `apt` to install the file instead of searching its package lists.

### On Fedora and openSUSE

Download the `.rpm` for your computer ([Choose a file](#choose-a-file)), then install it from the folder it is in. On Fedora:

```
cd ~/Downloads && sudo dnf install ./CanopyChat-$(uname -m).rpm
```

On openSUSE (x86-64; on ARM64 use the AppImage):

```
cd ~/Downloads && sudo zypper install ./CanopyChat-$(uname -m).rpm
```

The `.rpm` is not signed yet. `dnf` installs a local unsigned file without asking. `zypper` asks once about the missing signature; only continue if you downloaded the file from downloads.canopychat.app and its `sha256` matches ([Choose a file](#choose-a-file)). The package manager installs WebKitGTK, GTK 3 and the GStreamer plugins for you.

### By double-clicking

Open the `.deb` in your file manager. It opens in your software installer (App Center on recent Ubuntu). Ubuntu may say “Potentially unsafe” or show an unknown publisher. That is because CanopyChat is a third-party package that is not in the Ubuntu archive, and Ubuntu cannot vouch for it. Only install files you downloaded from downloads.canopychat.app; [Choose a file](#choose-a-file) explains how to check a download.

### What gets installed

The download is about 189 to 285 MB, and the app takes about 550 MB on disk. The package needs WebKitGTK, GTK 3, GStreamer plugins and a few small libraries. `apt` (or `dnf` or `zypper`) installs them for you. On a fresh system that can be a few hundred MB of extra downloads. `libvulkan1` (the Vulkan loader) is recommended, so the local model can use your graphics card when your graphics driver supports Vulkan.

## Install with an agent

Have a coding agent on this computer, like Claude Code or Codex? Paste this into it. It points the agent at [canopychat.app/agents.md](https://canopychat.app/agents.md), which has the full instructions, and sets the rules: it asks you before anything that needs `sudo`, it never types your password, and it never signs in for you.

```
Install CanopyChat on this Linux computer. Follow the Linux instructions at https://canopychat.app/agents.md. Download only from https://downloads.canopychat.app/linux/ and check the SHA-256 against https://downloads.canopychat.app/linux/latest.json. Ask me before you run anything that needs sudo, and never type my password. Do not sign in to CanopyChat for me.
```

On Ubuntu and Debian the agent runs the [one-line command](#quick-install) above (on Fedora and openSUSE, the `.rpm` one), checks `sha256sum` against the manifest, then verifies with `command -v canopychat`. The `sudo` step and the sign-in screen are yours. When it is done, start the app and sign in.

## First start

To check that it installed, run this. It prints the path of the launcher and the installed version:

```
command -v canopychat && dpkg -s canopy-chat | grep '^Version'
```

On Fedora and openSUSE, use this instead:

```
command -v canopychat && rpm -q canopy-chat
```

Start it from a terminal on the computer’s desktop:

```
canopychat &
```

Or open CanopyChat from your applications menu. Sign in with your email: we send a 6-digit code, no password. Your plan unlocks cloud models. The free plan runs on your computer.

Your chats and settings are stored on your computer, in `~/.local/share/canopychat`.

## Updates

From version 0.3.6, CanopyChat checks for new versions by itself. In Settings, choose **Check for updates**, then **Update now**. On Linux the new package is saved to your Downloads folder; install it the same way as above. We have tested that path only for the `.deb`; on Fedora and openSUSE, if **Update now** finds nothing, download the new `.rpm` from this page and install it with `dnf` or `zypper`. On Arch there is no package yet, so the app has nothing to download there. If you have 0.3.5 or older, install 0.3.6 by hand once, using the steps above.

## What is new in 0.3.12

Version 0.3.12 is the current Linux version. Its packages passed our old-versus-new package check on ARM64 and x86-64. The Fedora and openSUSE container tests are still the 0.3.8 ones. New in 0.3.12:

- **Flame Host:** a new switch in Settings, **Let Flame use this computer**, is off by default. When it is on, your Flame assistant, which you manage from your phone, can use this computer. On Linux it runs as a user service. It signs in as its own device on your Canopy account and only listens on this computer, with no listener on your local network. Traffic is encrypted. It stops within about 15 seconds after you remove the device, sign out or turn it off. It has been tested on Linux.
- **Restrict Flame (sandbox):** an optional setting for people with sensitive workloads. It is Linux-only and off by default. Some systems cannot enforce it; the app then says so and does not run Flame.
- **Models:** you can find models on your local network with Bonjour. Your other signed-in computers can appear as model sources. You can import settings from Canopy Code. Saved keys are only sent to addresses on your own network or to a host you saved.

Changes since 0.3.9, from version 0.3.11:

- **Agents:** **Ask before running commands** is on by default. You can sign in to Agents with ChatGPT. There is a **Summarize to Grove** action.
- **Grove:** web search shows **Sources**, and replies can include tables and links. You can add photos only where the local Canopy Lite has a vision projector; otherwise the app says so clearly.
- PDFs are read in a protected helper process.
- **Your computers** reconnects by itself and prefers Wi-Fi or Tailscale.

## Uninstall

```
sudo apt remove canopy-chat
```

On Fedora:

```
sudo dnf remove canopy-chat
```

On openSUSE:

```
sudo zypper remove canopy-chat
```

Each of these removes the app but keeps your chats and settings. To delete them too:

```
rm -rf ~/.local/share/canopychat
```

To remove an AppImage, delete the file.

## Other distributions

Fedora and openSUSE have their own `.rpm` (above). Arch has no package yet: nothing is published for it, not in the AUR and not for `pacman`. For Arch and any other distribution the AppImage is the option; we have not tested it on those systems. Run it from the folder you saved it in:

```
chmod +x CanopyChat-x86_64.AppImage && ./CanopyChat-x86_64.AppImage
```

Use `CanopyChat-aarch64.AppImage` on ARM64. The sections above on installing, updating and removing describe the `.deb` and the `.rpm`; to remove an AppImage, delete the file.

## Known gaps

The honest list of what the Linux beta does not do yet:

- No list of your other computers and no remote control of them from this app. The Mac app has it.
- Model recommendations are limited to Canopy Lite for now. Other local models are not suggested yet.
- On some NVIDIA machines the window opens blank until you start the app with the [workaround below](#troubleshooting).
- Features arrive over time, and some screens are rougher than on the phone. If something is missing that you need, tell <support@canopychat.app>.

## Troubleshooting

### E: Unsupported file ./CanopyChat-amd64.deb given on commandline

`apt` cannot find the file at that path. Most often the file is not in the folder you are in: browsers save to `~/Downloads`, not your home folder. Run `ls CanopyChat-*.deb` to check, then `cd ~/Downloads` and try again, or use the [one-line command](#quick-install), which downloads the file into the folder you are in.

### N: Download is performed unsandboxed as root

This is a notice, not an error. It appears when the `.deb` is in your home folder, which the `_apt` user cannot read, so `apt` reads it as root instead. If the output ends with `Setting up canopy-chat`, the install worked. To avoid the notice, install from `~/Downloads` or `/tmp`.

### Architecture mismatch

You have the file for the other architecture. The amd64 file does not install on an ARM64 computer, and the arm64 file does not install on x86-64. Run `dpkg --print-architecture` and download that file. The one-line command picks it for you. For an `.rpm`, run `uname -m`: `x86_64` or `aarch64` is the name in the file.

### dnf or zypper refuses the .rpm (nothing provides, or a version is too old)

The `.rpm` needs WebKitGTK 4.1 and glibc 2.34 or newer. Rocky Linux 9 is too old for it (`dnf` refused the file in our test), and Red Hat and AlmaLinux 9 and openSUSE Leap 15 are expected to be too. The package manager refuses instead of installing a broken app. Use the AppImage there.

### zypper says the file has no signature

That is expected: the `.rpm` is not signed yet. `zypper` asks once; choose to continue if you downloaded the file from downloads.canopychat.app and its `sha256` matches.

### The window opens but stays blank

Some computers with an NVIDIA graphics driver (the NVIDIA DGX Spark, for one) draw a blank window because of a rendering problem in the web engine. From version 0.3.7 the app turns on the fix by itself on those computers, so there is nothing to do. If you have an older version, update, or start the app like this:

```
WEBKIT_DISABLE_DMABUF_RENDERER=1 canopychat &
```

If you set `WEBKIT_DISABLE_DMABUF_RENDERER` yourself, the app keeps your value.

### Graphics problems

Make sure `libvulkan1` is installed (`sudo apt install libvulkan1`) and that your graphics driver supports Vulkan. Without Vulkan, the local model runs on the processor.

Still stuck? Email <support@canopychat.app> with your distribution, the output of `uname -m` and the exact error.

Back to [canopychat.app](https://canopychat.app/) or [Support](https://canopychat.app/support).
