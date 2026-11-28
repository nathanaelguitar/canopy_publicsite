# Install CanopyChat on Mac (TestFlight beta)

Source: https://canopychat.app/mac

[CanopyChat](https://canopychat.app/) / [Download](https://canopychat.app/#downloads) / Mac

# Install CanopyChat on Mac

A free Mac app, delivered through Apple’s TestFlight while it is in App Review. The free plan runs a small model on your Mac, and a paid plan unlocks cloud models.

**The Mac app is a beta.** It is not on the Mac App Store yet. We are taking feature requests and bug reports at <support@canopychat.app>.

Other systems: [Windows](https://canopychat.app/windows) [Linux](https://canopychat.app/linux) [Install with an agent](https://canopychat.app/agents)

## Join the beta

Three steps, all in Apple’s own apps. Nothing to download from us.

1.  Install **TestFlight** from the [Mac App Store](https://apps.apple.com/app/testflight/id899247664), if you do not have it. It is Apple’s free app for beta software.
2.  Open our invite link below. It opens in TestFlight. Choose **Accept**, then **Install**.
3.  Open **CanopyChat** from Launchpad, Spotlight or the Open button in TestFlight, and sign in with your email.

[Open the TestFlight invite](https://testflight.apple.com/join/f5xCZmVv) testflight.apple.com · free

## What you get

- The CanopyChat app on your Mac: private chat that answers on your computer first. Your chats stay on the machine.
- The free plan runs Canopy Lite, our small language model, on your Mac. A [paid plan](https://canopychat.app/plans) adds cloud models for bigger jobs.
- Sign in with your email: we send a 6-digit code, no password. The same account works on your iPhone.
- Updates come through TestFlight, like any other beta app on your Mac.

## Supported systems

- A Mac that can run the TestFlight app. The TestFlight page for CanopyChat shows the exact macOS version the current build needs; if your Mac is too old, TestFlight says so before you install.
- The app is free during the beta. TestFlight requires an Apple Account, the same one you use for the App Store.

## Install by hand

1.  Open the Mac App Store and install [TestFlight](https://apps.apple.com/app/testflight/id899247664) if it is not already in your Applications folder.
2.  Open [testflight.apple.com/join/f5xCZmVv](https://testflight.apple.com/join/f5xCZmVv). Safari hands it to TestFlight. If the page shows a **View in TestFlight** button instead, click it.
3.  In TestFlight, choose **Accept**, then **Install**. TestFlight downloads CanopyChat and puts it in your Applications folder.
4.  Open CanopyChat. The first time, macOS may ask you to confirm you want to open a beta app from TestFlight; choose Open.

Prefer the terminal for step 2? This opens the invite:

```
open "https://testflight.apple.com/join/f5xCZmVv"
```

## Install with an agent

An agent on your Mac, like Claude Code or Codex, **cannot finish this install by itself**. TestFlight is Apple’s app and signed in with your Apple Account, so the Accept and Install clicks are yours. What an agent can do is open the invite for you and walk you through the clicks. Paste this into it:

```
Help me install CanopyChat on this Mac. Follow the Mac instructions at https://canopychat.app/agents.md. It is a TestFlight beta: check that the TestFlight app is installed, open https://testflight.apple.com/join/f5xCZmVv for me, then tell me what to click in TestFlight. You cannot click Accept or Install in TestFlight for me, and do not sign in to anything for me. When I say the install finished, open CanopyChat for me.
```

These are the commands the agent runs. They open the invite in TestFlight and, once you have installed the app, start it:

```
open "https://testflight.apple.com/join/f5xCZmVv"
open -a CanopyChat
```

If `open -a CanopyChat` says the app cannot be found, the TestFlight install has not finished yet.

## First start

Open **CanopyChat** from Launchpad or Spotlight. Sign in with your email: we send a 6-digit code, no password. The free plan runs on your Mac; a paid plan unlocks cloud models.

TestFlight may ask once whether you want to send crash reports and feedback to the developer. That goes through Apple and helps us fix the beta.

## Updates

New builds arrive in TestFlight. Open TestFlight and choose **Update** next to CanopyChat, or turn on automatic updates for it in TestFlight. Each TestFlight build stops working 90 days after we publish it; when TestFlight tells you a build has expired, install the newer one from the same place.

## Uninstall

Drag **CanopyChat** from your Applications folder to the Trash. To leave the beta as well, open TestFlight, select CanopyChat and choose **Stop Testing**.

## Known gaps

The Mac app is in beta: some features are still missing and some screens are rough. We would rather you hear that from us than find out after installing. If something you need is not there, tell <support@canopychat.app> and we will say whether it is coming.

## Troubleshooting

### The invite link shows a web page, not TestFlight

TestFlight is not installed, or the link opened in a browser that does not hand off to it. Install [TestFlight](https://apps.apple.com/app/testflight/id899247664) from the Mac App Store, then open the link again, or click **View in TestFlight** on that page.

### TestFlight says the beta is full or no longer accepting testers

Apple caps the number of testers. Email <support@canopychat.app> and we will open a spot.

### TestFlight says my Mac is not compatible

The current build needs a newer macOS than your Mac has. The TestFlight page lists the version. Updating macOS is the fix; if you cannot, email us so we know.

### Something else

Email <support@canopychat.app> with your macOS version, the CanopyChat build number from TestFlight and the exact message you saw. Screenshots help.

Back to [canopychat.app](https://canopychat.app/) or [Support](https://canopychat.app/support).
