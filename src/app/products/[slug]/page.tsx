import type { Metadata } from "next";
import { ProductPageShell } from "@/app/products/components/ProductPageShell";
import { fetchProductDetailServer } from "@/services/products.server";
import ProductStructuredData from "./ProductStructuredData";

type ProductPageParams = { slug: string | string[] };

type ProductPageProps = {
  params: Promise<ProductPageParams>;
};

function normalizeSlug(slug: string | string[] | undefined): string | null {
  if (!slug) return null;
  return Array.isArray(slug) ? slug[0] ?? null : slug;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<ProductPageParams>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slugParam = normalizeSlug(resolvedParams.slug);
  if (!slugParam) {
    return {
      title: "Product not found",
    };
  }

  const detail = await fetchProductDetailServer(slugParam);
  const product = detail?.product;
  if (!product) {
    return {
      title: "Product not found",
    };
  }

  const description = product.short_desc || product.long_desc || "";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const productUrl = siteUrl ? `${siteUrl}/products/${product.slug}` : `/products/${product.slug}`;
  const imageUrl = product.primary_image_url
    ? product.primary_image_url.startsWith("http")
      ? product.primary_image_url
      : `${siteUrl}${product.primary_image_url}`
    : siteUrl
    ? `${siteUrl}/og.svg`
    : "/og.svg";

  return {
    title: `${product.name} | Berner Studio`,
    description,
    alternates: { canonical: productUrl },
    openGraph: {
      title: product.name,
      description,
      url: productUrl,
      type: "website",
      images: [
        {
          url: imageUrl,
        },
      ],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const slugParam = normalizeSlug(resolvedParams.slug);
  if (!slugParam) {
    return (
      <ProductPageShell
        loading={false}
        product={null}
        variants={[]}
        images={[]}
        template={null}
      />
    );
  }

  const detail = await fetchProductDetailServer(slugParam);

  const product = detail?.product ?? null;
  const variants = detail?.variants ?? [];
  const images = detail?.images ?? [];
  const template = detail?.template ?? null;

  return (
    <>
      {product ? (
        <ProductStructuredData product={product} template={template} variants={variants} />
      ) : null}
      <ProductPageShell
        loading={false}
        product={product}
        variants={variants}
        images={images}
        template={template}
      />
    </>
  );
}
