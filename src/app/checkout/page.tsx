"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe, LinkAuthenticationElement } from "@stripe/react-stripe-js";
import { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY } from "@/lib/env";
import { priceCart } from "@/lib/pricing";
import { estimateCartETA } from "@/lib/leadtime";
import { formatCurrencyCents } from "@/lib/money";
import type { CartItem } from "@/types/cart";
import type { CheckoutAddress, CheckoutContact } from "@/types/checkout";

type ContactFormState = {
  fullName: string;
  email: string;
  phone: string;
};

type AddressFormState = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

function sanitizeContactInput(contact: ContactFormState): CheckoutContact | null {
  const fullName = contact.fullName.trim();
  const email = contact.email.trim();
  const phone = contact.phone.trim();
  if (!fullName && !email && !phone) return null;
  const sanitized: CheckoutContact = {};
  if (fullName) sanitized.fullName = fullName;
  if (email) sanitized.email = email;
  if (phone) sanitized.phone = phone;
  return sanitized;
}

function sanitizeAddressInput(address: AddressFormState | null | undefined): CheckoutAddress | null {
  if (!address) return null;
  const line1 = address.line1.trim();
  const line2 = address.line2.trim();
  const city = address.city.trim();
  const state = address.state.trim();
  const postalCode = address.postalCode.trim();
  const country = (address.country || "US").trim();
  const hasPrimary = Boolean(line1 || city || state || postalCode || line2);
  if (!hasPrimary && !country) return null;
  if (!hasPrimary && country.toUpperCase() === "US") return null;
  const sanitized: CheckoutAddress = {};
  if (line1) sanitized.line1 = line1;
  if (line2) sanitized.line2 = line2;
  if (city) sanitized.city = city;
  if (state) sanitized.state = state;
  if (postalCode) sanitized.postalCode = postalCode;
  if (country) sanitized.country = country;
  return sanitized;
}

const stripePromise = NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null);

function formatUsd(cents: number) {
  return formatCurrencyCents(cents);
}

