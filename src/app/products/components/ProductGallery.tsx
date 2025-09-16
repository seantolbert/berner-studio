"use client";

import type { ProductImage } from "@/types/product";

type ProductGalleryProps = {
  primary: ProductImage | null;
  fallbackImage?: string | null;
  productName: string;
  gallery: ProductImage[];
  onSelectImage: (image: ProductImage) => void;
};

export function ProductGallery({ primary, fallbackImage, productName, gallery, onSelectImage }: ProductGalleryProps) {
  const display = primary ?? (fallbackImage ? { id: "fallback", url: fallbackImage, alt: productName, color: null } : null);

  return (
    <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
      <div className="w-full aspect-[4/3] bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 flex items-center justify-center text-sm opacity-70">
        {display ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={display.url} alt={display.alt || productName} className="w-full h-full object-cover" />
        ) : (
          <span>Image coming soon</span>
        )}
      </div>
      {gallery.length > 1 && (
        <div className="p-3 grid grid-cols-4 gap-2">
          {gallery.map((image) => (
            <button
              key={image.id}
              type="button"
              className="relative h-20 rounded-md border border-black/10 dark:border-white/10 overflow-hidden"
              onClick={() => onSelectImage(image)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={image.alt || productName} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
