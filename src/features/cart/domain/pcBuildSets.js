// A PC group is considered complete in cart if all its specified component variant lines are present.
export function isCartPcSet(buildSet, cartLines) {
  if (!buildSet || !Array.isArray(buildSet.itemVariantIds) || buildSet.itemVariantIds.length === 0) {
    return false;
  }
  const variants = new Set(buildSet.itemVariantIds.map(String));
  const matching = cartLines.filter((line) => variants.has(String(line.id)));
  return matching.length >= variants.size && matching.length >= 2;
}
