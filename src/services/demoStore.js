import { createSeed } from "../data/seed.js";
const KEY = "techzone-demo-v1";
export function readState() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    if (
      data?.version === 1 &&
      Array.isArray(data.products) &&
      Array.isArray(data.orders) &&
      Array.isArray(data.tickets)
    )
      return data;
  } catch {
    /* Recover from invalid browser storage. */
  }
  return createSeed();
}
export function writeState(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
export function safeRead(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export const delay = (ms = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));
export async function request(path, options = {}) {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) throw new Error("Chưa cấu hình API backend.");
  const response = await fetch(base + path, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok)
    throw new Error("Yêu cầu thất bại (" + response.status + ").");
  return response.status === 204 ? null : response.json();
}
