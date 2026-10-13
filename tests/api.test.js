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
import { pcBuilderApi } from "../src/features/pc-builder/api/pcBuilderApi";

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

test.each([false, true])(
  "AI API preserves its payload and unwraps backend envelope=%s",
  async (wrapped) => {
    const suggestion = {
      name: "Office PC",
      reasoning: "Test suggestion",
      parts: {},
      totalAmount: 10000000,
      validation: { valid: true, checks: [] },
    };
    reply.body = wrapped ? { data: suggestion } : suggestion;
    const payload = {
      budget: 15000000,
      purpose: "office",
      ramGb: 16,
      scope: "tower",
    };
    expect(await pcBuilderApi.suggest(payload)).toEqual(suggestion);
    expect(requests[0].url).toBe("/backend/api/v1/pc-build/ai-suggest");
    expect(JSON.parse(requests[0].body)).toEqual(payload);
  },
);

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
