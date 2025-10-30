"use client";

import { useEffect, useState } from "react";
import { sanitizeAddressInput, sanitizeContactInput } from "../utils";
import type { AddressFormState, ContactFormState } from "../types";
import type { CartItem } from "@/types/cart";

type UsePaymentIntentParams = {
  enabled: boolean;
  items: CartItem[];
  authorizeOnly: boolean;
  saveCard: boolean;
  shippingMethod: "standard" | "expedited";
  promoCode: string | null;
  contact: ContactFormState;
  shippingAddress: AddressFormState;
  billingAddress: AddressFormState;
  billingSameAsShipping: boolean;
  notes: string;
  canSubmit: boolean;
};

type UsePaymentIntentResult = {
  clientSecret: string | null;
  warnings: string[];
  creating: boolean;
  apiError: string | null;
};

export function usePaymentIntent({
  enabled,
  items,
  authorizeOnly,
  saveCard,
  shippingMethod,
  promoCode,
  contact,
  shippingAddress,
  billingAddress,
  billingSameAsShipping,
  notes,
  canSubmit,
}: UsePaymentIntentParams): UsePaymentIntentResult {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!items.length) return;
    if (!canSubmit) return;

    const sanitizedContact = sanitizeContactInput(contact);
    const sanitizedShipping = sanitizeAddressInput(shippingAddress);
    const sanitizedBilling = billingSameAsShipping ? sanitizedShipping : sanitizeAddressInput(billingAddress);
    const sanitizedNotes = (() => {
      const value = notes.trim();
      return value.length ? value : null;
    })();

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
            shippingMethod,
            promoCode: promoCode ?? undefined,
            billingSameAsShipping,
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
        if (!aborted) {
          setCreating(false);
        }
      }
    })();

    return () => {
      aborted = true;
    };
  }, [
    enabled,
    items,
    authorizeOnly,
    saveCard,
    shippingMethod,
    promoCode,
    contact,
    shippingAddress,
    billingAddress,
    billingSameAsShipping,
    notes,
    canSubmit,
  ]);

  return { clientSecret, warnings, creating, apiError };
}

