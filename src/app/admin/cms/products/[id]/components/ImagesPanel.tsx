"use client";

import { useCallback, useEffect, useState } from "react";

type ProductImage = {
  id: string;
  url: string;
  alt: string | null;
  is_primary: boolean;
  position: number;
  color?: string | null;
};

type ImagesPanelProps = {
  productId: string;
  slug: string;
  onPrimaryImageChange: (url: string) => void;
};

export default function ImagesPanel({ productId, slug, onPrimaryImageChange }: ImagesPanelProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadAlt, setUploadAlt] = useState("");
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const refreshImages = useCallback(async () => {
    if (!productId) return;
    setImgLoading(true);
    setImgError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/images`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load images");
      setImages(Array.isArray(data.items) ? data.items : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setImgError(message);
      setImages([]);
    } finally {
      setImgLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    refreshImages();
  }, [refreshImages]);

  const handleDeleteImage = useCallback(
    async (imageId: string) => {
      if (!confirm("Remove this image?")) return;
      setImgError(null);
      setDeletingImageId(imageId);
      try {
        const res = await fetch(`/api/admin/products/${productId}/images/${imageId}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to delete image");
        await refreshImages();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        setImgError(message);
      } finally {
        setDeletingImageId(null);
      }
    },
    [productId, refreshImages]
  );

  return (
    <div className="mt-6 rounded-lg border border-black/10 dark:border-white/10 p-4">
      <div className="text-lg font-semibold mb-3">Images</div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setUploading(true);
              setImgError(null);
              try {
                const formEl = e.currentTarget;
                const fileInput = (formEl.elements.namedItem("file") as HTMLInputElement) || null;
                const selected = fileInput?.files ? Array.from(fileInput.files) : [];
                if (!selected.length) throw new Error("Choose at least one file");

                const hasPrimary = images.some((img) => img.is_primary);
                let primaryAssigned = hasPrimary;

                for (let idx = 0; idx < selected.length; idx += 1) {
                  const file = selected[idx]!;
                  const fd = new FormData();
                  fd.set("file", file);
                  fd.set("slug", slug);
                  const uploadRes = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
                  const uploadData = await uploadRes.json();
                  if (!uploadRes.ok) throw new Error(uploadData?.error || "Upload failed");

                  const saveRes = await fetch(`/api/admin/products/${productId}/images`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      url: uploadData.url,
                      alt: uploadAlt || null,
                      is_primary: primaryAssigned ? false : idx === 0,
                    }),
                  });
                  const saveData = await saveRes.json();
                  if (!saveRes.ok) throw new Error(saveData?.error || "Failed to save image");
                  if (!primaryAssigned && (idx === 0 || saveData?.is_primary)) {
                    primaryAssigned = true;
                    onPrimaryImageChange(uploadData.url);
                  }
                }
                setUploadAlt("");
                formEl.reset();
                await refreshImages();
              } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Unexpected error";
                setImgError(message);
              } finally {
                setUploading(false);
              }
            }}
            className="space-y-3"
          >
            {imgError && <div className="text-sm text-red-600 dark:text-red-400">{imgError}</div>}
            <label className="flex flex-col gap-1 text-sm">
              <span>Upload image(s) (JPG/PNG/WebP ≤ 5MB)</span>
              <input name="file" type="file" accept="image/*" multiple className="text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Alt text</span>
              <input
                value={uploadAlt}
                onChange={(e) => setUploadAlt(e.target.value)}
                className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
              />
            </label>
            <button
              disabled={uploading}
              className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
              type="submit"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </div>
        <div>
          <div className="text-sm opacity-80 mb-2">Existing</div>
          {imgLoading ? (
            <div className="text-sm opacity-70">Loading...</div>
          ) : images.length === 0 ? (
            <div className="text-sm opacity-70">No images yet</div>
          ) : (
            <ul className="grid grid-cols-2 gap-3">
              {images.map((im) => (
                <li key={im.id} className="rounded border border-black/10 dark:border-white/10 overflow-hidden">
                  <div className="aspect-square bg-black/5 dark:bg-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={im.url} alt={im.alt || ""} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2 space-y-1">
                    <div className="text-xs truncate" title={im.alt || undefined}>
                      {im.alt || <span className="opacity-60">(no alt)</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {!im.is_primary ? (
                        <button
                          className="h-7 px-2 rounded-md border border-black/10 dark:border-white/10 text-xs"
                          onClick={async () => {
                            setImgError(null);
                            try {
                              const res = await fetch(`/api/admin/products/${productId}/images/${im.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ is_primary: true }),
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data?.error || "Failed to set primary");
                              onPrimaryImageChange(im.url);
                              await refreshImages();
                            } catch (err: unknown) {
                              const message = err instanceof Error ? err.message : "Unexpected error";
                              setImgError(message);
                            }
                          }}
                        >
                          Set primary
                        </button>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100">
                          Primary
                        </span>
                      )}
                      <button
                        className="h-7 px-2 rounded-md border border-red-200 text-xs text-red-600 dark:border-red-500/40 dark:text-red-300"
                        disabled={deletingImageId === im.id}
                        onClick={() => handleDeleteImage(im.id)}
                      >
                        {deletingImageId === im.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
