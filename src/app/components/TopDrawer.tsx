"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  children?: React.ReactNode;
  title?: string;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  id?: string;
};

export default function TopDrawer({ open, onOpenChange, children, title, returnFocusRef, id }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const dragYRef = useRef<number>(0);
  const [, setTick] = useState(0); // force re-render for drag updates

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    if (open) {
      document.addEventListener("keydown", onKey);
      // Lock scroll
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [open, onOpenChange]);

  // Simple focus management: focus panel when opened
  useEffect(() => {
    if (open) setTimeout(() => panelRef.current?.focus(), 0);
    if (!open && returnFocusRef?.current) {
      // Return focus to trigger button on close
      setTimeout(() => returnFocusRef.current?.focus(), 0);
    }
  }, [open, returnFocusRef]);

  // Focus trap within panel
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const panel = panelRef.current as HTMLElement | null;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      const list = Array.from(focusables).filter(el => el.offsetParent !== null);
      if (list.length === 0) return;
      const firstEl = list[0]!;
      const lastEl = list[list.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      const shift = (e as KeyboardEvent).shiftKey;
      if (shift) {
        if (active === firstEl || !panel.contains(active)) {
          lastEl.focus();
          e.preventDefault();
        }
      } else {
        if (active === lastEl) {
          firstEl.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden
      />
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Menu'}
        tabIndex={-1}
        id={id}
        className={`absolute right-0 top-0 w-full max-w-md outline-none`}
      >
        <div
          className={`mr-4 ml-auto mt-2 rounded-lg border border-black/10 dark:border-white/10 bg-background shadow-lg ${dragging ? '' : 'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'} will-change-transform motion-reduce:transition-none`}
          style={{
            transform: open
              ? `translateY(${dragging ? Math.max(0, dragYRef.current) : 0}px)`
              : 'translateY(-120%)',
          }}
          onPointerDown={(e) => {
            // Start drag only near the top area to avoid interfering with content
            const bounds = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            if (e.clientY - bounds.top > 60) return; // only allow grab from top 60px
            setDragging(true);
            startYRef.current = e.clientY;
            dragYRef.current = 0;
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!dragging) return;
            dragYRef.current = Math.max(0, e.clientY - startYRef.current);
            setTick((t) => t + 1);
          }}
          onPointerUp={(e) => {
            if (!dragging) return;
            (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            const dy = dragYRef.current;
            setDragging(false);
            dragYRef.current = 0;
            if (dy > 80) onOpenChange(false); // threshold to close
            else setTick((t) => t + 1); // snap back
          }}
        >
          {/* Drag handle + safe-area */}
          <div className="flex items-center justify-center pt-2" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}>
            <div className="h-1.5 w-10 rounded-full bg-black/20 dark:bg-white/20" aria-hidden />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
