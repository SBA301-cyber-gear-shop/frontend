import { createServer } from "node:http";
import { Buffer } from "node:buffer";
import { once } from "node:events";
import axios from "axios";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  test,
  vi,
} from "vitest";
import { axiosClient } from "@/services";
import { authApi } from "../src/features/auth/api/authApi";
import {
  pcBuilderApi,
  PcBuildApiError,
  isAbortError,
} from "../src/features/pc-builder/api/pcBuilderApi";
import { cartApi } from "../src/features/cart/api/cartApi";
import { catalogApi } from "../src/features/products/api/catalogApi";
import { checkoutApi } from "../src/features/orders/api/checkoutApi";
import { ordersApi } from "../src/features/orders/api/ordersApi";

// Exercise Axios serialization/parsing and HTTP failures against a local server.
// No developer backend or external API is contacted.
let server;
let reply;
const requests = [];
const originalBaseURL = axiosClient.defaults.baseURL;
const auth = {
  accessToken: "server-token",
  user: {
    id: 1,
    fullName: "Test User",
    email: "test@example.com",
    role: "Customer",
  },
};

beforeAll(async () => {
  server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    requests.push({
      url: request.url,
      method: request.method,
      headers: request.headers,
      body: Buffer.concat(chunks).toString(),
    });
    response.writeHead(reply.status, {
      "Content-Type": reply.contentType || "application/json",
      ...reply.headers,
    });
    response.end(reply.raw ?? JSON.stringify(reply.body));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  axiosClient.defaults.baseURL = `http://127.0.0.1:${server.address().port}/backend`;
});

beforeEach(() => {
  const storage = new Map();
  vi.stubGlobal("sessionStorage", {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  });
  requests.length = 0;
  reply = { status: 200, body: { data: auth } };
});

test("staff xem thẻ của từng thiết bị trong cùng dòng đơn", async () => {
  reply.body = { data: [
    { id: 501, orderItemId: 101, serialNumber: "RAM-A001" },
    { id: 502, orderItemId: 101, serialNumber: "RAM-A002" },
  ] };
  const cards = await ordersApi.warrantyCards("TZ-TEST");
  expect(requests.at(-1).url).toBe("/backend/api/warranty-cards?q=TZ-TEST");
  expect(cards.map((card) => [card.orderItemId, card.id, card.serialNumber])).toEqual([
    [101, 501, "RAM-A001"], [101, 502, "RAM-A002"],
  ]);
});

test("cart adapter preserves cartItemId separately from variantId", async () => {
  reply.body = {
    data: {
      items: [
        {
          cartItemId: 9001,
          productVariantId: 101,
          quantity: 2,
          unitPrice: 1200000,
          stockQuantity: 3,
        },
      ],
    },
  };
  const lines = await cartApi.get();
  expect(lines[0]).toMatchObject({
    id: "101",
    cartItemId: 9001,
    quantity: 2,
    stock: 3,
  });
  await cartApi.update(lines[0].cartItemId, 3);
  expect(requests.at(-1)).toMatchObject({
    url: "/backend/api/orders/cart/items/9001",
    method: "PUT",
    body: '{"quantity":3}',
  });
  await cartApi.remove(lines[0].cartItemId);
  expect(requests.at(-1)).toMatchObject({
    method: "DELETE",
    url: "/backend/api/orders/cart/items/9001",
  });
});

test("adding to cart sends numeric variant ID and the logged-in token", async () => {
  sessionStorage.setItem("techzone-token", "buyer-token");
  await cartApi.add("101", 2);
  expect(requests[0]).toMatchObject({
    method: "POST",
    url: "/backend/api/orders/cart/items",
    body: '{"productVariantId":101,"quantity":2}',
  });
  expect(requests[0].headers.authorization).toBe("Bearer buyer-token");
});

