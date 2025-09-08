import { DEFAULT_CURRENCY } from "@/lib/env";

export function formatCurrencyCents(cents: number, currency = DEFAULT_CURRENCY, locale?: string) {
  const value = (Number(cents || 0) / 100);
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: currency.toUpperCase() }).format(value);
  } catch {
    const sym = currency.toLowerCase() === "usd" ? "$" : "";
    return `${sym}${value.toFixed(2)}`;
  }
}

export function formatCurrency(dollars: number, currency = DEFAULT_CURRENCY, locale?: string) {
  return formatCurrencyCents(Math.round(Number(dollars || 0) * 100), currency, locale);
}

