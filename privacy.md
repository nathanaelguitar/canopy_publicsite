# CanopyChat Privacy Policy

Source: https://canopychat.app/privacy

[Privacy](https://canopychat.app/privacy)[Terms](https://canopychat.app/terms)

Privacy Policy

# CanopyChat Privacy Policy

Effective date: October 26, 2026

CanopyChat is a hybrid, local-first AI app for iPhone, Android, Mac, Windows, and Linux, including Flame, its AI agent. This policy explains what information the app stores, when information may leave your device, how we handle it in the cloud, and how to contact us.

**Short version:** CanopyChat keeps everything it can on your device. Bigger tasks may use cloud processing; when they do, requests are encrypted in transit, stripped of information that directly identifies you, and not retained after the response, unless you turn on a feature that needs them kept, such as Flame’s memory. Information also leaves your device for features you choose, such as web search, location-aware answers, model downloads, purchases, or feedback you send.

**Accuracy and safety:** CanopyChat may produce inaccurate, incomplete, outdated, or unexpected responses. Verify important information independently and do not rely on CanopyChat for medical, legal, financial, safety, or emergency decisions.

## Cloud Processing

CanopyChat is hybrid. Everyday requests are handled on your device whenever it can do the job. Some tasks need more than a phone or laptop can provide, such as Flame’s agent work or long, complex requests; for those, CanopyChat sends the request to a cloud AI model that CanopyChat operates or contracts for. When it does:

- **Only what the task needs.** We send the request and the context needed to answer it, not your full history, files, or settings.
- **Encrypted in transit.** Requests travel over encrypted connections. Connections between your phone and your computer for Flame and remote control are end-to-end encrypted, so our relay cannot read them.
- **Not tied to you.** Requests we send to model providers do not carry your name, email address, or account identifiers. We do not add identifying details beyond what you include in the request itself.
- **Zero data retention.** We use model providers under zero-data-retention terms: requests are processed to produce a response and are not stored by the provider or used to train its models. CanopyChat does not keep the content of cloud requests after the response is delivered.
- **Exceptions you opt into.** Some features only work if information is kept. Flame’s persistent memory, for example, stores notes about your projects and preferences so Flame can pick up where it left off. These features are off until you turn them on, the information is used only for that feature, and you can turn them off at any time and ask us to delete what was kept. Flame’s cloud computer, available by invitation, is another: it keeps the files and work you give it so Flame can keep going while your own devices are off, and you can delete it at any time. The Contributor Beta described below is another opt-in exception.
- **Operational records.** To keep the service secure, prevent abuse, and handle billing, we keep limited metadata about cloud requests, such as timestamps, sizes, and error codes, without their content.

If you connect your own AI provider account instead, for example by signing in with ChatGPT or Claude in Canopy Code, your requests go directly to that provider and are governed by your agreement with them, not by the commitments above.

## Flame Waitlist and Contributions

If you join the Flame waitlist, we store your email address, when you joined, and a one-way hashed form of your IP address used to prevent abuse. We use your email only to send your invitation and occasional Flame updates, and you can ask us to remove it at any time. If you make an optional contribution, payment is handled by Stripe on its hosted checkout page; we receive the amount, your email address, and payment status, never your full card details.

## Contributor Beta and Model Improvement

The CanopyChat Contributor Beta is a separate, clearly disclosed testing program. If you choose to join it in the app, selected interactions may be securely sent to CanopyChat so we can evaluate and improve the model. The Contributor Beta is not the same as the private production experience described in our marketing.

Contributor participation is voluntary. We ask for your affirmative agreement before collecting contributor data. You can stop future collection at any time in the app’s Contributor settings. Stopping participation deletes contributor data that is still queued on your device; it does not automatically delete data already received by CanopyChat.

### What Contributor Data May Be Collected

When Contributor Beta collection is active, CanopyChat may retain selected examples rather than every conversation. These can include:

- Your prompt and the model response associated with a selected interaction.
- Feedback you provide, including a thumbs-down, written correction, report, or regeneration request.
- Quality and reliability signals, such as empty, truncated, malformed, or failed responses and tool failures.
- A small random sample of ordinary interactions to compare successful and unsuccessful responses.
- Technical context needed to evaluate the example, such as app version, model version, prompt version, device type, operating-system version, latency, and a random app-installation identifier.

### How Contributor Data Is Used

We use contributor data to investigate failures, build evaluation sets, measure model quality, and prepare reviewed training examples for future model improvements. We do not sell contributor data, use it for behavioral advertising, or use it to track you across other companies’ apps or websites.

### Retention and Deletion Requests

We retain contributor data only as long as reasonably necessary for model evaluation, safety, reliability, and improvement work. Raw uploads may be de-identified, redacted, reviewed, and transformed into curated evaluation or training records. To request deletion of contributor data already received by CanopyChat, email [support@canopychat.app](mailto:support@canopychat.app?subject=Contributor%20data%20deletion%20request) with “Contributor data deletion request” in the subject line and any relevant interaction details. We may need enough information to locate the submitted record without asking for unnecessary personal information.

## Information Stored on Your Device

CanopyChat may store the following locally on your device:

- Conversation titles, messages, summaries, and attachments you add.
- Custom assistants, system preferences, workspace names, and app settings.
- Downloaded on-device model files (such as Canopy Lite, a small language model) and related runtime cache.
- Subscription entitlement state returned by the store you purchased through (Apple StoreKit or Google Play).

## Information Sent Outside Your Device

CanopyChat may send limited information outside your device only for selected features:

- **Contributor Beta:** If you explicitly join the Contributor Beta, selected interactions and technical context may be sent for model evaluation and improvement as described above.
- **Web search:** If you ask for current, factual, local, weather, news, or web-grounded information, CanopyChat may send a search query and relevant context to a search service.
- **Help on harder questions (Apple Private Cloud Compute):** This is off until you allow it. If you turn it on, when CanopyChat recognizes a harder question, such as multi-step math, planning, or code, it may send that question and up to three of your most recent earlier messages to Apple’s Private Cloud Compute service to get brief notes. CanopyChat’s on-device model then writes the reply. Attachments, on-device conversation memory, and your custom preferences are never sent. Apple processes these requests under its privacy commitments for Private Cloud Compute, and CanopyChat does not receive or store them. You can turn this off at any time in Settings.
- **Location-aware answers:** If you grant location permission and ask for nearby or local information, approximate location context may be used to improve search results.
- **Attachments:** Photos, files, and camera images are used only when you attach or capture them. They may be included in the on-device model prompt and, if a web or backend feature is enabled later, only as needed for the feature you requested.
- **Model downloads:** The app may download model files from a remote model host and cache them on your device.
- **Purchases:** Subscriptions are processed by the store you buy from (Apple or Google Play). CanopyChat receives entitlement information from that store, but does not receive your credit card or store account payment details.
- **Feedback:** If you use the feedback or report issue feature, the message you choose to send may include app version, device information, conversation title, and selected response text.

## Location, Camera, Photos, and Files

CanopyChat requests access to location, camera, photos, or files only when you use a feature that requires it. You can manage these permissions in your device's system settings at any time.

## Tracking and Advertising

CanopyChat does not include third-party advertising SDKs in the app. The public website uses Meta’s measurement tools to understand page visits, waitlist sign-ups, checkout starts, and confirmed purchases from advertisements. Meta may receive browser, device, page, and event information for measurement and ad delivery. The website does not send chat content, app conversations, model prompts, model responses, or the email addresses you enter to Meta. You can manage cookies and browser tracking controls through your browser settings.

## Children

CanopyChat is not directed to children under 13, and we do not knowingly collect personal information from children under 13.

## Data Retention

Local conversations and app settings remain on your device until you delete them, uninstall the app, or reset app data. Feedback emails remain in the receiving mailbox unless deleted. Contributor Beta data is handled as described in the Contributor Beta and Model Improvement section above.

## Your Account and Email Address

If you create a CanopyChat account we collect your email address and use it to sign you in and to tell you about app updates. We do not use it for promotions and we do not sell it.

Sign-in codes are single-use, expire quickly and are never stored on your computer after you sign in. Your account stays signed in on this computer so CanopyChat keeps working offline.

## Account and Profile Deletion

If you created a CanopyChat profile, you can delete it from the app’s Settings screen. This removes your profile, sign-in sessions, pending authentication data, and the association between your profile and any founding-member entitlement. It does not erase immutable payment or tax records that must be retained for operational, financial, or legal purposes.

If you cannot access the app, email [support@canopychat.app](mailto:support@canopychat.app?subject=CanopyChat%20account%20deletion%20request) with the subject “CanopyChat account deletion request.” Tell us the email address associated with the profile and what you want deleted. We will verify the request and delete the profile and associated personal account data; local conversations and files remain on your device and must be deleted in the app or by uninstalling it.

## Your Choices

- Delete conversations or attachments in the app where available.
- Disable app permissions from your device's system settings.
- Manage or cancel subscriptions from your Apple ID or Google Play subscription settings.
- In the Contributor Beta, stop future model-improvement collection from the Contributor settings and delete pending contributor data on your device.
- Contact support for privacy questions or deletion requests involving feedback you sent.

## Contact

For privacy questions, contact <support@canopychat.app>.

## Changes

We may update this policy as CanopyChat changes. The effective date above will be updated when changes are published.
