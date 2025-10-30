export type CheckoutContact = {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type CheckoutAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export type CheckoutDraftMetadata = {
  contact: CheckoutContact | null;
  shippingAddress: CheckoutAddress | null;
  billingAddress: CheckoutAddress | null;
  billingSameAsShipping: boolean;
  shippingMethod: "standard" | "expedited";
  shippingSurcharge: number;
  shippingTotal: number;
  promoCode: string | null;
  promoDiscount: number;
  notes: string | null;
  orderTotal: number;
};
