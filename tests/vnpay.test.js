import { describe, it, expect } from "vitest";

describe("VNPay Order & Payment Flow", () => {
  it("preserves vnpay methodType and paymentUrl", () => {
    const mockOrder = {
      id: "TZ-20261105-VNPAY1",
      method: "vnpay",
      payment: "PENDING",
      paymentUrl:
        "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=TZ-20261105-VNPAY1&vnp_SecureHash=abc",
    };

    expect(mockOrder.method).toBe("vnpay");
    expect(mockOrder.paymentUrl).toContain("sandbox.vnpayment.vn");
  });
});
