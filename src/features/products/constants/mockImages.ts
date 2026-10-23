export const MOCK_HARDWARE_IMAGES: Record<string, string> = {
  ram: "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80",
  ssd: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80",
  gpu: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80",
  cpu: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80",
  mainboard: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
  case: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80",
  monitor: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
  psu: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80",
  cooler: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80",
  default: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80",
};

export function getCategoryMockImage(categorySlugOrName?: string): string {
  if (!categorySlugOrName) return MOCK_HARDWARE_IMAGES.default;
  const key = String(categorySlugOrName).toLowerCase().trim();
  if (MOCK_HARDWARE_IMAGES[key]) {
    return MOCK_HARDWARE_IMAGES[key];
  }
  for (const [k, url] of Object.entries(MOCK_HARDWARE_IMAGES)) {
    if (key.includes(k) || k.includes(key)) {
      return url;
    }
  }
  return MOCK_HARDWARE_IMAGES.default;
}
