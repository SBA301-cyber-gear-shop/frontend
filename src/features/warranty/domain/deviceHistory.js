export function deviceChain(cards, card) {
  const seen = new Set([card.id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of cards) {
      const next = cards.find((c) => c.serialNumber === item.replacedBySerialNumber);
      if (next && (seen.has(item.id) || seen.has(next.id))) {
        for (const id of [item.id, next.id]) {
          if (!seen.has(id)) { seen.add(id); changed = true; }
        }
      }
    }
  }
  const chain = cards.filter((item) => seen.has(item.id));
  const ordered = [];
  let current = chain.find((item) => !chain.some((other) => other.replacedBySerialNumber === item.serialNumber));
  while (current && !ordered.includes(current)) {
    ordered.push(current);
    current = chain.find((item) => item.serialNumber === current.replacedBySerialNumber);
  }
  return [...ordered, ...chain.filter((item) => !ordered.includes(item))];
}

export function historyCounts(cards) {
  const requests = cards.flatMap((card) => card.requests || []).filter((r) => r.status !== "canceled");
  return {
    received: requests.length,
    repaired: requests.filter((r) => r.resolution === "repaired").length,
    replaced: requests.filter((r) => r.resolution === "replaced").length,
  };
}
