// A PC group needs two distinct cart lines, even if a variant is listed more than once.
export function isCartPcSet(buildSet, cartLines) {
  const variants = new Set((buildSet.itemVariantIds || []).map(String));
  return cartLines.filter((line) => variants.has(String(line.id))).length >= 2;
}
