"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ModalSize = "sm" | "md" | "lg" | "xl";

export type ModalOptions = {
  title?: string;
  dismissible?: boolean;
  size?: ModalSize;
};

type ModalContextValue = {
  isOpen: boolean;
  open: (_content: React.ReactNode, _options?: ModalOptions) => void;
  close: () => void;
  setContent: (_content: React.ReactNode) => void;
  options: Required<Pick<ModalOptions, "dismissible" | "size">> & Pick<ModalOptions, "title">;
  content: React.ReactNode | null;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within a ModalProvider");
  return ctx;
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<React.ReactNode | null>(null);
  const [options, setOptions] = useState<ModalContextValue["options"]>({
    dismissible: true,
    size: "md",
  });

  const open = useCallback((node: React.ReactNode, opts?: ModalOptions) => {
    setContent(node);
    setOptions((prev) => ({ ...prev, ...opts }));
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [isOpen]);

  const value = useMemo<ModalContextValue>(
    () => ({ isOpen, open, close, setContent, options, content }),
    [isOpen, open, close, options, content]
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function ModalRoot() {
  const { isOpen, close, options, content } = useModal();

  // Close on Escape for accessibility
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && options.dismissible) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, options.dismissible, close]);

  if (!isOpen) return null;

  const sizeClass = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  }[options.size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-label={options.title || "Dialog"}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal backdrop"
        onClick={options.dismissible ? close : undefined}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />

      {/* Dialog */}
      <div
        className={`relative w-full ${sizeClass} rounded-lg bg-white text-black dark:bg-zinc-900 dark:text-zinc-100 shadow-xl border border-black/10 dark:border-white/10 animate-in fade-in zoom-in-95`}
      >
        {/* Header */}
        {(options.title || options.dismissible) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
            <h2 className="text-base font-semibold truncate">
              {options.title ?? ""}
            </h2>
            {options.dismissible && (
              <button
                type="button"
                onClick={close}
                className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Close dialog"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-4">
          {content}
        </div>
      </div>
    </div>
  );
}