function CheckoutForm({
  capture,
  canSubmit,
}: {
  capture: "auto" | "manual";
  canSubmit: boolean;
}) {
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unexpected error");
      }
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
        disabled={!stripe || !elements || submitting || !canSubmit}
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
  const [contact, setContact] = useState<ContactFormState>({ fullName: "", email: "", phone: "" });
  const [shippingAddress, setShippingAddress] = useState<AddressFormState>({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState<AddressFormState>({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "expedited" | "overnight">("standard");
  const [notes, setNotes] = useState("");
  const [acceptPolicies, setAcceptPolicies] = useState(false);
  const [intentInputsVersion, setIntentInputsVersion] = useState(0);

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

  const shippingOptions = useMemo(
    () => [
      {
        id: "standard" as const,
        label: "Standard",
        description: "5-7 business days",
        surchargeCents: 0,
      },
      {
        id: "expedited" as const,
        label: "Expedited",
        description: "2-3 business days",
        surchargeCents: 1500,
      },
      {
        id: "overnight" as const,
        label: "Overnight",
        description: "Next business day",
        surchargeCents: 3500,
      },
    ],
    []
  );

  const quote = useMemo(
    () =>
      priceCart({
        items,
        country: shippingAddress.country,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
      }),
    [items, shippingAddress.country, shippingAddress.postalCode, shippingAddress.state]
  );
  const eta = useMemo(() => estimateCartETA(items) , [items]);

  const selectedShipping = shippingOptions.find((option) => option.id === shippingMethod) ?? shippingOptions[0];
  const shippingSurcharge = selectedShipping?.surchargeCents ?? 0;
  const shippingTotal = Math.max(0, quote.shipping + shippingSurcharge);

  const promoDiscount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.toUpperCase() === "WELCOME10") {
      return Math.min(Math.round(quote.subtotal * 0.1), 50_00);
    }
    if (appliedPromo.toUpperCase() === "FREESHIP") {
      return Math.min(shippingTotal, quote.shipping + shippingSurcharge);
    }
    return 0;
  }, [appliedPromo, quote.subtotal, quote.shipping, shippingSurcharge, shippingTotal]);

  const orderTotal = useMemo(() => {
    const raw = quote.subtotal + shippingTotal + quote.tax - promoDiscount;
    return raw < 0 ? 0 : raw;
  }, [promoDiscount, quote.subtotal, quote.tax, shippingTotal]);

  const promoDescription = useMemo(() => {
    if (!appliedPromo) return "";
    if (appliedPromo === "WELCOME10") return "10% off (max $50)";
    if (appliedPromo === "FREESHIP") return "Free shipping on this order";
    return "";
  }, [appliedPromo]);

  const paymentDisabledReason = useMemo(() => {
    const email = contact.email.trim();
    const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    if (!contact.fullName.trim()) return "Add your full name.";
    if (!emailValid) return "Add a valid email for receipts.";
    if (!shippingAddress.line1.trim() || !shippingAddress.city.trim() || !shippingAddress.state.trim() || !shippingAddress.postalCode.trim()) {
      return "Complete the shipping address.";
    }
    if (!billingSameAsShipping) {
      if (!billingAddress.line1.trim() || !billingAddress.city.trim() || !billingAddress.state.trim() || !billingAddress.postalCode.trim()) {
        return "Complete the billing address or mark it as same as shipping.";
      }
    }
    if (!acceptPolicies) return "Accept the store policies to continue.";
    return "";
  }, [
    contact.email,
    contact.fullName,
    shippingAddress.line1,
    shippingAddress.city,
    shippingAddress.state,
    shippingAddress.postalCode,
    billingSameAsShipping,
    billingAddress.line1,
    billingAddress.city,
    billingAddress.state,
    billingAddress.postalCode,
    acceptPolicies,
  ]);

  const canSubmitPayment = paymentDisabledReason.length === 0;

  const handleApplyPromo = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = promoCode.trim().toUpperCase();
    if (!normalized) {
      setPromoError("Enter a promo code");
      return;
    }
    if (!["WELCOME10", "FREESHIP"].includes(normalized)) {
      setPromoError("Code not recognized");
      return;
    }
    setAppliedPromo(normalized);
    setPromoCode("");
    setPromoError(null);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError(null);
  };

  const contactRef = useRef<ContactFormState>(contact);
  const shippingRef = useRef<AddressFormState>(shippingAddress);
  const billingRef = useRef<AddressFormState>(billingAddress);
  const billingSameRef = useRef<boolean>(billingSameAsShipping);
  const notesRef = useRef<string>(notes);
  const intentSnapshotRef = useRef<string | null>(null);

  useEffect(() => {
    contactRef.current = contact;
    shippingRef.current = shippingAddress;
    billingRef.current = billingAddress;
    billingSameRef.current = billingSameAsShipping;
    notesRef.current = notes;
  }, [contact, shippingAddress, billingAddress, billingSameAsShipping, notes]);

  useEffect(() => {
    if (!canSubmitPayment) return;
    const sanitizedContact = sanitizeContactInput(contactRef.current);
    const sanitizedShipping = sanitizeAddressInput(shippingRef.current);
    const sanitizedBilling = billingSameRef.current ? sanitizedShipping : sanitizeAddressInput(billingRef.current);
    const sanitizedNotes = (() => {
      const value = notesRef.current.trim();
      return value.length ? value : null;
    })();
    const signature = JSON.stringify({
      contact: sanitizedContact,
      shippingAddress: sanitizedShipping,
      billingAddress: sanitizedBilling,
      billingSameAsShipping: billingSameRef.current,
      notes: sanitizedNotes,
    });
    if (intentSnapshotRef.current === signature) return;
    intentSnapshotRef.current = signature;
    setIntentInputsVersion((prev) => prev + 1);
  }, [canSubmitPayment, contact, shippingAddress, billingAddress, billingSameAsShipping, notes]);

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
        const sanitizedContact = sanitizeContactInput(contactRef.current);
        const sanitizedShipping = sanitizeAddressInput(shippingRef.current);
        const sanitizedBilling = billingSameRef.current ? sanitizedShipping : sanitizeAddressInput(billingRef.current);
        const sanitizedNotes = (() => {
          const value = notesRef.current.trim();
          return value.length ? value : null;
        })();

        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items,
            capture: authorizeOnly ? "manual" : "auto",
            save_card: saveCard,
            description: "BSFront order",
            shippingMethod,
            promoCode: appliedPromo ?? undefined,
            billingSameAsShipping: billingSameRef.current,
            contact: sanitizedContact,
            shippingAddress: sanitizedShipping,
            billingAddress: sanitizedBilling,
            notes: sanitizedNotes,
            customerEmail: sanitizedContact?.email,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to create payment intent");
        if (!aborted) {
          setClientSecret(data.clientSecret);
          setWarnings(Array.isArray(data.warnings) ? data.warnings : []);
        }
      } catch (err: unknown) {
        if (!aborted) {
          if (err instanceof Error) {
            setApiError(err.message || "Unexpected error");
          } else {
            setApiError("Unexpected error");
          }
        }
      } finally {
        if (!aborted) setCreating(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [loaded, items, saveCard, authorizeOnly, shippingMethod, appliedPromo, intentInputsVersion]);

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

          <section className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Contact information</h2>
              <p className="text-sm opacity-70">We’ll use this for order updates and receipts.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm font-medium">
                Full name
                <input
                  className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
                  type="text"
                  value={contact.fullName}
                  onChange={(e) => setContact((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Jamie Rivera"
                />
              </label>
              <label className="text-sm font-medium">
                Phone
                <input
                  className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContact((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 000-1234"
                />
              </label>
              <label className="text-sm font-medium md:col-span-2">
                Email
                <input
                  className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="you@example.com"
                />
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Shipping address</h2>
              <p className="text-sm opacity-70">We ship nearly anywhere in the U.S. today.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm font-medium md:col-span-2">
                Street address
                <input
                  className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
                  type="text"
                  value={shippingAddress.line1}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, line1: e.target.value }))}
                  placeholder="123 Maple Ave"
                />
              </label>
              <label className="text-sm font-medium md:col-span-2">
                Apt, suite, etc. (optional)
                <input
                  className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
                  type="text"
                  value={shippingAddress.line2}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, line2: e.target.value }))}
                  placeholder="Unit 5"
                />
              </label>
              <label className="text-sm font-medium">
                City
                <input
                  className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
                  type="text"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, city: e.target.value }))}
                />
              </label>
              <label className="text-sm font-medium">
                State
                <input
                  className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
                  type="text"
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, state: e.target.value }))}
                  placeholder="CA"
                />
              </label>
              <label className="text-sm font-medium">
                Postal code
                <input
                  className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
                  type="text"
                  value={shippingAddress.postalCode}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, postalCode: e.target.value }))}
                />
              </label>
              <label className="text-sm font-medium">
                Country
                <select
                  className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
                  value={shippingAddress.country}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, country: e.target.value }))}
                >
                  <option value="US">United States</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Shipping method</h2>
              <p className="text-sm opacity-70">Choose the speed that works best for you.</p>
            </div>
            <div className="space-y-3">
              {shippingOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex items-start gap-3 rounded-lg border border-black/10 dark:border-white/10 p-3 text-sm hover:border-black/20 dark:hover:border-white/20 transition"
                >
                  <input
                    type="radio"
                    className="mt-1"
                    checked={shippingMethod === option.id}
                    onChange={() => setShippingMethod(option.id)}
                  />
                  <span>
                    <span className="font-medium block">{option.label}</span>
                    <span className="opacity-70 block text-xs">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Billing address</h2>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={billingSameAsShipping}
                onChange={(e) => setBillingSameAsShipping(e.target.checked)}
              />
              Same as shipping address
            </label>
            {!billingSameAsShipping && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm font-medium md:col-span-2">
                  Street address
                  <input
                    className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
                    type="text"
                    value={billingAddress.line1}
                    onChange={(e) => setBillingAddress((prev) => ({ ...prev, line1: e.target.value }))}
                  />
                </label>
                <label className="text-sm font-medium md:col-span-2">
                  Apt, suite, etc. (optional)
                  <input
                    className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
                    type="text"
                    value={billingAddress.line2}
                    onChange={(e) => setBillingAddress((prev) => ({ ...prev, line2: e.target.value }))}
                  />
                </label>
                <label className="text-sm font-medium">
                  City
                  <input
                    className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
                    type="text"
                    value={billingAddress.city}
                    onChange={(e) => setBillingAddress((prev) => ({ ...prev, city: e.target.value }))}
                  />
                </label>
                <label className="text-sm font-medium">
                  State
                  <input
                    className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
                    type="text"
                    value={billingAddress.state}
                    onChange={(e) => setBillingAddress((prev) => ({ ...prev, state: e.target.value }))}
                  />
                </label>
                <label className="text-sm font-medium">
                  Postal code
                  <input
                    className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
                    type="text"
                    value={billingAddress.postalCode}
                    onChange={(e) => setBillingAddress((prev) => ({ ...prev, postalCode: e.target.value }))}
                  />
                </label>
                <label className="text-sm font-medium">
                  Country
                  <select
                    className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
                    value={billingAddress.country}
                    onChange={(e) => setBillingAddress((prev) => ({ ...prev, country: e.target.value }))}
                  >
                    <option value="US">United States</option>
                  </select>
                </label>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Order notes</h2>
              <p className="text-sm opacity-70">Share delivery preferences or personalization details.</p>
            </div>
            <textarea
              className="w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent min-h-[96px] px-3 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Gate code, preferred delivery window, or gift message."
            />
          </section>

          <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
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
            <label className="inline-flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={acceptPolicies}
                onChange={(e) => setAcceptPolicies(e.target.checked)}
              />
              <span>
                I agree to the store policies, including the return & refund policy, and authorize this payment.
              </span>
            </label>
            {!canSubmitPayment && (
              <div className="text-xs text-amber-600 dark:text-amber-400">
                {paymentDisabledReason}
              </div>
            )}
            {warnings.length > 0 && (
              <div className="text-xs opacity-70">{warnings.join(". ")}</div>
            )}
            {apiError && (
              <div className="text-sm text-red-600 dark:text-red-400">{apiError}</div>
            )}
            {clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: { theme: "stripe" } }}
              >
                <CheckoutForm capture={authorizeOnly ? "manual" : "auto"} canSubmit={canSubmitPayment} />
              </Elements>
            ) : (
              <div className="text-sm opacity-70">{creating ? "Preparing payment..." : ""}</div>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 h-fit space-y-4">
          <div>
            <div className="text-lg font-semibold">Order summary</div>
            <p className="text-sm opacity-70">Review items before paying.</p>
          </div>
          <div className="space-y-3 text-sm">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs opacity-70">Qty {item.quantity}</div>
                </div>
                <div className="text-right">{formatUsd(item.unitPrice * item.quantity)}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatUsd(quote.subtotal)}</span>
            </div>
            <div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatUsd(shippingTotal)}</span>
              </div>
              {selectedShipping && (
                <div className="text-xs opacity-70 flex justify-between">
                  <span>{selectedShipping.label}</span>
                  <span>{selectedShipping.description}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatUsd(quote.tax)}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Promo ({appliedPromo})</span>
                <span>-{formatUsd(promoDiscount)}</span>
              </div>
            )}
          </div>

          <form className="space-y-2" onSubmit={handleApplyPromo}>
            <label className="text-sm font-medium block">Promo code</label>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="WELCOME10"
                disabled={!!appliedPromo}
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center h-10 px-4 rounded-md border border-black/15 dark:border-white/15 text-sm"
                disabled={!!appliedPromo}
              >
                Apply
              </button>
            </div>
            {promoError && <div className="text-xs text-red-600 dark:text-red-400">{promoError}</div>}
            {appliedPromo && (
              <div className="flex items-center justify-between text-xs rounded-md border border-emerald-400/40 text-emerald-600 dark:text-emerald-300 bg-emerald-500/5 px-3 py-2">
                <span>
                  {appliedPromo} — {promoDescription}
                </span>
                <button type="button" onClick={handleRemovePromo} className="underline">
                  Remove
                </button>
              </div>
            )}
          </form>

          {eta?.label && <div className="text-xs opacity-70">{eta.label}</div>}

          <div className="flex justify-between text-base font-medium pt-3 border-t border-black/10 dark:border-white/10">
            <span>Total</span>
            <span>{formatUsd(orderTotal)}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