test("checkout sends receiver details and voucher without client supplied totals", async () => {
  reply.body = { cartId: 8, valid: true, totalAmount: 2400000, items: [] };
  expect((await checkoutApi.validate()).valid).toBe(true);
  const details = {
    pickupName: "Khách",
    pickupPhone: "0900000128",
    note: "Nhận chiều",
    promotionCode: "SAVE",
  };
  await checkoutApi.preview(details);
  expect(requests[0]).toMatchObject({
    method: "POST",
    url: "/backend/api/checkout/validate",
  });
  expect(requests[1].url).toBe("/backend/api/checkout/details/preview");
  expect(JSON.parse(requests[1].body)).toEqual(details);
});

test("catalog normalizes variant IDs and missing optional fields", async () => {
  reply.body = [{ id: 101, productId: 10, price: 1200000 }];
  expect(await catalogApi.list()).toEqual([
    {
      id: "101",
      productId: "10",
      price: 1200000,
      originalPrice: 1200000,
      category: "other",
      specs: {},
    },
  ]);
  expect(requests[0].url).toBe("/backend/api/products");
});

test("cart and catalog reject malformed response shapes", async () => {
  reply.body = {};
  await expect(cartApi.get()).rejects.toThrow("Dữ liệu giỏ hàng không hợp lệ");
  await expect(catalogApi.list()).rejects.toThrow(
    "Dữ liệu sản phẩm không hợp lệ",
  );
});

afterEach(() => vi.unstubAllGlobals());

afterAll(async () => {
  axiosClient.defaults.baseURL = originalBaseURL;
  const closed = once(server, "close");
  server.close();
  server.closeAllConnections();
  await closed;
});

test("login sends JSON to the configured base URL and returns only the HTTP body", async () => {
  const payload = { identity: "test@example.com", password: "test-password" };
  const result = await authApi.login(payload);
  expect(requests[0]).toMatchObject({
    url: "/backend/api/auth/login",
    method: "POST",
    headers: { "content-type": "application/json" },
  });
  expect(JSON.parse(requests[0].body)).toEqual(payload);
  expect(result).toEqual({ data: auth });
  expect(result).not.toHaveProperty("status");
});

test("registration preserves its payload and supports a bare auth response", async () => {
  reply = { status: 201, body: auth };
  const payload = {
    fullName: "Test User",
    email: "test@example.com",
    phone: "0900000001",
    password: "test-password",
    address: "",
  };
  expect(await authApi.register(payload)).toEqual(auth);
  expect(requests[0].url).toBe("/backend/api/auth/register");
  expect(JSON.parse(requests[0].body)).toEqual(payload);
});

test("requests use the current token and stop sending it after logout", async () => {
  await axiosClient.get("/probe");
  sessionStorage.setItem("techzone-token", "first-token");
  await axiosClient.get("/probe");
  sessionStorage.setItem("techzone-token", "new-token");
  await axiosClient.get("/probe");
  sessionStorage.removeItem("techzone-token");
  await axiosClient.get("/probe");
  expect(requests.map((request) => request.headers.authorization)).toEqual([
    undefined,
    "Bearer first-token",
    "Bearer new-token",
    undefined,
  ]);
});

test("explicit request headers override the default token and content type", async () => {
  sessionStorage.setItem("techzone-token", "session-token");
  await axiosClient.post("/probe", "plain body", {
    headers: {
      authorization: "Bearer explicit-token",
      "content-type": "text/plain",
    },
  });
  expect(requests[0]).toMatchObject({
    headers: {
      authorization: "Bearer explicit-token",
      "content-type": "text/plain",
    },
    body: "plain body",
  });
});

test("204 responses become null", async () => {
  reply = { status: 204, raw: "" };
  expect((await axiosClient.delete("/probe")).data).toBeNull();
});

