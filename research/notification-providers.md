# Which hosted notification providers fit Cadence?

Research for [#3](https://github.com/defffy/cohort-005-project/issues/3) (map: [#2](https://github.com/defffy/cohort-005-project/issues/2)). Checked **2026-11-26**.

Scope: a hosted SaaS with a free tier that covers dev/demo use, and one workflow that sends both **in-app** and **email**. Browser and mobile push are out of scope.

## How this was sourced (read this first)

- **Docs:** Read from each vendor's **official documentation source repo or SDK repo on GitHub**: `knocklabs/docs`, `novuhq/docs`, `suprsend/documentation`, `trycourier/courier-skills` and `trycourier/courier-react-quickstart` (Courier's official agent reference and sample), and `magicbell/magicbell-js`. SDK versions come from the npm registry. Links below point at the GitHub source of each doc page. The rendered pages live on each vendor's docs site under the same path.
- **Pricing pages were not reachable.** The sandbox firewall returned `403 Approval required` for every vendor domain: `knock.app`, `novu.co`, `courier.com`, `magicbell.com`, `suprsend.com`, and their docs subdomains. So any free-tier figure that is not in a docs repo is marked **(secondary)**. Those figures come from search-engine summaries of the pricing pages and third-party trackers. Check them on the pricing page before relying on them:
  - https://knock.app/pricing
  - https://novu.co/pricing
  - https://www.courier.com/pricing
  - https://www.magicbell.com/pricing
  - https://www.suprsend.com/pricing

## Summary table

| | **Knock** | **Novu Cloud** | **Courier** | **MagicBell** | **SuprSend** |
|---|---|---|---|---|---|
| React feed component | `@knocklabs/react` 0.15 (feed, popover, bell) | `@novu/react` 3.21 `<Inbox />`, Bell, Notifications, Preferences | `@trycourier/courier-react` 9.3 (inbox, popup menu, toasts, preferences) | `@magicbell/react` 1.14 (Inbox, FloatingInbox, UserPreferences) | `@suprsend/react` 1.6 (Inbox, NotificationFeed, toasts, preferences) |
| Headless option | Yes: `@knocklabs/react-core` hooks | Yes: `useNotifications`, `useCounts`, … | Yes: `useCourier()` / datastore | Partly: `ItemComponent` slot; the older `@magicbell/react-headless` 5.x is the previous generation | Yes: `@suprsend/react-core` hooks |
| Tailwind/shadcn styling | CSS variables (`--rnf-*`) + replaceable CSS; headless for full control | **Tailwind classes accepted directly** via `appearance.elements` | Theme objects; styles injected into shadow roots, so no Tailwind classes; render props for items | CSS variables (`--magicbell-*`) + class overrides | Theme props + CSS; headless for full control |
| Email in same workflow | Yes | Yes | Yes | Yes (per-category channel delivery) | Yes |
| Email providers (documented) | SES, Cloudflare Email, MailerSend, Mailgun, Mailjet, Mailtrap, Mandrill, Postmark, Resend, SendGrid, SMTP, SparkPost, + built-in test channel | SES, Braze, Brevo, custom SMTP, Infobip, MailerSend, Mailgun, Mailjet, Mailtrap, Mandrill, Maqsam, Netcore, Outlook 365, Plunk, Postmark, Resend, SendGrid, SparkPost, webhook, + Novu default provider | Catalog via API (SendGrid, SES, …); built-in Test Email Provider | SendGrid, SES, Mailgun, SMTP (+ a `ping_email` integration) | SES, Mailgun, Postmark, Resend, SendGrid, + SuprSend's vendors in Sandbox |
| Free tier | 10K messages/mo **(secondary)**; a message = 1 user × 1 channel (primary) | 10K workflow runs/mo **(secondary)**; 2 environments, 3 members, 20 workflows (primary docs; a tracker reports 5 since Nov 2026) | 10,000 sends per period (primary) | 1,000 deliveries/mo **(secondary)** | 10K notifications/mo **(secondary)** |
| Environments | Production; enable Development; more can be added | Dev + Prod (custom envs on Team+) | Production + Test (+ custom) | — (not verified) | Sandbox + Staging + Production (+ custom) |
| Node SDK | `@knocklabs/node` 1.41 | `@novu/api` 3.21 (`@novu/node` deprecated) | `@trycourier/courier` 10.3 | `magicbell-js` 2.0 (ProjectClient/UserClient) | `@suprsend/node-sdk` 1.15 |
| Feed auth | Public key + RS256 user JWT ("enhanced security mode") | `subscriberId` + HMAC-SHA256 `subscriberHash` | Server-minted, scoped JWT via `/auth/issue-token` | HS256 user JWT signed with project secret | Public key + ES256 user JWT ("enhanced security mode") |
| Preferences | Preferences API + React example (build your own UI) | Workflow/subscriber/global prefs + built-in Preferences UI | Subscription topics + hosted or embedded preference center | `UserPreferences` component (channels per category) | Preferences API + React/headless preference components |
| Offline / no keys | No. Sandbox mode, test email channel | **Self-host via Docker** (MongoDB + Redis); keyless Inbox for quick start (still online) | No. Test environment + test email | No | No. Test Mode in Staging |

