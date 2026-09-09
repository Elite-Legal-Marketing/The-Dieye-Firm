import { sanityClient } from "sanity:client";
import { defineQuery } from "groq";

/* Frontend accessor for the Firm Details singleton. The schema for that
 * document lives in ./schemaTypes/firmDetails.ts — this file is the read side:
 * one query, one memoised fetch, and the derivations that Sanity deliberately
 * does not store (URI schemes, the one-line address, social icon paths).
 *
 * Replaces the old src/data/site.ts. Component imports look almost the same,
 * except the values now arrive through `await getFirmDetails()`.
 */

const FIRM_DETAILS_QUERY = defineQuery(`*[_id == "firmDetails"][0]{
  firmName,
  tagline,
  phone,
  email,
  address,
  hours[]{ _key, days, time },
  socials[]{ _key, platform, url }
}`);

/* Iconography is presentation, so it stays in code rather than in the document.
   Editors pick a platform in the Studio; the glyph is looked up here. Paths are
   24x24 viewBox, matching the inline <svg> in InfoBar and Footer. */
const SOCIAL_ICONS: Record<string, { label: string; path: string }> = {
  facebook: {
    label: "Facebook",
    path: "M15.12 5.32H17V2.14A26.11 26.11 0 0 0 14.26 2c-2.72 0-4.58 1.66-4.58 4.7v2.6H6.61v3.56h3.07V22h3.68v-9.14h3.06l.46-3.56h-3.52V7.05c0-1.03.28-1.73 1.76-1.73z",
  },
  instagram: {
    label: "Instagram",
    path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.06 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.42.36 1.06.42 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.06 1.17-.25 1.8-.42 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.17-1.06.36-2.23.42-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.06-1.8-.25-2.23-.42-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.17-.42-.36-1.06-.42-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.06-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.17 1.06-.36 2.23-.42C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38C1.35 2.68.93 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13.67.66 1.34 1.08 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.13-1.38.66-.67 1.08-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.13-.67-.66-1.34-1.08-2.13-1.38-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4zm6.41-10.4a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z",
  },
  linkedin: {
    label: "LinkedIn",
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.59 0 4.25 2.36 4.25 5.44v6.3zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z",
  },
  x: {
    label: "X",
    path: "M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3L17.61 20.65z",
  },
  youtube: {
    label: "YouTube",
    path: "M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81z",
  },
};

/* The firm's Google Business Profile id. It lives here rather than in the
   singleton for the same reason the `tel:` scheme and the social icon paths
   do: it is a fixed identifier the editor never types, not a fact they
   maintain. It should become a real field in the Sanity sweep, so a new office
   doesn't need a deploy — noted in HANDOFF.md. */
const GOOGLE_MAPS_CID = "16743639105954315447";

export type NavLink = { _key?: string; label: string; href: string };

export type FirmDetails = {
  firmName: string;
  tagline: string;
  phone: { display: string; href: string };
  email: { display: string; href: string };
  address: {
    street: string;
    locality: string;
    region: string;
    postalCode: string;
    oneLine: string;
    mapEmbed: string;
    mapLink: string;
  };
  hours: { _key: string; days: string; time: string }[];
  socials: { _key: string; label: string; href: string; path: string }[];
};

/* One fetch per build, not one per component. Fifteen call sites read this
   document; without the cache a static build would query Sanity many times over
   for every page that renders the header and footer.
 *
 * The PROD guard is load-bearing and was added after this cost two sessions.
 * Nothing invalidates a module-level promise for the life of the process, so a
 * dev server that started before a Studio edit serves the document it fetched at
 * boot — forever. HMR still picks up code changes, so the server looks live and
 * current while quietly serving stale content, and every symptom points at the
 * edit having failed: the Studio shows the new value, the CLI shows the new
 * value, dist/ shows the new value, and localhost:4321 does not.
 *
 * Caching the PROMISE rather than the value is the other half of it: components
 * render concurrently, so caching the resolved value would let several fetches
 * start before any of them returned.
 *
 * Every fetch helper added in the Sanity migration takes this same shape. */
let cached: Promise<FirmDetails> | undefined;

export function getFirmDetails(): Promise<FirmDetails> {
  if (!import.meta.env.PROD) return fetchFirmDetails();
  cached ??= fetchFirmDetails();
  return cached;
}

async function fetchFirmDetails(): Promise<FirmDetails> {
  const doc = await sanityClient.fetch(FIRM_DETAILS_QUERY);

  if (!doc) {
    throw new Error(
      'No "firmDetails" document found in Sanity. The header, footer and ' +
        "contact section all read from it — open /admin → Firm Details and " +
        "publish it before building."
    );
  }

  const address = doc.address ?? {};
  const oneLine = `${address.street}, ${address.locality}, ${address.region} ${address.postalCode}`;

  return {
    firmName: doc.firmName,
    tagline: doc.tagline,
    phone: {
      display: doc.phone,
      /* The schema validates 10 digits, so a US +1 prefix is safe here. */
      href: `tel:+1${String(doc.phone ?? "").replace(/\D/g, "")}`,
    },
    email: {
      display: doc.email,
      href: `mailto:${doc.email}`,
    },
    address: {
      street: address.street,
      locality: address.locality,
      region: address.region,
      postalCode: address.postalCode,
      oneLine,
      /* Takes no API key, which keeps this buildable without credentials.

         An address query drops a generic red pin; a CID resolves the firm's
         own Business Profile, so the pin carries the name, logo and hours.
         Google 301s this straight to /maps/embed?pb=…!4s<CID>, its official
         place-embed endpoint - still no API key.

         The CID is the last digits of the listing's share URL, after
         `!1s<feature>:` and in hex: .../data=!4m6!3m5!1s0x…:0xe85d5b0e25befcb7
         → 0xe85d5b0e25befcb7 → 16743639105954315447. */
      mapEmbed: `https://maps.google.com/maps?cid=${GOOGLE_MAPS_CID}&output=embed`,
      /* Same listing, opened rather than embedded — the address in the contact
         card links here. On a phone this hands off to the Maps app, which is
         the whole point: the next thing someone wants after reading an address
         is directions to it. */
      mapLink: `https://maps.google.com/?cid=${GOOGLE_MAPS_CID}`,
    },
    hours: doc.hours ?? [],
    /* A platform with no glyph in SOCIAL_ICONS is dropped rather than rendered
       as an empty <svg>. */
    socials: (doc.socials ?? []).flatMap((social: any) => {
      const icon = SOCIAL_ICONS[social.platform];
      if (!icon) return [];
      return [
        {
          _key: social._key,
          label: icon.label,
          href: social.url,
          path: icon.path,
        },
      ];
    }),
  };
}