test("backend messages take priority and HTTP error details remain available", async () => {
  sessionStorage.setItem("techzone-token", "existing-token");
  reply = {
    status: 401,
    body: {
      message: "Thông tin đăng nhập không đúng.",
      validationErrors: { identity: "Other error" },
    },
  };
  const error = await authApi
    .login({ identity: "test", password: "wrong" })
    .catch((e) => e);
  expect(axios.isAxiosError(error)).toBe(true);
  expect(error.message).toBe("Thông tin đăng nhập không đúng.");
  expect(error.response.status).toBe(401);
  expect(error.response.data).toEqual(reply.body);
  expect(sessionStorage.getItem("techzone-token")).toBe("existing-token");
  expect(requests).toHaveLength(1);
});

test("validation errors are joined for existing form error displays", async () => {
  reply = {
    status: 422,
    body: {
      validationErrors: {
        email: "Email đã tồn tại",
        phone: "Số điện thoại không hợp lệ",
      },
    },
  };
  await expect(axiosClient.post("/probe", {})).rejects.toThrow(
    "Email đã tồn tại; Số điện thoại không hợp lệ",
  );
});

test.each([
  ["JSON without a message", "{}", "application/json"],
  ["HTML", "<html>Service unavailable</html>", "text/html"],
  ["empty body", "", "application/json"],
])(
  "HTTP errors with %s use the status fallback",
  async (_, raw, contentType) => {
    reply = { status: 503, raw, contentType };
    await expect(axiosClient.get("/probe")).rejects.toThrow(
      "Yêu cầu thất bại (503).",
    );
  },
);

test("malformed successful JSON is rejected instead of reaching feature code", async () => {
  reply = { status: 200, raw: "<html>Unexpected page</html>" };
  await expect(axiosClient.get("/probe")).rejects.toMatchObject({
    code: "ERR_BAD_RESPONSE",
  });
});

test("analyze and autoBuild POST to the new pc-build endpoints and unwrap ApiResponseDTO", async () => {
  const analysis = { status: "READY", requirement: { budget: 20000000, purpose: "GAMING" }, notes: [] };
  reply.body = { status: 200, message: "OK", data: analysis };
  expect(await pcBuilderApi.analyze({ budget: 20000000, message: "chơi game 2K" })).toEqual(analysis);
  expect(requests.at(-1)).toMatchObject({ method: "POST", url: "/backend/api/pc-build/requirements/analyze" });
  expect(JSON.parse(requests.at(-1).body)).toEqual({ budget: 20000000, message: "chơi game 2K" });

  const build = { status: "VALID", budget: 20000000, total: 19500000, items: [], violations: [], message: "Dạ, Shop..." };
  reply.body = { status: 200, message: "OK", data: build };
  expect(await pcBuilderApi.autoBuild({ budget: 20000000, purpose: "GAMING" })).toEqual(build);
  expect(requests.at(-1)).toMatchObject({ method: "POST", url: "/backend/api/pc-build/builds/auto" });
  expect(JSON.parse(requests.at(-1).body)).toEqual({ budget: 20000000, purpose: "GAMING" });
});

test("validate, replacements and save send only {variantId, qty}; prices never leave the client", async () => {
  const items = [
    { variantId: 11, qty: 1 },
    { variantId: 31, qty: 2 },
  ];
  reply.body = { data: { status: "OVER_BUDGET", items: [], violations: [] } };
  await pcBuilderApi.validate({ budget: 20000000, items });
  expect(requests.at(-1)).toMatchObject({ method: "POST", url: "/backend/api/pc-build/builds/validate" });
  expect(JSON.parse(requests.at(-1).body)).toEqual({ budget: 20000000, items });

  reply.body = { data: [{ id: 12, name: "RAM", price: 900000, qty: 2, maxQty: 4, current: false }] };
  expect(await pcBuilderApi.replacements({ category: "RAM", items })).toHaveLength(1);
  expect(requests.at(-1)).toMatchObject({ method: "POST", url: "/backend/api/pc-build/builds/replacements" });
  expect(JSON.parse(requests.at(-1).body)).toEqual({ category: "RAM", items });

  reply.body = { data: { buildId: 77, status: "VALID", total: 19000000, difference: -1000000 } };
  expect(await pcBuilderApi.save({ budget: 20000000, items, confirmOverBudget: true })).toMatchObject({ buildId: 77 });
  expect(requests.at(-1)).toMatchObject({ method: "POST", url: "/backend/api/pc-build/builds/save" });
  expect(JSON.parse(requests.at(-1).body)).toEqual({ budget: 20000000, items, confirmOverBudget: true });
});

