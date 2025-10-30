"use client";

import type { AddressFormState } from "../types";

type AddressFieldsProps = {
  address: AddressFormState;
  onChange: (partial: Partial<AddressFormState>) => void;
  includeCountry?: boolean;
};

export default function AddressFields({ address, onChange, includeCountry = true }: AddressFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label className="text-sm font-medium md:col-span-2">
        Street address
        <input
          className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
          type="text"
          value={address.line1}
          onChange={(e) => onChange({ line1: e.target.value })}
          placeholder="123 Maple Ave"
        />
      </label>
      <label className="text-sm font-medium md:col-span-2">
        Apt, suite, etc. (optional)
        <input
          className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
          type="text"
          value={address.line2}
          onChange={(e) => onChange({ line2: e.target.value })}
          placeholder="Unit 5"
        />
      </label>
      <label className="text-sm font-medium">
        City
        <input
          className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
          type="text"
          value={address.city}
          onChange={(e) => onChange({ city: e.target.value })}
        />
      </label>
      <label className="text-sm font-medium">
        State
        <input
          className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
          type="text"
          value={address.state}
          onChange={(e) => onChange({ state: e.target.value })}
          placeholder="CA"
        />
      </label>
      <label className="text-sm font-medium">
        Postal code
        <input
          className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
          type="text"
          value={address.postalCode}
          onChange={(e) => onChange({ postalCode: e.target.value })}
        />
      </label>
      {includeCountry && (
        <label className="text-sm font-medium">
          Country
          <select
            className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent h-10 px-3 text-sm"
            value={address.country}
            onChange={(e) => onChange({ country: e.target.value })}
          >
            <option value="US">United States</option>
          </select>
        </label>
      )}
    </div>
  );
}

