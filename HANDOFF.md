# Handoff

**This file is rewritten, never appended.** Git is the history; this is only the
present. A stale line here is a wrong line — delete it rather than leaving it.

Rules and conventions live in `AGENTS.md` and don't belong here. This file is
only what's true right now.

_Last rewritten: 2026-09-09, on the `in_house_qa_round_1` branch._

---

## Start here

**The build is done.** Sanity migration phases 0–7, Studio polish, the editable
SEO layer, editor-managed redirects, the publish webhook and GTM are all merged
to `master` (through PR #50, `d41c5cf`). Every word a reader sees comes from
Sanity apart from the chrome `AGENTS.md` lists.

**This branch is in-house QA, round one.** Three commits, **not yet pushed** —
there is no `origin/in_house_qa_round_1`:

| | |
|---|---|
| `ed75f49` | a real favicon, and Astro's rocket removed |
| `0565a1b` | the portrait collapsing on mobile Safari |
| `1b7f8e1` | the chips overflowing `/about-us/` |

Build green at 95 pages. `npx sanity documents validate` — 0 errors, 20
warnings, which is the long-standing baseline (all SEO meta-description
lengths). 199 documents, up from 145: the redirect collection has grown to 53.

**One item on this branch is unverified.** The Safari fix was reasoned from the
CSS and proved a no-op in Chrome, but this machine has no full Xcode, so there
is no iOS Simulator and the repo's headless driver is Chrome. **Nobody has seen
it work on a real device.** Confirm before merging.

---

## What is left before launch

**One blocker, and it is the same one it has been for weeks.**

1. **The lead form has no endpoint.** `src/scripts/lead-form.ts` cancels
   submission and confirms inline, so no enquiry reaches the firm. This is now
   worse than it sounds: `/thank-you/` explicitly promises "someone from the
   firm will be in touch", so the site makes a commitment it cannot keep. It
   needs a decision on where enquiries go — an email service, a form endpoint,
   or straight into MyCase — before it can be built.

**Then the launch-day sequence, in this order:**

2. **Turn the crawl switch OFF** — Studio → Site Settings → Global SEO Settings
   → Defaults. It is currently **ON**, which is correct while the site is on
   `the-dieye-firm.vercel.app`: `robots.txt` is `Disallow: /` and all 93 pages
   carry `noindex`. Leaving it on after cutover means the site never appears in
   search at all.
3. **Confirm `www` is the PRIMARY host in Vercel**, apex redirecting to it.
   Every canonical says `www`; if the apex is primary instead, all 92 canonicals
   point at a redirect.
4. **Submit `https://www.dieyelaw.com/sitemap.xml`** in Search Console, after 2.
5. **Confirm the plan includes Bulk Redirects.** Without it `bulkRedirectsPath`
   is silently never read and the 53 redirects do nothing. The failure is quiet.
6. **Confirm the publish webhook is enabled.** It exists ("Vercel deploy",
   production, drafts off) and production has been rebuilding on its own, so it
   appears live — but Rhan disabled it at one point during QA and the CLI does
   not print the enabled flag. Check the toggle in the Sanity dashboard.

Already done, no action: the 1200×630 default share image is uploaded, and the
crawl switch is on.

---

## What this branch changed

### A real favicon — and the site had been shipping Astro's

`public/favicon.svg` was the scaffold's default, Astro's rocket, and
`Layout.astro` declared it **first**, so modern browsers preferred it over the
`.ico`. The firm's tab has shown Astro's branding since 20 July.

`public/favicon.ico` is now a 3-size ICO (16/32/48) built from a 48px source
Rhan supplied. It is **cropped to the mark** rather than scaled from the padded
square: the bird filled 43×38 of its 48px canvas, and that padding is the
difference between a bird and a smudge at 16px. `favicon.svg` is deleted, not
replaced — there is no vector of the bird in the repo, and a wrong SVG that wins
the cascade is worse than none.

**Known gap:** no `apple-touch-icon` (iOS wants 180×180; upscaling from 48
would be visibly soft) and no SVG favicon, so no dark-mode adaptation. Both are
a ten-minute job **if the firm ever supplies the logo artwork** — AI, EPS, PDF
or SVG. Worth asking for; it exists somewhere and nobody thinks to hand it over.

### The portrait collapsing on mobile Safari

`.meet__media` has NO in-flow content — the photo and the rating card are both
absolutely positioned — so at mobile its height came entirely from
`aspect-ratio: 1`. The base rule also sets `align-self: stretch`, never
overridden, so the box was a stretch-aligned grid item asking an aspect ratio
for its height. WebKit resolves the height from the stretch there and ignores
the ratio; the row auto-sizes from in-flow content, of which there is none, so
the row is 0 and the photo — `inset: 0` in a zero-height box — disappears.
`min-height: 0` removed the only floor that had been hiding it.

Fixed by removing the dependency, not the symptom: at mobile the photo comes
back **into flow** and carries the ratio itself. A replaced element with an
intrinsic ratio is the one thing every engine sizes the same way.

### The chips overflowing `/about-us/`

19px of horizontal overflow at 1001px. **It was not the carousels** — those only
appeared in the first probe because they sit off-canvas on every page. The chain
ran `.meet__grid` → `.meet__body` → `.meet__chips` → `li.chip`, where the chip
box was 69px and its content needed 118.

`.meet__chips` was a hard three-column grid down to 700px, and the body column
is squeezed hardest at the narrow end of the two-column desktop layout: at
1001px the portrait takes a rigid 620 of the 921 container, leaving 245 for the
text. A chip spends 40px on its icon, 13 on the gap and 36 on padding before any
text.

**The visible overflow was the tail of a wider problem.** Measured against their
own `scrollWidth`, the chips were already spilling from ~1160px down; the
document only began scrolling at ≤1080 because slack absorbed it above that.

Now stacked at ≤1350px — Rhan's call, one predictable breakpoint rather than an
`auto-fit` track, replacing the old 700px rule. **Consequence to know:** chips
also stack in the 700–1000px band now, where they previously sat three across
without overflowing.

---

## Open questions for Rhan

1. **Confirm the Safari fix on a real device.** See above.
2. **Do the chips look right stacked on tablet (700–1000px)?** That band changed
   as a side effect of the ≤1350 rule. A second breakpoint restores three across
   if not.
3. **Where should lead-form enquiries go?** Blocks the last real feature.

---

## Things that would surprise you

Everything here has cost time at least once.

- **`/about-us/` is the only page with a component nobody else uses**
  (`MeetPapa`), which is why two of this round's three bugs were on it and
  nowhere else. When a bug is one-page-only, check what that page renders alone.
- **The standard check list has a blind spot above 1000px.** It is
  1920/1441/1440/1439/1000/768/430, and the chips bug lived at 1001–1080 — in
  the gap. If a row's width is set by its contents, test just above 1000 too.
- **A Vercel log ending in "Build Completed" has not necessarily deployed.**
  Read past it to `Deploying outputs…`, or check
  `npx vercel ls the-dieye-firm --scope elite-legal-marketing`. The project is
  under the **elite-legal-marketing** scope, not the personal one. Reading the
  log tail instead of the deployment status cost ~45 minutes of red production.
- **An EMPTY bulk redirects file is a FATAL DEPLOY ERROR** that looks like a
  green build. `bulk-redirects.json.ts` emits an inert placeholder so the case
  cannot arise. **Don't "tidy up" that placeholder.**
- **Preview deploys sit behind Deployment Protection**, so unauthenticated
  `curl` returns a Vercel SSO redirect for every path. That reads as a failure
  and is not one.
- **The live site 403s everything that is not a real browser.** Its favicon was
  only reachable through the in-app browser; `curl`, the mirror and the repo's
  headless Chrome (Cloudflare shows it "Just a moment…") all failed. The mirror
  has no `.ico` at all, because browsers request `/favicon.ico` implicitly
  rather than following a link.
- **There is no iOS Simulator on this machine.** Xcode command-line tools only.
  WebKit bugs cannot be reproduced here. Fixing that needs Xcode from the App
  Store, then
  `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.
- **One publish is one build — there is no debounce.** A bulk import fires one
  deploy per document. Delete the webhook before seeding anything and recreate
  it after.
- **A field the schema does not declare is DELETED when an editor saves that
  document.**
- **`npm run build` never sees a draft.** Only `npx sanity documents validate`
  does.
- **A running dev server NEVER sees a Sanity content edit** — the helpers
  memoise into a module-level promise. Check `dist/`, not `:4321`.
- **`npm run build` cannot catch a Studio dependency break.** Vite's
  dep-pre-bundle is dev-only, so a Sanity upgrade can leave `/admin` broken with
  a green build. `@sanity/orderable-document-list` is pinned exactly at 2.0.12
  with an `overrides` entry holding `sanity-plugin-utils` at 2.0.10 — that pin
  is load-bearing for the four drag-ordered collections.
- **`sanity` is on 6.5.0 and 6.7.0 is available.** Deliberately not taken:
  nothing needs it, and the break it could cause is invisible to the build. Do
  it after launch, on its own branch, and open `/admin` by hand to check the
  drag-ordered lists still drag.
- **`npm run check:prose-styles` reports `passed: 0` if run bare** — it probes
  `/`, where the practice-area FAQ selectors do not exist. Give it a `--url`.
- **A GROQ `count(*[...].field[])` over-counts**: documents without the field
  each contribute a `null`. Sum per-document counts instead.
- **`/sitemap/` is the HTML index for humans; `/sitemap.xml` is the machine
  one**, and the live site's own is at `/site-map/` — a third spelling.

---

## What is in Sanity

**Thirty document types** — 14 page singletons, eight collections, eight Site
Settings records — plus five object types: `navLink`, `seo`, `blockContent`,
`aboutBody`, `paragraphRun`.

| | |
|---|---|
| Pages | `homePage` · `aboutPage` · `practiceAreasPage` · `blogPage` · `testimonialsPage` · `contactPage` · `faqPage` · `videoCenterPage` · `hiringGuidePage` · `clientPortalPage` · `privacyPolicyPage` · `sitemapPage` · `thankYouPage` · `notFoundPage` |
| Collections | `practiceArea` 32 · `locationPage` 32 · `blogPost` 16 · `testimonial` 14 · `video` 9 · `faq` 9 · `award` 7 · `redirect` 53 |
| Site Settings | `firmDetails` · `navigation` · `attorney` · `consultForm` · `caseEvaluationForm` · `whatDrivesUs` · `awardsBand` · `testimonialsBand` · `statsBand` · `globalSeo` |

Four collections are drag-ordered: `testimonial`, `award`, `faq`, `video`.
`redirect` is deliberately NOT create-guarded — editors must be able to add one.

**All 14 testimonials are written**; the video testimonial was deleted, so the
stock-portrait problem is gone with it.

---

## Known issues, not blocking

- Nine FAQ questions are `<summary>` text, not headings, so a screen reader
  navigating by heading skips all nine.
- The office map is a bare Google embed on 92 pages, loading at parse time and
  setting third-party cookies sitewide.
- Ten pages skip a heading level (h1 → h3): eight practice areas, one location
  page, and `/contact-us/`. The last is ours and is the one to fix by hand.
- The privacy policy mentions cookies and Google but not analytics, tracking or
  third parties — worth a look now GTM is live. The wording is the firm's.
- `WhatDrivesUs` reflows on font swap — a 30px shift on eight pages.
- No location page carries an image.
- The `/practice-areas/` hero is 1247×741, so it upscales ~1.5× at 1920.
- `modifications-enforcement` is 290 words, the thinnest practice area and the
  only one where the sidebar overhangs the article.
- The source FAQ headings on the practice-area pages are more specific than the
  rendered one. A `faqsHeading` field would fix it.
- Seven pages besides the homepage carry no business schema. Giving the existing
  `LegalService` emitters the same `@id` as `lib/schema.ts` builds is the seam
  that would make a sitewide emit safe.

---

## Still with the firm

- `VideoObject` markup needs upload dates and a one-line description per video.
- `/client-portal/` copy in full, plus the `/sitemap/` and `/faq/` kickers and
  decks, are ours with no comp behind them.
- The MyCase subdomain split — `dieylaw` vs `dieyelaw` — was checked and looks
  fine, but has never been confirmed by the firm.
