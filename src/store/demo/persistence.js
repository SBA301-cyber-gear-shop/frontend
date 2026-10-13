import { createSeed } from "./seed.js";
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
