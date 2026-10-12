import { createSeed } from "../data/seed.js";
const KEY = "techzone-demo-v1";
export function readState() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    if (
      data?.version === 2 &&
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
export function getAuthToken() {
  return sessionStorage.getItem("techzone-token") || localStorage.getItem("techzone-token");
}

export async function request(path, options = {}) {
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const token = getAuthToken();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(base + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
  });
  if (!response.ok) {
    let msg = "Yêu cầu thất bại (" + response.status + ").";
    try {
      const err = await response.json();
      if (err?.message) msg = err.message;
      else if (err?.validationErrors) {
        msg = Object.values(err.validationErrors).join("; ");
      }
    } catch {
      /* ignore json parse failure */
    }
    // Kèm mã HTTP để nơi gọi phân biệt được hết phiên đăng nhập (401) với lỗi nghiệp vụ.
    throw Object.assign(new Error(msg), { status: response.status });
  }
  return response.status === 204 ? null : response.json();
}

