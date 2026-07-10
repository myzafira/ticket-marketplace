export function formatCents(cents: number) {
  return (cents / 100).toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
  });
}

export function bahtToCents(baht: number) {
  return Math.round(baht * 100);
}
