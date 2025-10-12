import type { CartItem } from "@/types/cart";

const CART_STORAGE_KEY = "bs_cart";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadCart<T extends CartItem = CartItem>(): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (error) {
    console.error("Failed to load cart from storage", error);
    return [];
  }
}

export function saveCart<T extends CartItem = CartItem>(items: T[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to persist cart to storage", error);
  }
}

export function appendCartItem<T extends CartItem = CartItem>(item: T): T[] {
  const current = loadCart<T>();
  const next = [...current, item];
  saveCart(next);
  return next;
}

export function emitCartUpdate() {
  if (!isBrowser()) return;
  try {
    window.dispatchEvent(new CustomEvent("cart:update"));
  } catch {
    // Silently ignore if dispatch fails
  }
}
