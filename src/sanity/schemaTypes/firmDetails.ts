import { defineType, defineField, defineArrayMember } from "sanity";
import { CogIcon } from "@sanity/icons/Cog";

/* Firm Details — the single source of truth for facts that appear in more than
 * one place: the header info bar, the main nav, the contact section and the
 * footer all read from this one document.
 *
 * A singleton. The fixed document ID is pinned in src/sanity/structure.ts, not
 * here — Sanity has no `singleton: true` schema option.
 *
 * Note what is deliberately absent: social icon paths, the `tel:` and `mailto:`
 * prefixes, and the one-line address. Those are presentation, derived in
 * src/sanity/firmDetails.ts. Editors type a phone number, not a URI scheme.
 */
export const firmDetails = defineType({
  name: "firmDetails",
  title: "Firm Details",
  type: "document",
  icon: CogIcon,
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "contact", title: "Contact" },
  ],
  fields: [
    defineField({
      name: "firmName",
      title: "Firm name",
      description: "Used in the footer copyright line and logo alt text.",
      type: "string",
      group: "identity",
      validation: (rule) =>
        rule.required().max(60).warning("Long names wrap in the footer copyright line."),
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      description:
        "One sentence, shown under the logo in the footer. The column is capped at roughly 32 characters per line, so keep it short.",
      type: "text",
      rows: 2,
      group: "identity",
      validation: (rule) =>
        rule.max(120).warning("Long taglines wrap awkwardly in the footer."),
    }),

    defineField({
      name: "phone",
      title: "Phone number",
      description:
        "As it should read on screen, for example (832) 299-1990. The click-to-call link is generated from it.",
      type: "string",
      group: "contact",
      validation: (rule) =>
        rule.required().custom((value) => {
          if (typeof value !== "string") return true;
          const digits = value.replace(/\D/g, "");
          return digits.length === 10
            ? true
            : "Enter a 10-digit US number, for example (832) 299-1990.";
        }),
    }),
    defineField({
      name: "email",
      title: "Email address",
      type: "string",
      group: "contact",
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: "address",
      title: "Office address",
      type: "object",
      group: "contact",
      options: { columns: 2 },
      fields: [
        defineField({
          name: "street",
          title: "Street and suite",
          type: "string",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "locality",
          title: "City",
          type: "string",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "region",
          title: "State",
          type: "string",
          validation: (rule) => rule.required().max(2),
        }),
        defineField({
          name: "postalCode",
          title: "ZIP code",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: "hours",
      title: "Office hours",
      description:
        "One row per block of days, in the order they should read. A day the office is closed is a row too — put “Closed” in the Hours box rather than leaving the day out, so a visitor learns it is shut rather than wondering.",
      type: "array",
      group: "contact",
      of: [
        defineArrayMember({
          type: "object",
          name: "hoursRow",
          fields: [
            defineField({
              name: "days",
              title: "Days",
              description: "For example: Monday – Friday, or Saturday",
              type: "string",
              validation: (rule) =>
                rule.required().max(30).warning("The card is narrow — keep the day range short."),
            }),
            defineField({
              name: "time",
              title: "Hours",
              description: "For example: 8:00 AM – 6:00 PM, or Closed",
              type: "string",
              validation: (rule) =>
                rule.required().max(30).warning("The card is narrow — keep the hours short."),
            }),
          ],
          preview: { select: { title: "days", subtitle: "time" } },
        }),
      ],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: "socials",
      title: "Social profiles",
      description:
        "Shown in the header info bar and the footer, in this order. The icon comes from the platform you pick.",
      type: "array",
      group: "contact",
      of: [
        defineArrayMember({
          type: "object",
          name: "socialProfile",
          fields: [
            defineField({
              name: "platform",
              title: "Platform",
              type: "string",
              options: {
                list: [
                  { title: "Facebook", value: "facebook" },
                  { title: "Instagram", value: "instagram" },
                  { title: "LinkedIn", value: "linkedin" },
                  { title: "X", value: "x" },
                  { title: "YouTube", value: "youtube" },
                ],
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "url",
              title: "Profile URL",
              type: "url",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: { title: "platform", subtitle: "url" },
          },
        }),
      ],
      validation: (rule) =>
        rule.unique().custom((items) => {
          if (!Array.isArray(items)) return true;
          const platforms = items.map(
            (item) => (item as { platform?: string })?.platform
          );
          const duplicated = platforms.filter(
            (platform, index) => platform && platforms.indexOf(platform) !== index
          );
          return duplicated.length
            ? `Each platform should appear once. Duplicated: ${[...new Set(duplicated)].join(", ")}.`
            : true;
        }),
    }),

      ],
  preview: {
    select: { title: "firmName" },
    prepare({ title }) {
      return { title: title ?? "Firm Details", subtitle: "Firm Details" };
    },
  },
});
