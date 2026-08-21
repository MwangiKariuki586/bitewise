interface NormalizedQuantity {
  group: string;
  value: number;
}

function normalizeQuantity(quantity: number, unit: string): NormalizedQuantity {
  if (unit === "kg") return { group: "mass", value: quantity * 1_000 };
  if (unit === "g") return { group: "mass", value: quantity };
  if (unit === "l") return { group: "volume", value: quantity * 1_000 };
  if (unit === "ml") return { group: "volume", value: quantity };
  return { group: unit, value: quantity };
}

export function quantityInUnit(quantity: number, fromUnit: string, toUnit: string) {
  const from = normalizeQuantity(quantity, fromUnit);
  const to = normalizeQuantity(1, toUnit);
  if (from.group !== to.group) return 0;
  return from.value / to.value;
}

export function datePlusDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysSince(dateTime: string, today: string) {
  const eatenAt = new Date(`${dateTime.slice(0, 10)}T00:00:00Z`).getTime();
  const current = new Date(`${today}T00:00:00Z`).getTime();
  if (!Number.isFinite(eatenAt) || !Number.isFinite(current)) return null;
  return Math.floor((current - eatenAt) / 86_400_000);
}
