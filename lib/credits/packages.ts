export const CREDIT_PACKS = [
  {
    key: "starter",
    name: "Starter",
    credits: 100,
    priceCents: 100,
    description: "For occasional AI creation and experimentation.",
    featured: false,
  },
  {
    key: "creator",
    name: "Creator",
    credits: 500,
    priceCents: 500,
    description: "For regular worksheet, lesson, image, and AI work.",
    featured: true,
  },
  {
    key: "studio",
    name: "Studio",
    credits: 1200,
    priceCents: 1200,
    description: "For heavier creative workflows and frequent generation.",
    featured: false,
  },
] as const;

export type CreditPackKey = (typeof CREDIT_PACKS)[number]["key"];
export type CreditPack = (typeof CREDIT_PACKS)[number];

export function getCreditPack(
  key: string | null | undefined,
): CreditPack | null {
  if (!key) return null;

  return CREDIT_PACKS.find((pack) => pack.key === key) ?? null;
}