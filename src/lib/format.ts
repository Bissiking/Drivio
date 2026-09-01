// src/lib/format.ts
const numberFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const currencyFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export function formatNumber(value: number, suffix = "") {
  return `${numberFormatter.format(value)}${suffix}`;
}

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatDate(value: Date | string) {
  return dateFormatter.format(new Date(value));
}

export function toDateInput(value: Date = new Date()) {
  return value.toISOString().slice(0, 10);
}
