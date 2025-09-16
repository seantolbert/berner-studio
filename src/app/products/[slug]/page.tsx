"use client";

import { useParams } from "next/navigation";
import { useProductDetail } from "@/app/products/hooks/useProductDetail";
import { ProductPageShell } from "@/app/products/components/ProductPageShell";

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const slugParam = Array.isArray(params?.slug) ? params?.slug[0] : params?.slug ?? null;
  const { loading, product, variants, images, template } = useProductDetail(slugParam);

  return (
    <ProductPageShell
      loading={loading}
      product={product}
      variants={variants}
      images={images}
      template={template}
    />
  );
}
