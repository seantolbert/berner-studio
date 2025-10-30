"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LinkAuthenticationElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

type CheckoutFormProps = {
  capture: "auto" | "manual";
  canSubmit: boolean;
};

export default function CheckoutForm({ capture, canSubmit }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    setStatus(null);
    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (submitError) {
        setError(submitError.message || "Payment failed");
        return;
      }

      if (paymentIntent) {
        try {
          localStorage.setItem(
            "bs_last_pi",
            JSON.stringify({
              id: paymentIntent.id,
              status: paymentIntent.status,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
            })
          );
        } catch {
          // ignore storage errors
        }
        setStatus(paymentIntent.status);
        if (paymentIntent.status === "succeeded") {
          router.push("/checkout/success");
        } else if (paymentIntent.status === "requires_capture" && capture === "manual") {
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

