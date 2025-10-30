"use client";

import AddressFields from "./AddressFields";
import type { AddressFormState } from "../types";

type BillingAddressSectionProps = {
  address: AddressFormState;
  sameAsShipping: boolean;
  onToggle: (value: boolean) => void;
  onChange: (partial: Partial<AddressFormState>) => void;
};

export default function BillingAddressSection({
  address,
  sameAsShipping,
  onToggle,
  onChange,
}: BillingAddressSectionProps) {
  return (
    <section className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Billing address</h2>
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={sameAsShipping}
          onChange={(event) => onToggle(event.target.checked)}
        />
        Same as shipping address
      </label>
      {!sameAsShipping && <AddressFields address={address} onChange={onChange} includeCountry />}
    </section>
  );
}

