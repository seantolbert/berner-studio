"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe, LinkAuthenticationElement } from "@stripe/react-stripe-js";
import { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY } from "@/lib/env";
import { priceCart } from "@/lib/pricing";
import { estimateCartETA } from "@/lib/leadtime";
import { formatCurrencyCents } from "@/lib/money";
import type { CartItem } from "@/types/cart";

const stripePromise = NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null);

function formatUsd(cents: number) {
  return formatCurrencyCents(cents);
}

function CheckoutForm({ clientSecret: _clientSecret, capture }: { clientSecret: string; capture: "auto" | "manual" }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    setStatus(null);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        // Avoid full-page redirect for most cases; 3DS may still redirect in-frame.
        redirect: "if_required",
      });

      if (error) {
        setError(error.message || "Payment failed");
      } else if (paymentIntent) {
        try {
          // Persist PI info for testing (e.g., manual capture later)
          localStorage.setItem(
            "bs_last_pi",
            JSON.stringify({ id: paymentIntent.id, status: paymentIntent.status, amount: paymentIntent.amount, currency: paymentIntent.currency })
          );
        } catch {}
        setStatus(paymentIntent.status);
        if (paymentIntent.status === "succeeded") {
          router.push("/checkout/success");
        } else if (paymentIntent.status === "requires_capture" && capture === "manual") {
          // Authorized but not captured yet
          router.push("/checkout/success?authorized=1");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <LinkAuthenticationElement />
      <div className="h-3" />
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
      {status && <div className="text-sm opacity-70">Status: {status}</div>}
      <button
        className="inline-flex h-10 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
        type="submit"
        disabled={!stripe || !elements || submitting}
      >
        {submitting ? "Processing..." : "Pay now"}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saveCard, setSaveCard] = useState(false);
  const [authorizeOnly, setAuthorizeOnly] = useState(false);
  const [creating, setCreating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bs_cart");
      const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  const quote = useMemo(() => priceCart({ items }), [items]);
  const eta = useMemo(() => estimateCartETA(items) , [items]);

  useEffect(() => {
    if (!loaded) return;
    if (!items.length) return;
    let aborted = false;
    (async () => {
      setCreating(true);
      setApiError(null);
      setWarnings([]);
      setClientSecret(null);
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items,
            capture: authorizeOnly ? "manual" : "auto",
            save_card: saveCard,
            description: "BSFront order",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to create payment intent");
        if (!aborted) {
          setClientSecret(data.clientSecret);
          setWarnings(Array.isArray(data.warnings) ? data.warnings : []);
        }
      } catch (err: any) {
        if (!aborted) setApiError(err?.message || "Unexpected error");
      } finally {
        if (!aborted) setCreating(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [loaded, items, saveCard, authorizeOnly]);

  if (!NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <main className="min-h-screen w-full p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold mb-2">Checkout</h1>
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
            Stripe publishable key not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env.local
          </div>
        </div>
      </main>
    );
  }

  if (loaded && items.length === 0) {
    return (
      <main className="min-h-screen w-full p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold mb-4">Checkout</h1>
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-6 text-center">
            <div className="text-sm opacity-80 mb-3">Your cart is empty.</div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex h-10 px-4 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
            >
              Continue shopping
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full p-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
            <div className="flex items-center gap-4 mb-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} />
                Save card for later
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={authorizeOnly}
                  onChange={(e) => setAuthorizeOnly(e.target.checked)}
                />
                Authorize only (capture later)
              </label>
            </div>
            {warnings.length > 0 && (
              <div className="mb-3 text-xs opacity-70">{warnings.join(". ")}</div>
            )}
            {apiError && (
              <div className="mb-3 text-sm text-red-600 dark:text-red-400">{apiError}</div>
            )}
            {clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: { theme: "stripe" } }}
              >
                <CheckoutForm clientSecret={clientSecret} capture={authorizeOnly ? "manual" : "auto"} />
              </Elements>
            ) : (
              <div className="text-sm opacity-70">{creating ? "Preparing payment..." : ""}</div>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 h-fit">
          <div className="text-lg font-semibold mb-3">Summary</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatUsd(quote.subtotal)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{formatUsd(quote.shipping)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{formatUsd(quote.tax)}</span></div>
          </div>
          {eta?.label && <div className="text-xs opacity-70 mt-2">{eta.label}</div>}
          <div className="flex justify-between text-base font-medium mt-3 pt-3 border-t border-black/10 dark:border-white/10">
            <span>Total</span>
            <span>{formatUsd(quote.total)}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