test("save 409 OVER_BUDGET_NOT_CONFIRMED keeps the popup message and data", async () => {
  reply = {
    status: 409,
    body: {
      status: 409,
      error: "Conflict",
      message: "Bộ PC hiện tại đã vượt quá ngân sách 1.000.000đ (tổng 21.000.000đ, ngân sách 20.000.000đ). Bạn có muốn tiếp tục?",
      code: "OVER_BUDGET_NOT_CONFIRMED",
      data: { budget: 20000000, total: 21000000, difference: 1000000 },
    },
  };
  const error = await pcBuilderApi.save({ budget: 20000000, items: [{ variantId: 1, qty: 1 }] }).catch((e) => e);
  expect(error).toBeInstanceOf(PcBuildApiError);
  expect(error).toMatchObject({
    status: 409,
    code: "OVER_BUDGET_NOT_CONFIRMED",
    retryAfter: null,
    message: expect.stringContaining("Bạn có muốn tiếp tục?"),
    data: { difference: 1000000 },
  });
});

test("429 RATE_LIMITED keeps Retry-After seconds; 400 validationErrors become the message", async () => {
  reply = {
    status: 429,
    headers: { "Retry-After": "7" },
    body: { status: 429, message: "Bạn thao tác quá nhanh", code: "RATE_LIMITED" },
  };
  const limited = await pcBuilderApi.analyze({ budget: 20000000, message: "game" }).catch((e) => e);
  expect(limited).toMatchObject({ status: 429, code: "RATE_LIMITED", retryAfter: 7, message: "Bạn thao tác quá nhanh" });

  reply = {
    status: 400,
    body: { status: 400, error: "Validation Error", validationErrors: { message: "Mô tả nhu cầu tối đa 500 ký tự" } },
  };
  const invalid = await pcBuilderApi.analyze({ budget: 20000000, message: "x" }).catch((e) => e);
  expect(invalid).toMatchObject({ status: 400, code: undefined, message: "Mô tả nhu cầu tối đa 500 ký tự" });
});

test("a 200 response without data is rejected instead of reaching the builder", async () => {
  reply.body = { status: 200, message: "OK", data: null };
  await expect(pcBuilderApi.autoBuild({ budget: 20000000, purpose: "GAMING" })).rejects.toThrow(
    "Không nhận được dữ liệu từ máy chủ",
  );
});

test("aborted PC Builder requests stay cancel errors, not PcBuildApiError", async () => {
  const controller = new AbortController();
  controller.abort();
  const error = await pcBuilderApi
    .validate({ budget: 20000000, items: [] }, { signal: controller.signal })
    .catch((e) => e);
  expect(axios.isCancel(error)).toBe(true);
  expect(isAbortError(error)).toBe(true);
  expect(error).not.toBeInstanceOf(PcBuildApiError);
  expect(requests).toHaveLength(0);
});

test("network errors remain distinguishable from HTTP errors", async () => {
  const networkError = new axios.AxiosError("Network Error", "ERR_NETWORK");
  await expect(
    axiosClient.get("/probe", {
      adapter: async () => {
        throw networkError;
      },
    }),
  ).rejects.toBe(networkError);
  expect(networkError.response).toBeUndefined();
});

test("AbortController cancellation stays identifiable and sends no request", async () => {
  const controller = new AbortController();
  controller.abort();
  const error = await axiosClient
    .get("/probe", { signal: controller.signal })
    .catch((e) => e);
  expect(axios.isCancel(error)).toBe(true);
  expect(requests).toHaveLength(0);
});
