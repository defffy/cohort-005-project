# Hosted notification providers for Cadence

**Question:** Which hosted notification services fit Cadence, and how do they compare? The candidates are Knock, Novu Cloud, Courier, MagicBell and SuprSend. The channels in scope are in-app and email.

**Checked:** 2026-11-26. **Status:** research only. Choosing a provider is a separate grilling ticket.

## How this was researched, and what could not be checked

From inside the sandbox, every vendor website returned `403 Approval required for <host>`. That includes the docs, the pricing pages and the marketing sites. The blocked hosts were `knock.app`, `docs.knock.app`, `novu.co`, `docs.novu.co`, `www.courier.com`, `www.magicbell.com`, `www.suprsend.com` and `docs.suprsend.com`. Because of that, the findings come from these primary sources instead:

- **Docs source repos the vendors publish on GitHub:** [knocklabs/docs](https://github.com/knocklabs/docs), [novuhq/docs](https://github.com/novuhq/docs) and [suprsend/documentation](https://github.com/suprsend/documentation). These are the sources the docs sites are built from. Each link below is pinned to the commit that was read.
- **First-party SDK repos and npm registry metadata**, for package names, versions, dependencies and exports.
- **Courier:** its docs site is not on GitHub. Its first-party [trycourier/courier-skills](https://github.com/trycourier/courier-skills) reference files and [trycourier/courier-react-quickstart](https://github.com/trycourier/courier-react-quickstart) were used instead.
- **MagicBell:** it has no public docs source. Only its SDK READMEs and SDK source were available.

**Unverified:** free-tier numbers that only appear on pricing pages. These are monthly volume, MAU caps and some environment limits. A web search limited to each vendor's own domain returned figures, but the pricing pages themselves were never read. Every figure taken from that search is marked *(unverified: search snippet, pricing page blocked)*. Check them on the pricing pages before relying on them.

## Cadence context (from the repo)

- **Stack:** React Router 8.3, React 19.2, Tailwind 4, shadcn (with `radix-ui`, `lucide-react`, `sonner`), Drizzle with better-sqlite3, zod 3.25, and Vitest. See `package.json`.
- **User IDs are SQLite integers.** See `app/db/schema.ts`. Every provider below identifies recipients by a **string** ID, so Cadence would send `String(user.id)`.
- **The current user is an integer stored in a cookie session** (`app/lib/session.ts`, `getCurrentUserId`). The DevUI panel (`app/components/dev-ui.tsx`) switches users by POSTing to `/api/switch-user` (`app/routes/api.switch-user.ts`). That route sets the cookie and **redirects**, so the `layout.app.tsx` loader runs again for the new user. In practice this means a per-user feed token can be minted in that loader and passed to the client. The client SDK must then re-authenticate when the user ID changes, since the old token belongs to another user.
- Cadence sends no notifications or email today.

---

## Knock

**In-app feed (React).** [`@knocklabs/react`](https://www.npmjs.com/package/@knocklabs/react) is at 0.15.1, published 2026-11-06. It accepts React 17, 18 or 19 as a peer. `next` and `@tanstack/react-router` are *optional* peers, per the npm registry metadata for 0.15.1.
- The library ships a prebuilt feed and an inbox ([feed.mdx](https://github.com/knocklabs/docs/blob/9cd144fb92/content/in-app-ui/react/feed.mdx), [inbox.mdx](https://github.com/knocklabs/docs/blob/9cd144fb92/content/in-app-ui/react/inbox.mdx)). It also ships toasts, banners, cards and modals ([in-app-ui/react/](https://github.com/knocklabs/docs/tree/9cd144fb92/content/in-app-ui/react)).
- **Styling:** the prebuilt feed is themed with `--rnf-` CSS variables. You can also replace Knock's CSS entirely, because all classes are prefixed `rnf-`, and cells can be swapped with `renderItem` ([feed.mdx §CSS customization](https://github.com/knocklabs/docs/blob/9cd144fb92/content/in-app-ui/react/feed.mdx)).
- **Headless:** a documented mode uses the `useNotifications` and `useAuthenticatedKnockClient` hooks with `@knocklabs/client` ([headless/feed.mdx](https://github.com/knocklabs/docs/blob/9cd144fb92/content/in-app-ui/react/headless/feed.mdx)). That makes a shadcn-styled feed feasible.
- **Caveat:** `@knocklabs/react` depends on Knock's own `@telegraph/*` components and on `lucide-react ^0.544`. Cadence uses `^0.563`, so the app would carry a second copy of lucide (npm metadata).

**Email in the same workflow.** Yes. One workflow can have in-app and email steps. Each step that delivers counts as a message, so "a workflow that notifies a user by both email and in-app results in two messages" ([knock-plans.mdx](https://github.com/knocklabs/docs/blob/9cd144fb92/content/manage-your-account/knock-plans.mdx)).
- **Providers:** Amazon SES, Cloudflare Email, MailerSend, Mailgun, Mailjet, Mailtrap, Mandrill, Postmark, Resend, SendGrid, SMTP and SparkPost ([integrations/email/](https://github.com/knocklabs/docs/tree/9cd144fb92/content/integrations/email), [overview.mdx](https://github.com/knocklabs/docs/blob/9cd144fb92/content/integrations/email/overview.mdx)).
- **Built-in test email:** 100 emails a month, and only to members of your Knock account ([knock-test.mdx](https://github.com/knocklabs/docs/blob/9cd144fb92/content/integrations/email/knock-test.mdx)).

**Free tier.**
- **Plans:** Free (formerly Developer), Starter and Enterprise. Per-tenant preferences and branding, translations and SAML are Enterprise only. Usage counts in *every* environment ([knock-plans.mdx](https://github.com/knocklabs/docs/blob/9cd144fb92/content/manage-your-account/knock-plans.mdx)).
- **Volume:** 10,000 messages a month free. Starter is $250/month for 50,000 *(unverified: search snippet, pricing page blocked; [knock.app/pricing](https://knock.app/pricing))*. The docs found no MAU cap; Knock meters messages, not users.
- **Sandbox mode:** sandboxed channels render messages but do not count toward usage. In-app channels can't be sandboxed ([knock-plans.mdx](https://github.com/knocklabs/docs/blob/9cd144fb92/content/manage-your-account/knock-plans.mdx)).
- **Environments:** an account starts with production only. "Enabling environments" adds development, and more can be created ([environments.mdx](https://github.com/knocklabs/docs/blob/9cd144fb92/content/version-control/environments.mdx)). The docs don't say whether the Free plan limits the number of environments **(unverified)**.

**Node SDK.** [`@knocklabs/node`](https://github.com/knocklabs/knock-node/tree/058160174b) is at 1.41.1. It is generated by Stainless.
- **Triggering:** `client.workflows.trigger(key, { recipients, data })` ([README](https://github.com/knocklabs/knock-node/blob/058160174b/README.md)). It is a plain fetch client, so it can be called from a React Router loader or action in a `*.server.ts` module.
- **Options:** `baseURL` (default `KNOCK_BASE_URL` or `https://api.knock.app`), a custom `fetch`, and `fetchOptions` ([client.ts](https://github.com/knocklabs/knock-node/blob/058160174b/src/client.ts), [README §Customizing the fetch client](https://github.com/knocklabs/knock-node/blob/058160174b/README.md)).

**Recipient identity and feed auth.**
- **Basic auth:** the client sends a public API key plus a `userId`.
- **Enhanced security mode:** production should enable it. In that mode every client request must also carry a **signed user token (JWT)** ([security-and-authentication.mdx](https://github.com/knocklabs/docs/blob/9cd144fb92/content/in-app-ui/security-and-authentication.mdx)).
- **Signing:** `signUserToken(userId, { expiresInSeconds })` in `@knocklabs/node` signs **RS256 locally** with `KNOCK_SIGNING_KEY`, with no API call. Tokens default to a 1-hour expiry ([tokenSigner.ts](https://github.com/knocklabs/knock-node/blob/058160174b/src/lib/tokenSigner.ts)).
- **Refresh:** `KnockProvider` takes `userId`, `userToken` and `onUserTokenExpiring` ([KnockProvider.tsx](https://github.com/knocklabs/javascript/blob/a0237b90f7/packages/react-core/src/modules/core/context/KnockProvider.tsx)).
- **Fit with DevUI:** mint the token in `layout.app.tsx`'s loader and pass `userId` and `userToken` down. A user switch reloads the loader, which yields a new pair.

**Preferences.**
- **Model:** a preference model with environment and tenant defaults that merge with user overrides ([preferences.mdx](https://github.com/knocklabs/docs/blob/9cd144fb92/content/in-app-ui/react/preferences.mdx)).
- **React:** exports a `usePreferences` hook ([react/src/index.ts](https://github.com/knocklabs/javascript/blob/a0237b90f7/packages/react/src/index.ts)), but **no prebuilt preference-center component**. The docs walk through building one ([preferences.mdx](https://github.com/knocklabs/docs/blob/9cd144fb92/content/in-app-ui/react/preferences.mdx), [headless/preferences.mdx](https://github.com/knocklabs/docs/blob/9cd144fb92/content/in-app-ui/react/headless/preferences.mdx)).

**Offline dev and tests.**
- **No local or self-hosted Knock:** no option was found in the docs.
- **Server side:** the SDK can be pointed at a stub with `baseURL` or a custom `fetch`.
- **Tokens:** signing works offline, since it is a local RS256 signature.
- **Feed:** the in-app feed needs Knock's API and realtime service, so a dev session without network shows no feed.

## Novu Cloud

**In-app feed (React).** [`@novu/react`](https://www.npmjs.com/package/@novu/react) is at 3.21.0, published 2026-11-23. It accepts React 18 or 19 as a peer and depends only on `@novu/js` (npm metadata).
- `<Inbox />` includes a bell, a popover, tabs and a preferences view ([inbox/](https://github.com/novuhq/docs/tree/1e4b29abaf/content/docs/platform/inbox)).
- **Styling:** goes through the `appearance` prop, which takes `baseTheme`, `variables` and per-element `elements`. **Tailwind classes can be passed in `elements`** ([styling.mdx §Using Tailwind CSS](https://github.com/novuhq/docs/blob/1e4b29abaf/content/docs/platform/inbox/configuration/styling.mdx)). The docs include a "With shadcn/ui Drawer" example ([customize-popover.mdx](https://github.com/novuhq/docs/blob/1e4b29abaf/content/docs/platform/inbox/advanced-customization/customize-popover.mdx)).
- **Headless:** a documented mode uses `useNotifications`, `useCounts` and others ([headless-mode.mdx](https://github.com/novuhq/docs/blob/1e4b29abaf/content/docs/platform/inbox/headless-mode.mdx)).

**Email in the same workflow.** Yes. Workflows combine in-app and email steps.
- **Providers:** Amazon SES, Braze, Brevo, custom SMTP, Infobip, MailerSend, Mailgun, Mailjet, Mailtrap, Mandrill, Maqsam, Netcore, Outlook 365, Plunk, Postmark, Resend, SendGrid, SparkPost and webhook ([email/(providers)/](https://github.com/novuhq/docs/tree/1e4b29abaf/content/docs/platform/integrations/email/(providers))).
- **Demo provider:** a built-in demo email provider sends 300 a month, only to your own Novu login address. It is "only available in Novu cloud", not self-hosted or local ([demo-integration.mdx](https://github.com/novuhq/docs/blob/1e4b29abaf/content/docs/platform/integrations/demo-integration.mdx)).

**Free tier.**
- **Environments:** development and production by default. Custom environments are "only available on Team and Enterprise plans" ([environments.mdx](https://github.com/novuhq/docs/blob/1e4b29abaf/content/docs/platform/developer/environments.mdx)).
- **Volume:** 10,000 workflow runs a month free, billed across all environments. Pro is from $30/month for 30,000 *(unverified: search snippet, pricing page blocked; [novu.co/pricing](https://novu.co/pricing))*.
- **MAU:** no cap was found **(unverified)**.

**Node SDK.** [`@novu/api`](https://github.com/novuhq/novu-ts/tree/06c0e70383) is at 3.21.0, generated by Speakeasy. It depends on `zod ^3.25.0 || ^4.6.6`, which is compatible with Cadence's zod 3.25 (npm metadata).
- **Triggering:** `novu.trigger({...})`, with `serverURL` and a custom `HTTPClient` fetcher available ([README](https://github.com/novuhq/novu-ts/blob/06c0e70383/README.md), [typescript.mdx](https://github.com/novuhq/docs/blob/1e4b29abaf/content/docs/platform/sdks/server/typescript.mdx)).
- **Deprecated SDK:** `@novu/node` is deprecated, and support ended on 20 March 2025 (npm deprecation notice). It shouldn't be used.

**Recipient identity and feed auth.**
- **Identity:** the Inbox takes a public `applicationIdentifier` and a `subscriberId`. Without HMAC, anyone could "guess another subscriber's `subscriberId`" and read their feed.
- **HMAC:** turning it on in the In-App integration settings requires a `subscriberHash`, computed server-side as `HMAC-SHA256(secretKey, subscriberId)` with Node's `crypto` ([prepare-for-production.mdx](https://github.com/novuhq/docs/blob/1e4b29abaf/content/docs/platform/inbox/prepare-for-production.mdx)).
- **Fit with DevUI:** the hash is deterministic, never expires and costs no API call. The `layout.app.tsx` loader can return `{ subscriberId, subscriberHash }` for whichever user DevUI selected.

**Preferences.**
- The Inbox renders global and per-workflow preferences by default. Workflows marked "critical" can't be turned off ([preferences.mdx](https://github.com/novuhq/docs/blob/1e4b29abaf/content/docs/platform/inbox/configuration/preferences.mdx)).
- For headless use there is a `usePreferences` hook ([use-preferences.mdx](https://github.com/novuhq/docs/blob/1e4b29abaf/content/docs/platform/sdks/react/hooks/use-preferences.mdx)).

**Offline dev and tests.**
- **Novu Cloud needs network.**
- **Self-hosting:** Novu is open source and can run locally with Docker Compose ([deploy-with-docker.mdx](https://github.com/novuhq/docs/blob/1e4b29abaf/content/docs/community/self-hosting-novu/deploy-with-docker.mdx)). The demo providers don't work there, so a real or SMTP email provider is needed ([demo-integration.mdx](https://github.com/novuhq/docs/blob/1e4b29abaf/content/docs/platform/integrations/demo-integration.mdx)). Running Novu locally is a full multi-service stack, which goes beyond "hosted SaaS".
- **Server side in tests:** stub through `serverURL` or the fetcher.

## Courier

**In-app feed (React).** [`@trycourier/courier-react`](https://www.npmjs.com/package/@trycourier/courier-react) is at 9.3.6, published 2026-11-25, for React 18 and up. This is "v8", which replaced the deprecated `@trycourier/react-inbox` (npm metadata).
- **Components:** `<CourierInbox />` and `<CourierInboxPopupMenu />`, with feeds and tabs. They render as a **custom element** and are client-only ([inbox/react.md](https://github.com/trycourier/courier-skills/blob/75d488863e/skills/courier/references/inbox/react.md), [CourierInbox.tsx](https://github.com/trycourier/courier-react-quickstart/blob/7fe040e6b3/src/CourierInbox.tsx)).
- **Styling:** `lightTheme` and `darkTheme` objects, plus render props such as `renderListItem` and `renderHeader` ([inbox/react.md](https://github.com/trycourier/courier-skills/blob/75d488863e/skills/courier/references/inbox/react.md)).
- **CSP:** the components inject `<style>` elements, so they need `style-src 'unsafe-inline'`. There is no nonce or hash API ([inbox/rendering.md](https://github.com/trycourier/courier-skills/blob/75d488863e/skills/courier/references/inbox/rendering.md)).
- **Headless:** a custom UI on `useCourier()` has to call `registerFeeds`, `listenForUpdates` and `load` itself ([inbox/rendering.md](https://github.com/trycourier/courier-skills/blob/75d488863e/skills/courier/references/inbox/rendering.md)). The theme objects are not Tailwind classes, so a shadcn look comes from render props or going headless.

**Email in the same workflow.** Yes. One send or template routes to email, inbox and other channels ([SKILL.md](https://github.com/trycourier/courier-skills/blob/75d488863e/skills/courier/SKILL.md)).
- **Providers:** you connect your own provider accounts, such as SendGrid, Amazon SES, Mailgun or SMTP. The catalog is fetched from `/providers/catalog` ([providers.md](https://github.com/trycourier/courier-skills/blob/75d488863e/skills/courier/references/guides/providers.md), [channels/email.md](https://github.com/trycourier/courier-skills/blob/75d488863e/skills/courier/references/channels/email.md)).
- **Built-in options:** the inbox provider comes preinstalled in Production and Test. Email works without setup only with a **Test** key, and only to your sign-up address ([quickstart.md](https://github.com/trycourier/courier-skills/blob/75d488863e/skills/courier/references/guides/quickstart.md)).
- **The full provider list was not verified**, because the integrations page was blocked.

**Free tier.**
- **Volume cap:** first-party Courier material names "the Developer plan's cap of 10,000 sends per period". Sends over the cap are `THROTTLED` and not queued ([reliability.md](https://github.com/trycourier/courier-skills/blob/75d488863e/skills/courier/references/guides/reliability.md)).
- **"Per period" means a month** *(unverified: search snippet, pricing page blocked; [courier.com/pricing](https://www.courier.com/pricing))*.
- **Environments:** a workspace has Production, Test and custom environments ([quickstart.md](https://github.com/trycourier/courier-skills/blob/75d488863e/skills/courier/references/guides/quickstart.md)). Whether custom environments are free **was not verified**. No MAU cap was found **(unverified)**.

**Node SDK.** [`@trycourier/courier`](https://github.com/trycourier/courier-node/tree/c05bb49521) is at 10.3.0 and needs Node 20 or later. It also runs on Deno, Bun and edge runtimes.
- **Usage:** `client.send.message(...)` and `client.auth.issueToken(...)` ([README](https://github.com/trycourier/courier-node/blob/c05bb49521/README.md)).
- **Options:** `baseURL`, a custom `fetch`, and `fetchOptions` ([client.ts](https://github.com/trycourier/courier-node/blob/c05bb49521/src/client.ts)).

**Recipient identity and feed auth.**
- **Token:** the browser signs in with a JWT that the server mints by **calling Courier's API** (`client.auth.issueToken`). It is scoped `user_id:<id> inbox:read:messages inbox:write:events`, plus `read:preferences write:preferences` if preferences are used. Always set `expires_in`, because omitting it mints a token that never expires ([quickstart README](https://github.com/trycourier/courier-react-quickstart/blob/7fe040e6b3/README.md), [server.js](https://github.com/trycourier/courier-react-quickstart/blob/7fe040e6b3/server.js)).
- **Session rules:** "Sign out on user switch. Never sign in with a token minted for another user." The SDKs don't refresh tokens themselves ([inbox/auth.md](https://github.com/trycourier/courier-skills/blob/75d488863e/skills/courier/references/inbox/auth.md), [quickstart README](https://github.com/trycourier/courier-react-quickstart/blob/7fe040e6b3/README.md)).
- **Fit with DevUI:** minting means a network round-trip in the loader on every user switch. Unlike Knock, Novu and SuprSend, the token can't be signed locally.

**Preferences.**
- **Model:** subscription topics with `OPTED_IN`, `OPTED_OUT` or `REQUIRED` defaults, enforced by Courier on send ([preferences.md](https://github.com/trycourier/courier-skills/blob/75d488863e/skills/courier/references/guides/preferences.md)).
- **UI options:** a hosted preference page, an embedded `<CourierPreferences>` component, and headless `useCourier().preferences` ([preferences.md §Embedded Preferences](https://github.com/trycourier/courier-skills/blob/75d488863e/skills/courier/references/guides/preferences.md)).

**Offline dev and tests.**
- **No local mode was found.**
- **Server side:** can be stubbed through `baseURL` or `fetch`.
- **Tokens:** issuing one needs Courier's API.

## MagicBell

**In-app feed (React).** [`@magicbell/react`](https://www.npmjs.com/package/@magicbell/react) is at 1.14.0, published 2026-07-29. The npm metadata lists no source repository, so the component source wasn't reviewed.
- **Exports:** `context-provider`, `inbox`, `floating-inbox`, `toast-container`, `user-preferences`, `inline-notification` and `styles/*.css` (npm `exports` field).
- **Styling:** import the component CSS and override its class names. Some components take `className` or `unstyled`, and the Inbox takes an `ItemComponent` ([npm README](https://www.npmjs.com/package/@magicbell/react)).
- **Headless:** `@magicbell/react` exports **no hooks**, and `@magicbell/react-headless` is **deprecated**. Its README points to `@magicbell/react` or `magicbell-js` ([npm README](https://www.npmjs.com/package/@magicbell/react-headless)). A headless feed would be built on `magicbell-js/user-client` plus `magicbell-js/realtime` ([npm exports for magicbell-js 2.0.1](https://www.npmjs.com/package/magicbell-js)).

**Email in the same workflow.**
- **Workflows:** the project API has workflows (`saveWorkflow`, `createWorkflowRun`) and broadcasts ([WorkflowsService.md](https://github.com/magicbell/magicbell-js/blob/3ceadf0331/packages/magicbell-js/docs/project-client/services/WorkflowsService.md), [BroadcastsService.md](https://github.com/magicbell/magicbell-js/blob/3ceadf0331/packages/magicbell-js/docs/project-client/services/BroadcastsService.md)).
- **Email integrations in the SDK:** SendGrid, Amazon SES, Mailgun and SMTP. There is also a `ping_email` integration whose only setting is a URL ([IntegrationsService.md](https://github.com/magicbell/magicbell-js/blob/3ceadf0331/packages/magicbell-js/docs/project-client/services/IntegrationsService.md), [PingConfigPayload.md](https://github.com/magicbell/magicbell-js/blob/3ceadf0331/packages/magicbell-js/docs/project-client/models/PingConfigPayload.md)).
- **Not verified:** how an in-app-plus-email workflow is defined, and whether MagicBell has a built-in email sender. Both are documented only on the blocked site.

**Free tier.** A $0 "Builder" plan with 1,000 deliveries a month, counted per channel, so in-app plus email is 2. It includes 1 project and unlimited users. Startup is $249/month for 50,000 *(unverified: search snippet, pricing page blocked; [magicbell.com/pricing](https://www.magicbell.com/pricing))*. The environment model **was not verified**.

**Node SDK.** [`magicbell-js`](https://github.com/magicbell/magicbell-js/tree/3ceadf0331/packages/magicbell-js) is at 2.0.1 (npm) and is generated by liblab.
- **Clients:** `magicbell-js/project-client` for server-side calls with a project token, and `magicbell-js/user-client` for user calls ([README](https://github.com/magicbell/magicbell-js/blob/3ceadf0331/packages/magicbell-js/README.md)).
- **Base URL:** the default is `https://api.magicbell.com/v2`, and it can be changed with `baseUrl` ([environment.ts](https://github.com/magicbell/magicbell-js/blob/3ceadf0331/packages/magicbell-js/src/project-client/http/environment.ts), [types.ts](https://github.com/magicbell/magicbell-js/blob/3ceadf0331/packages/magicbell-js/src/project-client/http/types.ts)).
- **Older SDK:** the older `magicbell` package (4.5.1) also exists.

**Recipient identity and feed auth.**
- **Token:** the React provider takes a **user JWT** that "you can generate on your own server" ([npm README](https://www.npmjs.com/package/@magicbell/react)). MagicBell's own example signs `{ user_external_id, user_email, api_key }` with **HS256** using `MAGICBELL_SECRET_KEY`, with no API call ([auth.ts](https://github.com/magicbell/magicbell-js/blob/3ceadf0331/example/nextjs-webpush/src/app/auth.ts)).
- **Legacy HMAC:** the CLI changelog mentions an older `user-hmac` scheme for projects that enable HMAC ([cli CHANGELOG](https://github.com/magicbell/magicbell-js/blob/3ceadf0331/packages/cli/CHANGELOG.md)).
- **Not verified:** the authoritative auth docs at `magicbell.com/docs/api/authentication` were blocked.

**Preferences.** There is a prebuilt `UserPreferences` component that toggles channels per category ([npm README](https://www.npmjs.com/package/@magicbell/react)). It is backed by `fetchUserPreferences` and `saveUserPreferences` in the user client ([magicbell-js docs](https://github.com/magicbell/magicbell-js/tree/3ceadf0331/packages/magicbell-js/docs/user-client)).

**Offline dev and tests.** No local mode was found. Server calls can be stubbed with `baseUrl`, and token signing is local.

## SuprSend

**In-app feed (React).** [`@suprsend/react`](https://github.com/suprsend/suprsend-react-sdk/tree/8f85a8f1fe) is at 1.6.0, published 2026-11-17. It provides drop-in `Inbox` and `NotificationFeed` components and toasts.
- **Styling:** a `themeType` of light or dark, a typed `theme` object of CSS-in-JS properties, and component overrides such as `bellComponent`, `badgeComponent` and `notificationComponent` ([react-customising-feed.mdx](https://github.com/suprsend/documentation/blob/31f1cdf48b/docs/react-customising-feed.mdx)).
- **Dependencies:** it pulls in `@emotion/react`, `@emotion/styled`, `react-markdown` 6 and `react-popper` (npm metadata).
- **Headless:** [`@suprsend/react-core`](https://github.com/suprsend/suprsend-react-core/tree/4cf9ec671a) (2.5.0) offers hooks and context providers ([react-sdk-headless-feed.mdx](https://github.com/suprsend/documentation/blob/31f1cdf48b/docs/react-sdk-headless-feed.mdx)).
- **Deprecated:** `@suprsend/react-inbox` (npm metadata).

**Email in the same workflow.** Yes. Workflows are multi-channel.
- **Providers in the docs:** SendGrid, Amazon SES, Mailgun, Resend, Postmark and Mailjet ([docs.json "Email Integrations"](https://github.com/suprsend/documentation/blob/31f1cdf48b/docs.json)).
- **Sandbox workspace:** comes with preconfigured vendors. Email only goes to up to 5 verified addresses, for a **trial period** with capped usage ([workspaces.mdx](https://github.com/suprsend/documentation/blob/31f1cdf48b/docs/workspaces.mdx)).

**Free tier.**
- **Workspaces:** every account starts with three: Sandbox, Staging and Production ([workspaces.mdx](https://github.com/suprsend/documentation/blob/31f1cdf48b/docs/workspaces.mdx)).
- **Test Mode:** in Staging, it routes delivery only to designated testers ([test-mode.mdx](https://github.com/suprsend/documentation/blob/31f1cdf48b/docs/developer/test-mode.mdx)).
- **Volume:** 10,000 notifications a month free, counted per channel, with no feature gating. Essentials is $100/month for 50,000 *(unverified: search snippet, pricing page blocked; [suprsend.com/pricing](https://www.suprsend.com/pricing))*.
- **Tenants:** Enterprise, or an add-on to Business ([what-is-suprsend.mdx](https://github.com/suprsend/documentation/blob/31f1cdf48b/docs/what-is-suprsend.mdx)).

**Node SDK.** [`@suprsend/node-sdk`](https://github.com/suprsend/suprsend-node-sdk/tree/8ac5db0a30) is at 1.15.1, last published 2026-05-19.
- **Implementation:** JavaScript with a `types/index.d.ts` file. It is built on axios, so it does not use `fetch` ([package.json](https://github.com/suprsend/suprsend-node-sdk/blob/8ac5db0a30/package.json)).
- **Usage:** `new Suprsend(workspaceKey, workspaceSecret, { base_url })`, with the default `https://hub.suprsend.com/` ([index.js](https://github.com/suprsend/suprsend-node-sdk/blob/8ac5db0a30/src/index.js), [constants.js](https://github.com/suprsend/suprsend-node-sdk/blob/8ac5db0a30/src/constants.js)).

**Recipient identity and feed auth.**
- **Identity:** the client sends a public API key plus a `distinctId`.
- **Enhanced security mode:** recommended for production. It requires a **signed user JWT (ES256)** with payload `{ entity_type: "subscriber", entity_id, exp, iat }`, signed by your backend with a dashboard-generated signing key ([client-authentication.mdx](https://github.com/suprsend/documentation/blob/31f1cdf48b/docs/client-authentication.mdx)). The Node SDK has no signing helper; the docs use `jsonwebtoken`.
- **React props:** `SuprSendProvider` takes `publicApiKey`, `distinctId`, `userToken` and `refreshUserToken`. Passing `distinctId={null}` clears the user ([react-sdk README](https://github.com/suprsend/suprsend-react-sdk/blob/8f85a8f1fe/README.md)).

**Preferences.**
- **Levels:** channel, category, and channel within a category.
- **UI:** headless hooks plus example UI ([embedded-preference-centre.mdx](https://github.com/suprsend/documentation/blob/31f1cdf48b/docs/embedded-preference-centre.mdx), [preferences-react-headless.mdx](https://github.com/suprsend/documentation/blob/31f1cdf48b/docs/preferences-react-headless.mdx)).

**Offline dev and tests.**
- **Self-hosting** is Enterprise-only, under a licence ([self-hosted/introduction.mdx](https://github.com/suprsend/documentation/blob/31f1cdf48b/docs/self-hosted/introduction.mdx)).
- **Server side:** can be stubbed with `base_url` (axios, not fetch).
- **Tokens:** signing is local.

---

## Comparison

All rows were checked on 2026-11-26. *(u)* = unverified, from a search snippet because the pricing page was blocked.

| | Knock | Novu Cloud | Courier | MagicBell | SuprSend |
|---|---|---|---|---|---|
| React feed component | `@knocklabs/react` feed, popover and inbox | `@novu/react` `<Inbox/>` | `@trycourier/courier-react` `<CourierInbox/>` (custom element) | `@magicbell/react` `Inbox`, `FloatingInbox` | `@suprsend/react` `Inbox`, `NotificationFeed` |
| Headless | Yes (`useNotifications`) | Yes (`useNotifications`, `useCounts`) | Yes (`useCourier()`, manual feed lifecycle) | No hooks; build on `magicbell-js` (react-headless deprecated) | Yes (`@suprsend/react-core`) |
| Styling toward shadcn/Tailwind | CSS vars or replace CSS; `renderItem` | **Tailwind classes via `appearance.elements`**; shadcn Drawer example | Theme objects plus render props; needs `style-src 'unsafe-inline'` | Override class names; `ItemComponent` | Theme object (emotion), component overrides |
| In-app + email in one workflow | Yes | Yes | Yes | Workflows exist; details unverified | Yes |
| Email providers (examples) | SES, Postmark, Resend, SendGrid, Mailgun, SMTP and more (12) | SES, Postmark, Resend, SendGrid, Mailgun, SMTP and more (18) | BYO: SendGrid, SES, Mailgun, SMTP (full list unverified) | SendGrid, SES, Mailgun, SMTP | SendGrid, SES, Mailgun, Resend, Postmark, Mailjet |
| Built-in test email | 100/mo, account members only | 300/mo, own address only | Test env only, sign-up address only | Unverified | Sandbox: up to 5 verified addresses, trial period |
| Free volume | 10k messages/mo *(u)* | 10k workflow runs/mo *(u)* | 10k sends/period (first-party); monthly *(u)* | 1k deliveries/mo *(u)* | 10k notifications/mo *(u)* |
| MAU cap on free | None found | None found | None found | "Unlimited users" *(u)* | None found |
| Environments | Production; dev added when enabled; plan limit unverified | Dev + prod; custom envs Team/Enterprise only | Production + Test + custom (free status unverified) | 1 project *(u)* | Sandbox + Staging + Production |
| Node SDK | `@knocklabs/node` 1.41 (Stainless, fetch) | `@novu/api` 3.21 (Speakeasy, fetch, zod dep) | `@trycourier/courier` 10.3 (Stainless, fetch) | `magicbell-js` 2.0 (liblab) | `@suprsend/node-sdk` 1.15 (JS + d.ts, axios) |
| Feed auth | RS256 user JWT, **signed locally** by SDK helper | **HMAC-SHA256** of subscriberId, local, no expiry | JWT **minted via Courier API** call | HS256 user JWT, signed locally (from example) | ES256 user JWT, signed locally (DIY with `jsonwebtoken`) |
| User preferences | Yes; `usePreferences` hook, no prebuilt UI | Yes; built into `<Inbox/>` plus hook | Yes; `<CourierPreferences/>`, hosted page, hooks | Yes; `UserPreferences` component | Yes; headless hooks plus example UI |
| Offline dev/tests | Stub via `baseURL`/`fetch`; feed needs network | Stub via `serverURL`/fetcher; open-source self-host via Docker | Stub via `baseURL`/`fetch`; token issue needs network | Stub via `baseUrl` | Stub via `base_url`; self-host Enterprise-only |

## What this means for picking a provider

These are facts to weigh, not a recommendation.

- **None of them runs fully offline as hosted SaaS.** All five Node SDKs accept a base-URL override, and four of them also accept a custom fetch or HTTP client. Server-side triggers can therefore be stubbed in Vitest. Whichever provider is picked, Cadence will likely want its own thin notification module that tests can replace. The in-app feed always needs the vendor's API and realtime service in a browser session. Only Novu has an open-source stack that can run locally, and that is a heavier, separate deployment.
- **The DevUI user switch maps most simply onto locally computed credentials.** These are Novu's HMAC (deterministic, no expiry), Knock's `signUserToken`, SuprSend's ES256 JWT and MagicBell's HS256 JWT. Courier needs an API call per user to mint a token, and an explicit sign-out and sign-in on each switch.
- **Matching shadcn/Tailwind** is most direct with Novu, which accepts Tailwind classes in `appearance.elements` and documents a shadcn Drawer example. Every other option needs CSS overrides, theme objects, or a headless build. Knock, Novu, Courier and SuprSend all document headless React hooks. MagicBell no longer has a supported headless React package. Knock's and SuprSend's prebuilt UIs bring their own design-system and emotion dependencies.
- **Free-tier volume:** Knock, Novu, Courier and SuprSend cluster around 10k a month, but these figures are unverified. MagicBell's reported 1k deliveries counts in-app and email separately. The vendors also count differently: messages per channel, workflow runs, sends, or deliveries. "10k" therefore doesn't mean the same thing for each.
- **Environments:** SuprSend (three workspaces) and Novu (dev plus prod) give a separate non-production environment by default. With Knock, dev must be enabled first. Courier has a Test environment. Whether extra environments are free, and every pricing figure above, must be confirmed on the pricing pages before the grilling ticket decides.
- **Preferences UI out of the box:** Novu (inside `<Inbox/>`), Courier (`<CourierPreferences/>`) and MagicBell (`UserPreferences`) ship one. Knock and SuprSend lean on hooks and example code.
