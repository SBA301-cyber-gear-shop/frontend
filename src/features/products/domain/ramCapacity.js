export function ramCapacity(product) {
  const value = product.specs?.Capacity_GB ?? product.specs?.["Dung lượng"] ?? product.tech?.capacity;
  if (value == null) return null;
  const match = String(value).trim().match(/^(\d+(?:[.,]\d+)?)\s*(?:GB)?$/i);
  if (!match) return null;
  const capacity = Number(match[1].replace(",", "."));
  return Number.isFinite(capacity) && capacity > 0 ? capacity : null;
}
