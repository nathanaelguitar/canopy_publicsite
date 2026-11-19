# Install CanopyChat on Linux (beta)

Source: https://canopychat.app/linux

[CanopyChat](https://canopychat.app/) / [Download](https://canopychat.app/#downloads) / Linux

# Install CanopyChat on Linux

A desktop app for Ubuntu 22.04 or newer, on x86-64 and ARM64. The free plan runs a small model on your computer, and a paid plan unlocks cloud models.

**The Linux app is a beta.** It works, but it is missing features that the phone apps and the Mac app already have, and you will run into rough edges. We ship fixes as we go.

If something breaks or does not make sense, email <support@canopychat.app> and tell us what happened. Those reports decide what we fix next.

Other systems: [Windows](https://canopychat.app/windows) [Mac](https://canopychat.app/mac) [Install with an agent](https://canopychat.app/agents)

## Quick install

Ubuntu and Debian. One line, from any folder: it downloads the `.deb` for your computer and installs it.

```
curl -fLO https://downloads.canopychat.app/linux/CanopyChat-$(dpkg --print-architecture).deb && sudo apt install ./CanopyChat-$(dpkg --print-architecture).deb
```

Prefer to download the file?

x86-64 (Intel and AMD)

[Linux x86-64 (.deb)](https://downloads.canopychat.app/linux/CanopyChat-amd64.deb) about 280 MB · Ubuntu 22.04 or newer

Then install it from your Downloads folder:

```
cd ~/Downloads && sudo apt install ./CanopyChat-amd64.deb
```

ARM64 (for example NVIDIA DGX Spark, Raspberry Pi 5, Ampere)

[Linux ARM64 (.deb)](https://downloads.canopychat.app/linux/CanopyChat-arm64.deb) about 230 MB · Ubuntu 24.04 or newer

Then install it from your Downloads folder:

```
cd ~/Downloads && sudo apt install ./CanopyChat-arm64.deb
```

## What you get

- The CanopyChat app on your Linux desktop: private chat that answers on your computer first. Your chats stay on the machine, in `~/.local/share/canopychat`.
- The free plan runs Canopy Lite, our small language model, on your computer. A [paid plan](https://canopychat.app/plans) adds cloud models for bigger jobs.
- Sign in with your email: we send a 6-digit code, no password. The same account works on your phone.
- A `canopychat` launcher command and an entry in your applications menu.

## Supported systems

- **x86-64** (Intel and AMD): Ubuntu 22.04 or newer.
- **ARM64** (for example NVIDIA DGX Spark, Raspberry Pi 5, Ampere servers): Ubuntu 24.04 or newer. The local model engine for ARM64 needs a newer system library (glibc 2.38) than Ubuntu 22.04 has.
- We test on Ubuntu. Other Debian-based systems may work with the `.deb` but are not tested.
- Fedora, Arch and other distributions: see [Other distributions](#other-distributions).

## Choose a file

Not sure which architecture you have? Run this in a terminal on any Linux:

```
uname -m
```

`x86_64` means x86-64. `aarch64` means ARM64. On Ubuntu and Debian, `dpkg --print-architecture` prints the same choice as `amd64` or `arm64`.

- [Linux x86-64 (.deb)](https://downloads.canopychat.app/linux/CanopyChat-amd64.deb), about 280 MB
- [Linux ARM64 (.deb, e.g. DGX Spark, Raspberry Pi 5, Ampere)](https://downloads.canopychat.app/linux/CanopyChat-arm64.deb), about 230 MB
- AppImage, for Fedora, Arch and other distributions (untested, [details below](#other-distributions)): [x86-64](https://downloads.canopychat.app/linux/CanopyChat-x86_64.AppImage) or [ARM64](https://downloads.canopychat.app/linux/CanopyChat-aarch64.AppImage).

To check a download, run `sha256sum` on it and compare the result with the `sha256` for your file (`amd64-deb` or `arm64-deb`) in [latest.json](https://downloads.canopychat.app/linux/latest.json).

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

### By double-clicking

Open the `.deb` in your file manager. It opens in your software installer (App Center on recent Ubuntu). Ubuntu may say “Potentially unsafe” or show an unknown publisher. That is because CanopyChat is a third-party package that is not in the Ubuntu archive, and Ubuntu cannot vouch for it. Only install files you downloaded from downloads.canopychat.app; [Choose a file](#choose-a-file) explains how to check a download.

### What gets installed

The download is about 230 to 280 MB, and the app takes about 550 MB on disk. The package needs WebKitGTK, GTK 3, GStreamer plugins and a few small libraries. `apt` installs them for you. On a fresh system that can be a few hundred MB of extra downloads. `libvulkan1` (the Vulkan loader) is recommended, so the local model can use your graphics card when your graphics driver supports Vulkan.

## Install with an agent

Have a coding agent on this computer, like Claude Code or Codex? Paste this into it. It points the agent at [canopychat.app/agents.md](https://canopychat.app/agents.md), which has the full instructions, and sets the rules: it asks you before anything that needs `sudo`, it never types your password, and it never signs in for you.

```
Install CanopyChat on this Linux computer. Follow the Linux instructions at https://canopychat.app/agents.md. Download only from https://downloads.canopychat.app/linux/ and check the SHA-256 against https://downloads.canopychat.app/linux/latest.json. Ask me before you run anything that needs sudo, and never type my password. Do not sign in to CanopyChat for me.
```

On Ubuntu and Debian the agent runs the [one-line command](#quick-install) above, checks `sha256sum` against the manifest, then verifies with `command -v canopychat`. The `sudo` step and the sign-in screen are yours. When it is done, start the app and sign in.

## First start

To check that it installed, run this. It prints the path of the launcher and the installed version:

```
command -v canopychat && dpkg -s canopy-chat | grep '^Version'
```

Start it from a terminal on the computer’s desktop:

```
canopychat &
```

Or open CanopyChat from your applications menu. Sign in with your email: we send a 6-digit code, no password. Your plan unlocks cloud models. The free plan runs on your computer.

Your chats and settings are stored on your computer, in `~/.local/share/canopychat`.

## Updates

From version 0.3.6, CanopyChat checks for new versions by itself. In Settings, choose **Check for updates**, then **Update now**. On Linux the new package is saved to your Downloads folder; install it the same way as above. If you have 0.3.5 or older, install 0.3.6 by hand once, using the steps above.

## Uninstall

```
sudo apt remove canopy-chat
```

This removes the app but keeps your chats and settings. To delete them too:

```
rm -rf ~/.local/share/canopychat
```

To remove an AppImage, delete the file.

## Other distributions

Fedora, Arch and other distributions: there is no package for them. The AppImage is the option; we have not tested it on those systems. Run it from the folder you saved it in:

```
chmod +x CanopyChat-x86_64.AppImage && ./CanopyChat-x86_64.AppImage
```

Use `CanopyChat-aarch64.AppImage` on ARM64. The sections above on installing, updating and removing describe the `.deb`; to remove an AppImage, delete the file.

## Known gaps

The honest list of what the Linux beta does not do yet:

- No list of your other computers and no remote control of them from this app. The Mac app has it; Linux will get it.
- Model recommendations are limited to Canopy Lite for now. Other local models are not suggested yet.
- On some NVIDIA machines the window opens blank until you start the app with the [workaround below](#troubleshooting).
- Features arrive over time, and some screens are rougher than on the phone. If something is missing that you need, tell <support@canopychat.app>.

## Troubleshooting

### E: Unsupported file ./CanopyChat-amd64.deb given on commandline

`apt` cannot find the file at that path. Most often the file is not in the folder you are in: browsers save to `~/Downloads`, not your home folder. Run `ls CanopyChat-*.deb` to check, then `cd ~/Downloads` and try again, or use the [one-line command](#quick-install), which downloads the file into the folder you are in.

### N: Download is performed unsandboxed as root

This is a notice, not an error. It appears when the `.deb` is in your home folder, which the `_apt` user cannot read, so `apt` reads it as root instead. If the output ends with `Setting up canopy-chat`, the install worked. To avoid the notice, install from `~/Downloads` or `/tmp`.

### Architecture mismatch

You have the file for the other architecture. The amd64 file does not install on an ARM64 computer, and the arm64 file does not install on x86-64. Run `dpkg --print-architecture` and download that file. The one-line command picks it for you.

### The window opens but stays blank

Some computers with an NVIDIA graphics driver (the NVIDIA DGX Spark, for one) draw a blank window because of a rendering problem in the web engine. Start the app like this instead:

```
WEBKIT_DISABLE_DMABUF_RENDERER=1 canopychat &
```

We are fixing this in the app, so a later version will not need it.

### Graphics problems

Make sure `libvulkan1` is installed (`sudo apt install libvulkan1`) and that your graphics driver supports Vulkan. Without Vulkan, the local model runs on the processor.

Still stuck? Email <support@canopychat.app> with your distribution, the output of `uname -m` and the exact error.

Back to [canopychat.app](https://canopychat.app/) or [Support](https://canopychat.app/support).
