import { calculateBoardPrice } from "@features/board-builder/lib/pricing";
import { DEFAULT_CURRENCY } from "@/lib/env";
import type {
  ProductCore,
  ProductTemplateDetail,
  ProductVariant,
} from "@/types/product";

type ProductStructuredDataProps = {
  product: ProductCore;
  template: ProductTemplateDetail | null;
  variants: ProductVariant[];
};

function resolvePriceCents({
  product,
  template,
  variants,
}: ProductStructuredDataProps): number {
  if (product.category === "boards" && template) {
    const { base, variable, extrasThirdStrip = 0 } = calculateBoardPrice({
      size: template.size,
      strips: template.layout.strips,
      strip3Enabled: template.strip3Enabled,
    });
    return Math.round((base + variable + extrasThirdStrip) * 100);
  }

  if (product.category === "apparel" && variants.length > 0) {
    const firstVariant = variants[0];
    if (
      firstVariant &&
      typeof firstVariant.price_cents_override === "number"
    ) {
      return firstVariant.price_cents_override;
    }
  }

  return product.price_cents;
}

export default function ProductStructuredData({
  product,
  template,
  variants,
}: ProductStructuredDataProps) {
  const priceCents = resolvePriceCents({ product, template, variants });
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const productUrl = siteUrl ? `${siteUrl}/products/${product.slug}` : `/products/${product.slug}`;
  const primaryImage = product.primary_image_url
    ? product.primary_image_url.startsWith("http")
      ? product.primary_image_url
      : `${siteUrl}${product.primary_image_url}`
    : siteUrl
    ? `${siteUrl}/og.svg`
    : "/og.svg";

  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_desc || product.long_desc || "",
    image: [primaryImage],
    brand: { "@type": "Brand", name: "Berner Studio" },
    url: productUrl,
    offers: {
      "@type": "Offer",
      priceCurrency: DEFAULT_CURRENCY.toUpperCase(),
      price: (priceCents / 100).toFixed(2),
      availability: "http://schema.org/InStock",
      url: productUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
