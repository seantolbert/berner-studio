"use client";

import { Elements } from "@stripe/react-stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import CheckoutForm from "./CheckoutForm";

type PaymentSectionProps = {
  acceptPolicies: boolean;
  onAcceptPoliciesChange: (accepted: boolean) => void;
  canSubmit: boolean;
  disabledReason: string;
  warnings: string[];
  apiError: string | null;
  clientSecret: string | null;
  creating: boolean;
  captureMode: "auto" | "manual";
  stripePromise: Promise<Stripe | null>;
};

export default function PaymentSection({
  acceptPolicies,
  onAcceptPoliciesChange,
  canSubmit,
  disabledReason,
  warnings,
  apiError,
  clientSecret,
  creating,
  captureMode,
  stripePromise,
}: PaymentSectionProps) {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-4">
      <label className="inline-flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4"
          checked={acceptPolicies}
          onChange={(event) => onAcceptPoliciesChange(event.target.checked)}
        />
        <span>
          I agree to the store policies, including the return & refund policy, and authorize this payment.
        </span>
      </label>
      {!canSubmit && <div className="text-xs text-amber-600 dark:text-amber-400">{disabledReason}</div>}
      {warnings.length > 0 && <div className="text-xs opacity-70">{warnings.join(". ")}</div>}
      {apiError && <div className="text-sm text-red-600 dark:text-red-400">{apiError}</div>}
      {clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
          <CheckoutForm capture={captureMode} canSubmit={canSubmit} />
        </Elements>
      ) : (
        <div className="text-sm opacity-70">{creating ? "Preparing payment..." : ""}</div>
      )}
    </div>
  );
}

