export function formatKes(minor: number) {
  return `KES ${Math.ceil(minor / 100).toLocaleString("en-KE")}`;
}

export function formatQuantity(quantity: number) {
  return Number(quantity.toFixed(3)).toLocaleString("en-KE");
}

export function formatShoppingWeek(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const formatter = new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}
