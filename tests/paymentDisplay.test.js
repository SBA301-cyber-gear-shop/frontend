import { describe, expect, it } from "vitest";
import { paymentDateTime, paymentMoney } from "../src/features/orders/components/paymentDisplay";

describe("payment summary formatting", () => {
  it("formats zero and large amounts using the shared currency formatter", () => {
    expect(paymentMoney(0)).toBe("0");
    expect(paymentMoney(1234567890)).toBe("1.234.567.890");
  });

  it("uses full local dates and padded 24-hour times", () => {
    expect(paymentDateTime("2026-03-05T08:05:00")).toBe("05/03/2026 · 08:05");
    expect(paymentDateTime("2026-03-05T00:00:00")).toBe("05/03/2026 · 00:00");
    expect(paymentDateTime("2026-11-10T23:59:00")).toBe("10/11/2026 · 23:59");
    expect(paymentDateTime("invalid")).toBe("invalid");
  });
});
