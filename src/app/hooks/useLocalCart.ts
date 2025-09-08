"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  unitPrice: number; // cents
  quantity: number;
};

const STORAGE_KEY = "bs_cart";
const EVENT_NAME = "cart:update";

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

function dispatchCartUpdate() {
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {}
}

export default function useLocalCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const itemsRef = useRef<CartItem[]>([]);

  useEffect(() => {
    const initial = readCart();
    itemsRef.current = initial;
    setItems(initial);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    // Only write/dispatch if changed to avoid loops
    const prev = itemsRef.current;
    const changed = !areCartsEqual(prev, items);
    itemsRef.current = items;
    if (changed) {
      writeCart(items);
      dispatchCartUpdate();
    }
  }, [items, loaded]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== STORAGE_KEY) return;
      const next = readCart();
      if (!areCartsEqual(itemsRef.current, next)) {
        itemsRef.current = next;
        setItems(next);
      }
    };
    const onCustom = () => {
      const next = readCart();
      if (!areCartsEqual(itemsRef.current, next)) {
        itemsRef.current = next;
        setItems(next);
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(EVENT_NAME, onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVENT_NAME, onCustom as EventListener);
    };
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
    [items]
  );

  const updateQty = useCallback((id: string, q: number) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, quantity: Math.max(1, q) } : it)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, setItems, subtotal, updateQty, removeItem, clear, loaded };
}

function areCartsEqual(a: CartItem[], b: CartItem[]) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (!y) return false;
    if (x.id !== y.id) return false;
    if (x.quantity !== y.quantity) return false;
    if (x.unitPrice !== y.unitPrice) return false;
    if ((x.name || "") !== (y.name || "")) return false;
  }
  return true;
}
