export type ContactFormState = {
  fullName: string;
  email: string;
  phone: string;
};

export type AddressFormState = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type ShippingOption = {
  id: "standard" | "expedited";
  label: string;
  description: string;
  surchargeCents: number;
};
