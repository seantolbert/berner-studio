import type { CheckoutAddress, CheckoutContact } from "@/types/checkout";
import type { AddressFormState, ContactFormState } from "./types";

export function sanitizeContactInput(contact: ContactFormState): CheckoutContact | null {
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

export function sanitizeAddressInput(address: AddressFormState | null | undefined): CheckoutAddress | null {
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

