# Install CanopyChat on Mac

Source: https://canopychat.app/mac

[CanopyChat](https://canopychat.app/) / [Download](https://canopychat.app/#downloads) / Mac

# Install CanopyChat on Mac

The free CanopyChat app for Mac, on the Mac App Store. The free plan runs a small model on your Mac, and a paid plan unlocks cloud models.

Other systems: [Windows](https://canopychat.app/windows) [Linux](https://canopychat.app/linux) [Install with an agent](https://canopychat.app/agents)

## Get it from the Mac App Store

One click, in Apple’s own app. Nothing to download from us. Needs macOS 14.0 or later.

[Get CanopyChat on the App Store](https://apps.apple.com/us/app/canopychat/id6788203137) apps.apple.com · free

## What you get

- The CanopyChat app on your Mac: private chat that answers on your computer first. Your chats stay on the machine.
- The free plan runs Canopy Lite, our small language model, on your Mac. A [paid plan](https://canopychat.app/plans) adds cloud models for bigger jobs.
- Chat needs no account. Sign in with your email (we send a 6-digit code, no password) when you want your account, plans or your other computers.
- Updates come through the Mac App Store, like any other app on your Mac.

## What it needs

- **macOS 14.0 or later.** This is the requirement on the App Store page.
- The app is a universal build: it contains code for both Apple-silicon and Intel Macs.
- Picture creation is available on Apple-silicon Macs with enough memory. It asks before a one-time download, and the app hides it on Macs that cannot run it. The picture helper is Apple-silicon only.
- An Apple Account, the one you already use for the App Store. The app is free.

## Install by hand

1.  Open [CanopyChat on the App Store](https://apps.apple.com/us/app/canopychat/id6788203137). On a Mac the link opens the Mac App Store. If it opens a web page instead, click **View in Mac App Store**, or search the Mac App Store for **CanopyChat**.
2.  Choose **Get**, then **Install**, and sign in with your Apple Account if the App Store asks. CanopyChat goes into your Applications folder.
3.  Open CanopyChat from Launchpad or Spotlight.

The App Store page is shared with the iPhone and iPad app, and that is expected: it is one listing for all three.

## Install with an agent

An agent on your Mac, like Claude Code or Codex, **cannot finish this install by itself**. The Mac App Store is Apple’s app and signed in with your Apple Account, so the Get and Install clicks are yours. What an agent can do is open the App Store page for you and walk you through the clicks. Paste this into it:

```
Help me install CanopyChat on this Mac. Follow the Mac instructions at https://canopychat.app/agents.md. It is on the Mac App Store: open https://apps.apple.com/us/app/canopychat/id6788203137 for me, then tell me what to click. You cannot click Get or Install in the App Store for me, and do not sign in to anything for me. When I say the install finished, open CanopyChat for me.
```

These are the commands the agent runs. They open the App Store page and, once you have installed the app, start it:

```
open "https://apps.apple.com/us/app/canopychat/id6788203137"
open -a CanopyChat
```

If `open -a CanopyChat` says the app cannot be found, the App Store install has not finished yet.

## First start

The first time you chat, CanopyChat downloads its built-in model, Canopy Lite, once. After that it works offline, with no internet connection. You do not need an account to chat.

Sign in with your email when you want your account: we send a 6-digit code, no password. A paid plan unlocks cloud models.

The Agents screen works in a folder on your Mac. macOS only lets CanopyChat open folders you choose, so the app asks you to pick one; it does not read the rest of your files.

## Updates

The Mac App Store delivers updates. Open the App Store, choose **Updates** and update CanopyChat, or turn on automatic updates for apps in the App Store settings.

## Uninstall

Drag **CanopyChat** from your Applications folder to the Trash. That removes the app. Its chats and settings stay in the app’s own folder, `~/Library/Containers/com.nathanaelguitar.aetherchat`, so you can reinstall without losing them. To erase them as well, delete that folder after you remove the app.

## Troubleshooting

### The App Store says my Mac is not compatible

CanopyChat needs macOS 14.0 or later. Updating macOS is the fix; if you cannot, email us so we know.

### The link opens a web page, not the Mac App Store

Click **View in Mac App Store** on that page, or search the Mac App Store for CanopyChat.

### I do not see picture creation

Picture creation is hidden on Macs that cannot run it: it needs an Apple-silicon Mac with enough memory. Chat works the same on every supported Mac.

### Something else

Email <support@canopychat.app> with your macOS version, the CanopyChat version from the app and the exact message you saw. Screenshots help.

Back to [canopychat.app](https://canopychat.app/) or [Support](https://canopychat.app/support).