## Per provider

### Knock

- **In-app UI.** `@knocklabs/react` gives a notification feed, a popover and a bell button. Styling uses CSS variables prefixed `--rnf-`, or you can replace Knock's CSS entirely. For a fully custom UI, build headless on the React hooks (`useNotifications`, `useNotificationStore`, `useAuthenticatedKnockClient`). Sources: [feeds/styling.mdx](https://github.com/knocklabs/docs/blob/main/content/in-app-ui/feeds/styling.mdx), [feeds/custom-ui.mdx](https://github.com/knocklabs/docs/blob/main/content/in-app-ui/feeds/custom-ui.mdx), [react hooks](https://github.com/knocklabs/docs/tree/main/content/in-app-ui/react/sdk/hooks).
- **Email.** Email is a channel step in the same workflow. Supported email providers: SES, Cloudflare Email, MailerSend, Mailgun, Mailjet, Mailtrap, Mandrill, Postmark, Resend, SendGrid, SMTP and SparkPost ([integrations/email](https://github.com/knocklabs/docs/tree/main/content/integrations/email)). There is also a **built-in test email channel**: 100 emails/month, delivered only to members of your Knock account ([knock-test.mdx](https://github.com/knocklabs/docs/blob/main/content/integrations/email/knock-test.mdx)).
- **Free tier and metering.** There is a Free plan (formerly called Developer) plus Starter and Enterprise. Knock counts one message per user per channel, so a workflow that sends in-app plus email counts as **2 messages**. Usage counts in every environment, but sandboxed channels don't count ([knock-plans.mdx](https://github.com/knocklabs/docs/blob/main/content/manage-your-account/knock-plans.mdx)). The Free plan includes 10K messages/month **(secondary)**; Starter is $250/mo for 50K **(secondary)**. Per-tenant preferences and i18n are Enterprise-only (same page).
- **Environments.** An account starts with production. You can enable a development environment and add more ([environments.mdx](https://github.com/knocklabs/docs/blob/main/content/version-control/environments.mdx)).
- **Node SDK.** `@knocklabs/node` (npm 1.41.1, 2026-11-10). Call `workflows.trigger` from React Router actions. Sign user tokens with `signUserToken` from `@knocklabs/node/lib/tokenSigner` ([security-and-authentication.mdx](https://github.com/knocklabs/docs/blob/main/content/in-app-ui/security-and-authentication.mdx)).
- **Feed auth.** The client uses a public API key. In production, turn on **enhanced security mode**, which requires an RS256 JWT with `sub` = user id, signed with the `KNOCK_SIGNING_KEY` private key (same page).
- **Preferences.** There is a preferences API (default preference set), and the React guide shows how to build a `PreferenceCenter` yourself ([react/preferences.mdx](https://github.com/knocklabs/docs/blob/main/content/in-app-ui/react/preferences.mdx)).
- **Offline.** There is no local emulator. Sandbox mode renders messages without delivering them, but sandbox mode is **not available for the in-app channel**. Use channel conditions there instead ([knock-plans.mdx](https://github.com/knocklabs/docs/blob/main/content/manage-your-account/knock-plans.mdx)).

### Novu Cloud

- **In-app UI.** `@novu/react` provides `<Inbox />` plus Bell, Notifications and Preferences pieces. `appearance.variables` sets global tokens. `appearance.elements` accepts **Tailwind classes per element**, which fits shadcn tokens best of all five ([inbox styling.mdx](https://github.com/novuhq/docs/blob/main/content/docs/platform/inbox/configuration/styling.mdx)). For a fully custom UI, headless mode gives `NovuProvider` plus `useNotifications`, `useCounts` and other hooks ([headless-mode.mdx](https://github.com/novuhq/docs/blob/main/content/docs/platform/inbox/headless-mode.mdx)). Keyless mode renders `<Inbox />` with no configuration for local experiments ([@novu/react README on npm](https://www.npmjs.com/package/@novu/react)).
- **Email.** In-app and email steps live in the same workflow. The email channel is "enabled and configured with Novu's default provider" out of the box ([adding-email.mdx](https://github.com/novuhq/docs/blob/main/content/docs/platform/integrations/email/adding-email.mdx)). Supported providers: SES, Braze, Brevo, custom SMTP, Infobip, MailerSend, Mailgun, Mailjet, Mailtrap, Mandrill, Maqsam, Netcore, Outlook 365, Plunk, Postmark, Resend, SendGrid, SparkPost and webhook. Novu also supports failover between providers ([email providers](https://github.com/novuhq/docs/tree/main/content/docs/platform/integrations/email/(providers)), [email index](https://github.com/novuhq/docs/blob/main/content/docs/platform/integrations/email/index.mdx)).
- **Free tier.** The limits table in the docs gives the Free plan: **20 workflows, 2 environments, 3 team members, 30-day inbox retention, 1-day activity-log retention, 1-day delay/digest** ([limits.mdx](https://github.com/novuhq/docs/blob/main/content/docs/platform/developer/limits.mdx); docs repo last pushed 2026-10-13). The Free plan includes 10K workflow runs/month **(secondary)**. A pricing tracker reports the free workflow cap was cut from 20 to **5** in Nov 2026 **(secondary, unconfirmed)**. Pro is $30/mo **(secondary)**.
- **Environments.** Development and Production by default. Custom environments need the Team plan or higher ([environments.mdx](https://github.com/novuhq/docs/blob/main/content/docs/platform/developer/environments.mdx)).
- **Node SDK.** Use `@novu/api` (npm 3.21.0, 2026-11-23): `new Novu({ secretKey }).trigger({ workflowId, to, payload })`. It supports `serverURL` for EU or self-hosted deployments ([novu-ts README](https://github.com/novuhq/novu-ts/blob/main/README.md)). `@novu/node` is deprecated on npm.
- **Feed auth.** The Inbox takes `applicationIdentifier` plus `subscriberId`. Without HMAC, anyone who guesses a `subscriberId` can read that user's feed. To prevent that, enable HMAC on the Novu In-App integration and pass `subscriberHash = HMAC-SHA256(secretKey, subscriberId)`, computed on the server ([prepare-for-production.mdx](https://github.com/novuhq/docs/blob/main/content/docs/platform/inbox/prepare-for-production.mdx)). This is the simplest scheme of the five: one `createHmac` call, no key pair, and no expiry to refresh.
- **Preferences.** Three levels: workflow channel defaults, per-subscriber per-workflow, and subscriber global. There is also a built-in preferences view in the Inbox ([concepts/preferences.mdx](https://github.com/novuhq/docs/blob/main/content/docs/platform/concepts/preferences.mdx), [inbox preferences](https://github.com/novuhq/docs/blob/main/content/docs/platform/inbox/configuration/preferences.mdx)).
- **Offline.** Novu is the **only one of the five that is open source and self-hostable**. You can run it with Docker Compose, which needs MongoDB and Redis; the docs recommend ≥8 GB RAM. Point `<Inbox backendUrl socketUrl>` and the SDK's `serverURL` at the local instance ([deploy-with-docker.mdx](https://github.com/novuhq/docs/blob/main/content/docs/community/self-hosting-novu/deploy-with-docker.mdx), [run-in-local-machine.mdx](https://github.com/novuhq/docs/blob/main/content/docs/community/run-in-local-machine.mdx)). Self-hosting lacks custom environments, branding removal and snooze ([self-hosted-and-novu-cloud.mdx](https://github.com/novuhq/docs/blob/main/content/docs/community/self-hosted-and-novu-cloud.mdx)).

### Courier

- **In-app UI.** `@trycourier/courier-react` v8/9 renders `<CourierInbox />` and `<CourierInboxPopupMenu />`, and has `useCourier()` for a custom UI. Theming goes through `lightTheme`/`darkTheme` objects, and render props let you replace parts (`renderListItem`, `renderHeader`, …). Styles are injected into **shadow roots**, so Tailwind classes can't reach inside the built-in components ([inbox/react.md](https://github.com/trycourier/courier-skills/blob/main/skills/courier/references/inbox/react.md), [inbox/rendering.md](https://github.com/trycourier/courier-skills/blob/main/skills/courier/references/inbox/rendering.md)).
- **Email.** A single send can go to inbox and email through routing. The provider catalog comes from the `/providers/catalog` API ([guides/providers.md](https://github.com/trycourier/courier-skills/blob/main/skills/courier/references/guides/providers.md)). With a **Test** key, a built-in Courier Test Email Provider delivers only to your sign-up address ([guides/quickstart.md](https://github.com/trycourier/courier-skills/blob/main/skills/courier/references/guides/quickstart.md)).
- **Free tier.** The Developer plan caps sends at **10,000 per period**; sends over the cap are `THROTTLED` and not queued ([guides/reliability.md](https://github.com/trycourier/courier-skills/blob/main/skills/courier/references/guides/reliability.md)). Search summaries of courier.com/pricing say the same: 10,000 sends/month free, then $0.005/send, and test messages count too **(secondary)**.
- **Environments.** Production and Test, plus custom environments such as Staging. The API key picks the environment ([guides/quickstart.md](https://github.com/trycourier/courier-skills/blob/main/skills/courier/references/guides/quickstart.md)).
- **Node SDK.** `@trycourier/courier` (npm 10.3.0, 2026-11-24). Your server mints the inbox JWT with `POST /auth/issue-token`, scoped `user_id:{id} inbox:read:messages inbox:write:events` ([inbox/auth.md](https://github.com/trycourier/courier-skills/blob/main/skills/courier/references/inbox/auth.md), [courier-react-quickstart](https://github.com/trycourier/courier-react-quickstart)).
- **Feed auth and DevUI.** Courier's guidance is explicit: "Sign out on user switch. Never sign in with a token minted for another user." The SDK does **not refresh tokens** for you. A token minted without `expires_in` never expires and can only be revoked by rotating the API key (same sources).
- **Preferences.** Courier has subscription topics with defaults (`OPTED_IN`, `OPTED_OUT` or `REQUIRED`), a hosted preference center, and embedded preferences ([guides/preferences.md](https://github.com/trycourier/courier-skills/blob/main/skills/courier/references/guides/preferences.md)).
- **Offline.** No. Use the Test environment.

### MagicBell

- **In-app UI.** `@magicbell/react` 1.14.0 (2026-07-29) provides `Provider token`, `Inbox`, `FloatingInbox`, `UserPreferences` and toasts. Theming uses importable CSS plus `--magicbell-*` CSS variables and class overrides. `Inbox` takes an `ItemComponent` for custom rows ([npm README](https://www.npmjs.com/package/@magicbell/react)). The older `@magicbell/magicbell-react` / `@magicbell/react-headless` packages (v11/v5, last released 2026-03-20) are the previous generation. The React source is no longer in the public `magicbell-js` monorepo, whose `packages/` now holds only `magicbell-js`, the CLI, service-worker and utils ([repo](https://github.com/magicbell/magicbell-js)).
- **Email.** The integrations API covers SendGrid, SES, Mailgun, SMTP and a `ping_email` integration. Channel delivery is configured per category ([magicbell-js IntegrationsService](https://github.com/magicbell/magicbell-js/tree/main/packages/magicbell-js/docs)).
- **Free tier.** A free allowance of 1,000 deliveries/month; the next tier is $249/mo for 50K **(secondary)**. This is the smallest free tier of the five.
- **Node SDK.** `magicbell-js` 2.0.1 provides a `ProjectClient` (broadcasts, users, workflows, integrations) and a `UserClient` ([README](https://github.com/magicbell/magicbell-js/blob/main/packages/magicbell-js/README.md)).
- **Feed auth.** A user JWT signed **HS256 with the project secret**, carrying `user_external_id` and/or `user_email` plus `api_key` (magicbell.com/docs/api/authentication/user, via search summary; the page was not reachable).
- **Preferences.** A `UserPreferences` component toggles channels per category.
- **Offline.** No.

### SuprSend

- **In-app UI.** `@suprsend/react` 1.6.0 offers Inbox, NotificationFeed, toasts and preferences, with `themeType` light/dark, theme overrides and a custom bell component ([react-customising-feed.mdx](https://github.com/suprsend/documentation/blob/main/docs/react-customising-feed.mdx)). For a headless UI, `@suprsend/react-core` exposes hooks and providers ([react-sdk-headless-feed.mdx](https://github.com/suprsend/documentation/blob/main/docs/react-sdk-headless-feed.mdx)).
- **Email.** Vendor integrations include SES, Mailgun, Postmark, Resend and SendGrid. The **Sandbox** workspace has SuprSend's own vendors preconfigured, but email there goes only to up to 5 verified addresses ([vendors.mdx](https://github.com/suprsend/documentation/blob/main/docs/vendors.mdx)).
- **Free tier.** 10K notifications/month with unlimited team members; the free in-app feed shows SuprSend branding **(secondary)**. The Sandbox workspace is time-limited ("available for a trial period") ([workspaces.mdx](https://github.com/suprsend/documentation/blob/main/docs/workspaces.mdx)).
- **Environments.** Sandbox, Staging and Production by default, plus custom workspaces (same page).
- **Node SDK.** `@suprsend/node-sdk` 1.15.1. Last npm release was 2026-05-19, the stalest of the five.
- **Feed auth.** A public key plus an **ES256** user JWT (`entity_type: "subscriber"`, `entity_id`, `exp`) in enhanced security mode ([client-authentication.mdx](https://github.com/suprsend/documentation/blob/main/docs/client-authentication.mdx)).
- **Preferences.** User and tenant preferences, an embedded preference centre, and React/headless components ([user-preferences.mdx](https://github.com/suprsend/documentation/blob/main/docs/user-preferences.mdx), [preferences-react-headless.mdx](https://github.com/suprsend/documentation/blob/main/docs/preferences-react-headless.mdx)).
- **Offline.** No. Test Mode in Staging diverts or blocks delivery ([test-mode.mdx](https://github.com/suprsend/documentation/blob/main/docs/developer/test-mode.mdx)).

## How it fits Cadence's React Router app and DevUI

All five follow the same pattern:

- **Trigger from actions.** In a React Router `action` (for example `courses.$slug.purchase.tsx` or `courses.$slug.refund.ts`), call the server SDK with the secret key after the DB write commits. Use `recipient id = String(user.id)`.
- **Mint feed credentials in the layout loader.** `app/routes/layout.app.tsx` already resolves `currentUser` from the session cookie. Compute the feed credential there: a Novu `subscriberHash`, or a Knock/SuprSend/MagicBell/Courier JWT. Return it in `loaderData` and never expose the secret.
- **DevUI user switching.** `api.switch-user.ts` sets the cookie and `redirect`s, so the layout loader re-runs and returns a credential for the new user. Put `key={currentUser.id}` on the provider so the feed client tears down and reconnects. This matters most for Courier, which documents "sign out on user switch". Novu's HMAC is deterministic, so there is no expiry to manage. JWT-based providers need an `exp` and a refresh plan for long-lived tabs.
- **Tests and offline dev.** None of the hosted APIs run offline. Wrap the provider behind a small `notify(event, recipients, data)` module and use a no-op or recording fake when the key env var is unset. Vitest then never touches the network. The client feed should render nothing, or an empty bell, without a key. Only Novu offers a real offline backend: self-hosted Docker, at a heavy cost of Mongo, Redis and ~8 GB RAM.

## Recommendation

**Leading candidate: Novu Cloud.** Runner-up: **Knock**.

Why Novu:
- It is the only inbox that takes **Tailwind classes directly** (`appearance.elements`), so it can match shadcn tokens without fighting CSS. Headless hooks are there if that isn't enough.
- **HMAC auth is the simplest** with DevUI switching: one `createHmac` in the layout loader, and no token expiry or refresh.
- The free tier is enough for a demo: ~10K runs, Dev + Prod environments, a default email provider so email works before you pick a vendor, and Resend/Postmark/SES etc. later.
- **Keyless `<Inbox />`** for quick spikes, and the **self-host** escape hatch if offline dev ever becomes a hard requirement.

Trade-offs and risks:
- **Novu's free workflow cap may be 5, not 20** (unconfirmed tracker report, Nov 2026). Cadence's event list (Purchase, Refund requested/approved/denied, Seat claimed, …) could exceed 5. Confirm on novu.co/pricing when you sign up, or consolidate events into fewer workflows.
- Novu's free plan keeps the activity log for only 1 day, and delay/digest is limited to 1 day. Debugging yesterday's sends needs a paid plan.
- **Knock** is the most polished and best-documented option, with a test email channel. But its default feed is styled with `--rnf-*` CSS variables (shadcn fit means going headless), it needs an RS256 JWT, it counts in-app + email as 2 messages, and there is no sandbox for in-app.
- **Courier** has a solid primary-sourced free tier (10K sends) and good preferences. But its shadow-DOM styling is the worst fit for Tailwind, and JWT refresh is manual.
- **SuprSend** is comparable on features with an ES256 JWT. Its Node SDK is the least recently updated, and free-tier figures are secondary only.
- **MagicBell** has the smallest free tier (~1K deliveries) and the narrowest email-provider list. Its React SDK is in transition between generations.

Before committing, verify on each pricing page:
1. Novu's free workflow cap and run count.
2. Knock's Free-plan message count and whether extra environments are allowed on Free.
