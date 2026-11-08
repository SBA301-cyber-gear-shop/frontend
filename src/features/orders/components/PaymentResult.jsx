import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { money } from "@/utils";
import { Button, Heading, KV, Notice, Panel, Badge } from "@/components/ui";
import { paymentApi } from "../api/paymentApi";

export function PaymentResult() {
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const processedRef = useRef(false);

  const orderCode = params.get("vnp_TxnRef");
  const responseCode = params.get("vnp_ResponseCode");
  const transactionStatus = params.get("vnp_TransactionStatus");
  const transactionNo = params.get("vnp_TransactionNo");
  const bankCode = params.get("vnp_BankCode");
  const cardType = params.get("vnp_CardType");
  const rawAmount = params.get("vnp_Amount");
  const amount = rawAmount ? Number(rawAmount) / 100 : 0;

  useEffect(() => {
    if (!orderCode || !responseCode) {
      setLoading(false);
      return;
    }

    if (processedRef.current) return;
    processedRef.current = true;

    const payload = {};
    params.forEach((value, key) => {
      payload[key] = value;
    });

    paymentApi
      .callbackVnPay(payload)
      .then((data) => {
        setResult(data);
      })
      .catch((err) => {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Không thể xác nhận giao dịch với máy chủ.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderCode, responseCode, params]);

  if (!orderCode) {
    return (
      <div className="stack">
        <Heading
          title="Kết quả thanh toán"
          sub="Không tìm thấy thông tin giao dịch thanh toán VNPAY."
        />
        <Notice tone="warning">
          Đường dẫn không chứa thông tin phản hồi từ cổng thanh toán VNPAY.
        </Notice>
        <div className="row gap8">
          <Button to="/don-hang">Xem đơn hàng của tôi</Button>
          <Button to="/cua-hang" tone="secondary">
            Về cửa hàng
          </Button>
        </div>
      </div>
    );
  }

  const isSuccess =
    responseCode === "00" && (!transactionStatus || transactionStatus === "00");

  return (
    <div className="stack">
      <Heading
        title="Kết quả thanh toán đơn hàng"
        sub={`Đơn hàng: ${orderCode}`}
      />

      {loading ? (
        <Notice>Đang kiểm tra và xác nhận giao dịch với hệ thống VNPAY…</Notice>
      ) : isSuccess ? (
        <>
          <Notice tone="success">
            {result?.message ||
              "Giao dịch thanh toán qua VNPAY thành công! Đơn hàng của bạn đã được xác nhận thanh toán."}
          </Notice>
          <Panel title="Chi tiết giao dịch VNPAY">
            <KV label="Mã đơn hàng">{orderCode}</KV>
            {amount > 0 && <KV label="Số tiền đã thanh toán">{money(amount)}</KV>}
            {bankCode && <KV label="Ngân hàng thanh toán">{bankCode}</KV>}
            {cardType && <KV label="Kênh thanh toán">{cardType}</KV>}
            {transactionNo && (
              <KV label="Mã giao dịch VNPAY">{transactionNo}</KV>
            )}
            <KV label="Trạng thái thanh toán">
              <Badge tone="success">Đã thanh toán (Thành công)</Badge>
            </KV>
            <p className="small muted section">
              Cửa hàng sẽ tiến hành chuẩn bị sản phẩm. Khi hàng sẵn sàng, chúng
              tôi sẽ thông báo để bạn đến nhận tại cửa hàng.
            </p>
          </Panel>
          <div className="row gap8">
            <Button to={`/don-hang/${encodeURIComponent(orderCode)}`}>
              Xem chi tiết đơn hàng
            </Button>
            <Button to="/cua-hang" tone="secondary">
              Tiếp tục mua sắm
            </Button>
          </div>
        </>
      ) : (
        <>
          <Notice tone="warning">
            {responseCode === "24"
              ? "Giao dịch thanh toán đã bị hủy bởi khách hàng."
              : error ||
                result?.message ||
                "Giao dịch thanh toán VNPAY không thành công hoặc đã bị từ chối."}
          </Notice>
          <Panel title="Thông tin giao dịch">
            <KV label="Mã đơn hàng">{orderCode}</KV>
            {responseCode && <KV label="Mã phản hồi VNPAY">{responseCode}</KV>}
            <KV label="Trạng thái">
              <Badge tone="warning">Chưa hoàn tất thanh toán</Badge>
            </KV>
            <p className="small muted section">
              Đơn hàng của bạn đã được tạo và lưu ở trạng thái chờ thanh toán.
              Bạn có thể thanh toán lại trong mục chi tiết đơn hàng hoặc thanh
              toán trực tiếp tại quầy khi nhận hàng.
            </p>
          </Panel>
          <div className="row gap8">
            <Button to={`/don-hang/${encodeURIComponent(orderCode)}`}>
              Xem đơn hàng để thanh toán lại
            </Button>
            <Button to="/cua-hang" tone="secondary">
              Về cửa hàng
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
