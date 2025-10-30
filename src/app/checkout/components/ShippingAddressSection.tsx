"use client";

import AddressFields from "./AddressFields";
import type { AddressFormState } from "../types";

type ShippingAddressSectionProps = {
  address: AddressFormState;
  onChange: (partial: Partial<AddressFormState>) => void;
};

export default function ShippingAddressSection({ address, onChange }: ShippingAddressSectionProps) {
  return (
    <section className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Shipping address</h2>
        <p className="text-sm opacity-70">We ship nearly anywhere in the U.S. today.</p>
      </div>
      <AddressFields address={address} onChange={onChange} includeCountry />
    </section>
  );
}

