"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY } from "@/lib/env";
import { priceCart } from "@/lib/pricing";
import { estimateCartETA } from "@/lib/leadtime";
import type { CartItem } from "@/types/cart";
import ContactSection from "./components/ContactSection";
import ShippingAddressSection from "./components/ShippingAddressSection";
import ShippingMethodSection from "./components/ShippingMethodSection";
import BillingAddressSection from "./components/BillingAddressSection";
import OrderNotesSection from "./components/OrderNotesSection";
import PaymentSection from "./components/PaymentSection";
import OrderSummarySection from "./components/OrderSummarySection";
import { usePaymentIntent } from "./hooks/usePaymentIntent";
import type { AddressFormState, ContactFormState, ShippingOption } from "./types";

const stripePromise = NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null);

const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: "standard",
    label: "Standard",
    description: "5-7 business days",
    surchargeCents: 0,
  },
  {
    id: "expedited",
    label: "Expedited",
    description: "2-3 business days",
    surchargeCents: 1500,
  },
];

const saveCard = false;
const authorizeOnly = false;

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] = useState<ShippingOption["id"]>("standard");
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
  const [notes, setNotes] = useState("");
  const [acceptPolicies, setAcceptPolicies] = useState(false);

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

  const eta = useMemo(() => estimateCartETA(items), [items]);

  const selectedShipping =
    SHIPPING_OPTIONS.find((option) => option.id === shippingMethod) ?? SHIPPING_OPTIONS[0];
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
  }, [appliedPromo, quote.shipping, quote.subtotal, shippingSurcharge, shippingTotal]);

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
    if (
      !shippingAddress.line1.trim() ||
      !shippingAddress.city.trim() ||
      !shippingAddress.state.trim() ||
      !shippingAddress.postalCode.trim()
    ) {
      return "Complete the shipping address.";
    }
    if (!billingSameAsShipping) {
      if (
        !billingAddress.line1.trim() ||
        !billingAddress.city.trim() ||
        !billingAddress.state.trim() ||
        !billingAddress.postalCode.trim()
      ) {
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

  const handleApplyPromo = (event: React.FormEvent<HTMLFormElement>) => {
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

  const { clientSecret, warnings, creating, apiError } = usePaymentIntent({
    enabled: loaded && items.length > 0 && Boolean(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    items,
    authorizeOnly,
    saveCard,
    shippingMethod,
    promoCode: appliedPromo,
    contact,
    shippingAddress,
    billingAddress,
    billingSameAsShipping,
    notes,
    canSubmit: canSubmitPayment,
  });

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

          <ContactSection
            contact={contact}
            onChange={(partial) => setContact((prev) => ({ ...prev, ...partial }))}
          />

          <ShippingAddressSection
            address={shippingAddress}
            onChange={(partial) => setShippingAddress((prev) => ({ ...prev, ...partial }))}
          />

          <ShippingMethodSection
            options={SHIPPING_OPTIONS}
            selectedId={shippingMethod}
            onSelect={(id) => setShippingMethod(id)}
          />

          <BillingAddressSection
            address={billingAddress}
            sameAsShipping={billingSameAsShipping}
            onToggle={(value) => setBillingSameAsShipping(value)}
            onChange={(partial) => setBillingAddress((prev) => ({ ...prev, ...partial }))}
          />

          <OrderNotesSection notes={notes} onChange={setNotes} />

          <PaymentSection
            acceptPolicies={acceptPolicies}
            onAcceptPoliciesChange={setAcceptPolicies}
            canSubmit={canSubmitPayment}
            disabledReason={paymentDisabledReason}
            warnings={warnings}
            apiError={apiError}
            clientSecret={clientSecret}
            creating={creating}
            captureMode={authorizeOnly ? "manual" : "auto"}
            stripePromise={stripePromise}
          />
        </div>

        <OrderSummarySection
          items={items}
          subtotal={quote.subtotal}
          shippingTotal={shippingTotal}
          tax={quote.tax}
          selectedShipping={selectedShipping ?? null}
          promoDiscount={promoDiscount}
          appliedPromo={appliedPromo}
          promoDescription={promoDescription}
          promoCode={promoCode}
          onPromoCodeChange={setPromoCode}
          onApplyPromo={handleApplyPromo}
          onRemovePromo={handleRemovePromo}
          promoError={promoError}
          etaLabel={eta?.label}
          orderTotal={orderTotal}
        />
      </div>
    </main>
  );
}

