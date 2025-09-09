"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { estimateProductETA } from "@/lib/leadtime";
import { formatCurrencyCents } from "@/lib/money";
import { DEFAULT_CURRENCY } from "@/lib/env";

type DBProduct = { id: string; slug: string; name: string; price_cents: number; category: string; status: string; primary_image_url: string | null; short_desc: string | null; long_desc: string | null };
type Variant = { id: string; color: string; size: string; sku: string | null; price_cents_override: number | null; status: "draft" | "published" };
type ProdImage = { id: string; url: string; alt: string | null; color: string | null };

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<DBProduct | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [images, setImages] = useState<ProdImage[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const slug = params?.slug as string;
        const { data: prod } = await supabase
          .from("products")
          .select("id,slug,name,price_cents,category,status,primary_image_url,short_desc,long_desc,deleted_at")
          .eq("slug", slug)
          .eq("status", "published")
          .is("deleted_at", null)
          .maybeSingle();
        if (!prod) { if (!aborted) setProduct(null); return; }
        if (aborted) return;
        setProduct({ id: prod.id, slug: prod.slug, name: prod.name, price_cents: prod.price_cents, category: prod.category, status: prod.status, primary_image_url: prod.primary_image_url, short_desc: prod.short_desc, long_desc: prod.long_desc });
        const { data: imgs } = await supabase
          .from("product_images")
          .select("id,url,alt,color")
          .eq("product_id", prod.id)
          .order("position", { ascending: true })
          .order("created_at", { ascending: true });
        if (!aborted) setImages((imgs || []) as any);
        const { data: vars } = await supabase
          .from("product_variants")
          .select("id,color,size,sku,price_cents_override,status")
          .eq("product_id", prod.id)
          .eq("status", "published")
          .order("color", { ascending: true })
          .order("size", { ascending: true });
        if (!aborted) setVariants((vars || []) as any);
        if (!aborted && (prod.category === 'apparel') && vars && vars.length) {
          const c = vars[0].color;
          const s = vars.find(v => v.color === c)?.size || null;
          setSelectedColor(c);
          setSelectedSize(s);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = false; };
  }, [params?.slug]);

  const colorOptions = useMemo(() => Array.from(new Set(variants.map(v => v.color))), [variants]);
  const sizeOptions = useMemo(() => (selectedColor ? variants.filter(v => v.color === selectedColor).map(v => v.size) : []), [variants, selectedColor]);
  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null;
    return variants.find(v => v.color === selectedColor && v.size === selectedSize) || null;
  }, [variants, selectedColor, selectedSize]);

  const gallery = useMemo(() => {
    const byColor = selectedColor ? images.filter(im => (im.color || '').toLowerCase() === selectedColor.toLowerCase()) : [];
    return byColor.length ? byColor : images;
  }, [images, selectedColor]);

  const displayPrice = selectedVariant?.price_cents_override != null ? selectedVariant!.price_cents_override! : (product?.price_cents || 0);

  const addToCart = () => {
    if (!product) return;
    if (product.category === 'apparel' && (!selectedVariant || !selectedColor || !selectedSize)) return;
    try {
      const raw = localStorage.getItem("bs_cart");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      const id = `prod-${product.slug}-${Date.now()}`;
      const lineName = product.category === 'apparel' && selectedVariant ? `${product.name} – ${selectedColor}/${selectedSize}` : product.name;
      const line = {
        id,
        name: lineName,
        unitPrice: displayPrice,
        quantity: 1,
        product: { slug: product.slug },
        variant: selectedVariant ? { id: selectedVariant.id, color: selectedColor, size: selectedSize } : null,
      };
      const next = Array.isArray(arr) ? [...arr, line] : [line];
      localStorage.setItem("bs_cart", JSON.stringify(next));
      setAdded(true);
    } catch {}
  };

  if (loading) {
    return (
      <main className="min-h-screen w-full p-6 flex items-center justify-center">
        <div className="text-sm opacity-70">Loading…</div>
      </main>
    );
  }
  if (!product) {
    return (
      <main className="min-h-screen w-full p-6 flex items-center justify-center">
        <div className="text-sm opacity-70">Product not found.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full p-6">
      <ProductJsonLd product={{ slug: product.slug, name: product.name, description: product.short_desc || product.long_desc || '', priceCents: displayPrice, image: product.primary_image_url || undefined }} />
      <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2 items-start">
        <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
          <div className="w-full aspect-[4/3] bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 flex items-center justify-center text-sm opacity-70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {gallery.length > 0 ? (
              <img src={gallery[0].url} alt={gallery[0].alt || product.name} className="w-full h-full object-cover" />
            ) : product.primary_image_url ? (
              <img src={product.primary_image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span>Image coming soon</span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2 p-2">
              {gallery.slice(0,8).map((im) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={im.id} src={im.url} alt={im.alt || ''} className="h-16 w-full object-cover rounded border border-black/10 dark:border-white/10" />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <div className="text-lg font-medium mt-1">{formatCurrencyCents(displayPrice)}</div>
            <div className="text-xs opacity-70 mt-1">{estimateProductETA().label}</div>
          </div>
          {product.short_desc && <p className="text-sm opacity-80">{product.short_desc}</p>}

          {product.category === 'apparel' && variants.length > 0 && (
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium mb-1">Color</div>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setSelectedColor(c); const s = variants.find(v=>v.color===c)?.size || null; setSelectedSize(s); }}
                      className={`h-9 px-3 rounded-md border text-sm ${selectedColor===c? 'border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'border-black/10 dark:border-white/10'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              {selectedColor && (
                <div>
                  <div className="text-sm font-medium mb-1">Size</div>
                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`h-9 px-3 rounded-md border text-sm ${selectedSize===s? 'border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'border-black/10 dark:border-white/10'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={addToCart}
              className="inline-flex h-10 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              disabled={product.category==='apparel' && (!selectedColor || !selectedSize)}
            >
              Add to cart
            </button>
            <button
              type="button"
              onClick={() => router.push("/cart")}
              className="inline-flex h-10 px-4 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
            >
              Go to cart
            </button>
          </div>
          {added && (
            <div className="text-xs opacity-70">Added to cart.</div>
          )}
        </div>
      </div>
    </main>
  );
}

function ProductJsonLd({ product }: { product: { slug: string; name: string; description: string; priceCents: number; image?: string } }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const base = (siteUrl || "").replace(/\/$/, "");
  const url = base ? `${base}/products/${product.slug}` : `/products/${product.slug}`;
  const image = product.image ? (product.image.startsWith("http") ? product.image : `${base}${product.image}`) : (base ? `${base}/og.svg` : "/og.svg");
  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [image],
    brand: { "@type": "Brand", name: "Berner Studio" },
    url,
    offers: {
      "@type": "Offer",
      priceCurrency: DEFAULT_CURRENCY.toUpperCase(),
      price: (product.priceCents / 100).toFixed(2),
      availability: "http://schema.org/InStock",
      url,
    },
  };
  return <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
