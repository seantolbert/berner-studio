"use client";

import { useEffect, useState } from "react";
import { fetchProductDetail } from "@/services/productsClient";
import type {
  ProductCore,
  ProductImage,
  ProductTemplateDetail,
  ProductVariant,
} from "@/types/product";

type ProductDetailState = {
  product: ProductCore | null;
  variants: ProductVariant[];
  images: ProductImage[];
  template: ProductTemplateDetail | null;
};

const initialState: ProductDetailState = {
  product: null,
  variants: [],
  images: [],
  template: null,
};

export function useProductDetail(slug: string | null) {
  const [loading, setLoading] = useState(true);
  const [{ product, variants, images, template }, setState] = useState<ProductDetailState>(
    initialState
  );

  useEffect(() => {
    let active = true;

    if (!slug) {
      setState(initialState);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    fetchProductDetail(slug)
      .then((detail) => {
        if (!active) return;
        if (!detail) {
          setState(initialState);
          return;
        }
        setState({
          product: detail.product,
          variants: detail.variants,
          images: detail.images,
          template: detail.template,
        });
      })
      .catch(() => {
        if (!active) return;
        setState(initialState);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  return { loading, product, variants, images, template };
}

