# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are people arriving from short-form video who want a private, lighter-weight AI assistant on iPhone. The founding flow is intended for early adopters deciding whether to make a one-time contribution before public launch.

## Product Purpose

CanopyChat is a private, local-first chat app for iPhone. It aims to make useful everyday AI available while keeping conversations, photos, files, and location closer to the user's device.

## Positioning

CanopyChat is designed to answer on the iPhone first, with optional web grounding when the user chooses it, rather than treating remote data-center infrastructure as the default for every interaction.

## Operating Context

Visitors arrive from short videos, read the Founding Members invitation on a phone, choose a one-time contribution, and are redirected to Stripe-hosted Checkout. Successful founding members receive iPhone beta/TestFlight setup details by email.

## Capabilities and Constraints

- Founding Membership currently supports US iPhone beta enrollment.
- The contribution minimum is $10 and the contribution is one-time, not an automatic subscription.
- Premium access is included throughout the three-month iPhone beta.
- Checkout is created by the founding API and payment details are collected by Stripe-hosted Checkout.
- Enrollment may be capacity-limited; a full group routes visitors to a waitlist path.

## Brand Commitments

The product name is CanopyChat. The existing brand uses a tree mark and connects privacy, on-device intelligence, and a lighter infrastructure footprint. CanopyChat contributes a percentage of revenue through Stripe Climate to help advance emerging permanent carbon-removal technologies. The founding page should speak plainly and make the contribution terms easy to understand.

## Evidence on Hand

- `assets/app-icon.png` — CanopyChat tree mark.
- `index.html` — product description and on-device / privacy copy.
- `founding.html` — founding offer, beta terms, contribution flow.
- `assets/founding.js` — Stripe Checkout redirect behavior and error states.

## Product Principles

- Keep everyday intelligence close to the person using it.
- Make privacy the default and user choice explicit.
- Treat environmental impact as a product constraint, not a vague marketing ornament.
- Make early access useful: members should be able to influence the details while they are still being built.
- State payment, access, and subscription terms before the visitor commits.

## Accessibility & Inclusion

The founding flow must remain usable with keyboard focus, touch targets, reduced motion preferences, and screen readers. Contribution choices must expose their selected state and validation feedback through semantic controls.
