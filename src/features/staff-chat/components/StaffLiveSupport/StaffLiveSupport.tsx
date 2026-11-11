import React, { useState, useEffect, useRef } from "react";
import { useSession } from "@/features/auth";
import { Icon } from "@/components/ui";
import { staffChatApi, SupportSession, SupportMessage } from "../../api/staffChatApi";
import "./StaffLiveSupport.css";

const CANNED_REPLIES = [
  "Chào bạn! Mình là chuyên viên CSKH TechZone. Mình có thể hỗ trợ gì cho bạn ạ?",
  "Về xuất hóa đơn VAT điện tử, bạn vui lòng gửi giúp mình: Tên công ty, MST, Địa chỉ và Email nhận nhé!",
  "TechZone áp dụng chiết khấu 3% - 8% cho đơn hàng sỉ / doanh nghiệp từ 5 bộ PC trở lên ạ.",
  "Mình đã ghi nhận yêu cầu và đang kiểm tra trên hệ thống kho, bạn đợi mình trong giây lát nhé!",
  "Bạn có thể liên hệ trực tiếp Hotline CSKH TechZone: 1900 8888 (nhánh 1) nếu cần hỗ trợ gấp nhé!",
];

export function StaffLiveSupport() {
  const { user } = useSession();

  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<SupportSession | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "WAITING" | "ACTIVE" | "CLOSED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Tải danh sách phiên hỗ trợ
  const fetchSessions = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await staffChatApi.getSessions("ALL");
      setSessions(data || []);

      if (selectedSession) {
        const updated = data?.find((s) => s.conversationId === selectedSession.conversationId);
        if (updated) setSelectedSession(updated);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách phiên hỗ trợ:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // 2. Tải tin nhắn của phiên đang chọn
  const fetchMessages = async (convId: string, silent = false) => {
    try {
      const data = await staffChatApi.getMessages(convId);
      setMessages(data || []);
      if (!silent) {
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error("Lỗi tải tin nhắn phiên hỗ trợ:", err);
    }
  };

  useEffect(() => {
    fetchSessions();

    const interval = setInterval(() => {
      fetchSessions(true);
      if (selectedSession?.conversationId) {
        fetchMessages(selectedSession.conversationId, true);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [selectedSession?.conversationId]);

  const handleSelectSession = (s: SupportSession) => {
    setSelectedSession(s);
    fetchMessages(s.conversationId);
  };

  const handleAssign = async () => {
    if (!selectedSession) return;
    try {
      const updated = await staffChatApi.assignStaff(selectedSession.conversationId);
      setSelectedSession(updated);
      fetchSessions(true);
      fetchMessages(selectedSession.conversationId);
    } catch (err) {
      console.error("Lỗi khi tiếp nhận hỗ trợ:", err);
    }
  };

  const handleClose = async () => {
    if (!selectedSession) return;
    if (!window.confirm("Bạn có chắc chắn muốn kết thúc phiên hỗ trợ này?")) return;
    try {
      await staffChatApi.closeSession(selectedSession.conversationId);
      setSelectedSession(null);
      fetchSessions(true);
    } catch (err) {
      console.error("Lỗi khi đóng phiên:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedSession || sending) return;
    const textToSend = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      await staffChatApi.sendMessage(selectedSession.conversationId, textToSend);
      fetchMessages(selectedSession.conversationId, true);
      fetchSessions(true);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("Lỗi khi gửi tin nhắn staff:", err);
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const waitingCount = sessions.filter((s) => s.status === "WAITING").length;
  const activeCount = sessions.filter((s) => s.status === "ACTIVE").length;
  const closedCount = sessions.filter((s) => s.status === "CLOSED").length;
  const totalCount = sessions.length;

  const filteredSessions = sessions.filter((s) => {
    if (filterStatus !== "ALL" && s.status !== filterStatus) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.customerName.toLowerCase().includes(q) ||
      s.customerEmail.toLowerCase().includes(q) ||
      s.customerPhone.includes(q) ||
      s.lastMessage.toLowerCase().includes(q)
    );
  });

  return (
    <div className="staff-chat-container">
      {/* Header */}
      <div className="staff-chat-header">
        <div className="staff-chat-header-title">
          <h2>
            <div className="staff-header-icon-badge">
              <Icon name="headset" />
            </div>
            <span>Tổng đài Hỗ trợ Trực tuyến Khách hàng</span>
          </h2>
          <p>Tiếp nhận yêu cầu chuyên biệt và tư vấn trực tiếp cho khách hàng thời gian thực</p>
        </div>
        <div className="staff-chat-stats">
          <div className="staff-stat-pill waiting">
            <span className="pulse-dot" />
            <span>Chờ tiếp nhận: <strong>{waitingCount}</strong></span>
          </div>
          <div className="staff-stat-pill active">
            <span className="live-dot" />
            <span>Đang hỗ trợ: <strong>{activeCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Split Body */}
      <div className="staff-chat-body">
        {/* Left Column: Sessions List */}
        <div className="staff-sessions-panel">
          <div className="staff-sessions-toolbar">
            <div className="staff-search-wrapper">
              <Icon name="search" className="staff-search-icon" />
              <input
                type="text"
                className="staff-search-input"
                placeholder="Tìm theo tên khách, SĐT, nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="staff-filter-tabs">
              {(["ALL", "WAITING", "ACTIVE", "CLOSED"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`staff-tab-btn ${filterStatus === tab ? "is-active" : ""}`}
                  onClick={() => setFilterStatus(tab)}
                >
                  {tab === "ALL" && `Tất cả (${totalCount})`}
                  {tab === "WAITING" && `Chờ (${waitingCount})`}
                  {tab === "ACTIVE" && `Đang chat (${activeCount})`}
                  {tab === "CLOSED" && `Đã đóng (${closedCount})`}
                </button>
              ))}
            </div>
          </div>

          <div className="staff-sessions-list">
            {loading && sessions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 20px", color: "#64748b", fontSize: "13px" }}>
                Đang tải danh sách phiên...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b", fontSize: "13px" }}>
                Không có phiên hỗ trợ nào phù hợp.
              </div>
            ) : (
              filteredSessions.map((s) => {
                const isSelected = selectedSession?.conversationId === s.conversationId;
                return (
                  <div
                    key={s.conversationId}
                    className={`staff-session-card ${isSelected ? "is-selected" : ""}`}
                    onClick={() => handleSelectSession(s)}
                  >
                    <div className="staff-customer-avatar">
                      {s.customerName ? s.customerName.charAt(0).toUpperCase() : "K"}
                    </div>
                    <div className="staff-session-info">
                      <div className="staff-session-row-top">
                        <span className="staff-customer-name" title={s.customerName}>
                          {s.customerName}
                        </span>
                        <span className="staff-session-time">{s.updatedAt?.split(" ")[0]}</span>
                      </div>
                      <div className="staff-session-snippet" title={s.lastMessage}>
                        {s.lastMessage || "Khách hàng yêu cầu hỗ trợ"}
                      </div>
                      <div className="staff-session-status-row">
                        <span className={`staff-status-badge ${s.status.toLowerCase()}`}>
                          {s.status === "WAITING" && "Chờ hỗ trợ"}
                          {s.status === "ACTIVE" && "Đang chat"}
                          {s.status === "CLOSED" && "Đã kết thúc"}
                        </span>
                        {s.assignedStaffName && (
                          <span className="staff-assigned-tag">
                            <Icon name="headset" style={{ width: "12px", height: "12px", verticalAlign: "-2px" }} />
                            {s.assignedStaffName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Chat Conversation Stream */}
        <div className="staff-chat-detail">
          {!selectedSession ? (
            <div className="staff-chat-empty-state">
              <div className="staff-chat-empty-icon">
                <Icon name="message" style={{ width: "42px", height: "42px", color: "var(--red)" }} />
              </div>
              <h4>Chưa chọn phiên hỗ trợ nào</h4>
              <p>
                Chọn một khách hàng ở danh sách bên trái để xem nội dung trao đổi và phản hồi trực tiếp.
              </p>
            </div>
          ) : (
            <>
              {/* Detail Topbar */}
              <div className="staff-detail-topbar">
                <div className="staff-customer-meta">
                  <h3>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <Icon name="user" />
                      {selectedSession.customerName}
                    </span>
                    <span className={`staff-status-badge ${selectedSession.status.toLowerCase()}`}>
                      {selectedSession.status === "WAITING" && "Chờ hỗ trợ"}
                      {selectedSession.status === "ACTIVE" && "Đang hỗ trợ trực tiếp"}
                      {selectedSession.status === "CLOSED" && "Đã đóng phiên"}
                    </span>
                  </h3>
                  <div className="staff-meta-details">
                    {selectedSession.customerEmail && (
                      <span>
                        <Icon name="mail" style={{ width: "13px", height: "13px" }} />
                        {selectedSession.customerEmail}
                      </span>
                    )}
                    {selectedSession.customerPhone && (
                      <span>
                        <Icon name="phone" style={{ width: "13px", height: "13px" }} />
                        {selectedSession.customerPhone}
                      </span>
                    )}
                    {selectedSession.assignedStaffName && (
                      <span>
                        <Icon name="headset" style={{ width: "13px", height: "13px" }} />
                        Phụ trách: <strong>{selectedSession.assignedStaffName}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="staff-detail-actions">
                  {selectedSession.status === "WAITING" && (
                    <button className="staff-action-btn btn-assign" onClick={handleAssign}>
                      <Icon name="headset" />
                      <span>Nhận hỗ trợ khách này</span>
                    </button>
                  )}
                  {selectedSession.status === "ACTIVE" && (
                    <button className="staff-action-btn btn-close" onClick={handleClose}>
                      <Icon name="lock" />
                      <span>Kết thúc phiên</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Stream */}
              <div className="staff-messages-stream">
                {messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#64748b", margin: "auto", fontSize: "13px" }}>
                    Chưa có tin nhắn nào trong phiên này.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isCust = m.senderType === "CUSTOMER";
                    const isStaff = m.senderType === "STAFF";
                    const isBot = m.senderType === "BOT";

                    return (
                      <div
                        key={m.id}
                        className={`staff-message-item ${
                          isCust ? "is-customer" : isStaff ? "is-staff" : "is-bot"
                        }`}
                      >
                        <div className="staff-msg-avatar">
                          {isCust ? <Icon name="user" /> : isStaff ? <Icon name="headset" /> : <Icon name="bot" />}
                        </div>
                        <div>
                          <div className="staff-msg-meta">
                            <span>{m.senderName || (isCust ? "Khách hàng" : isStaff ? "Chuyên viên" : "CyberBot AI")}</span>
                            <span>·</span>
                            <span>{m.createdAt}</span>
                          </div>
                          <div className="staff-msg-bubble">
                            {m.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Canned Responses Bar */}
              <div className="staff-canned-bar">
                {CANNED_REPLIES.map((reply, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="staff-canned-chip"
                    onClick={() => setInputText(reply)}
                    title={reply}
                  >
                    {reply.length > 40 ? reply.substring(0, 40) + "..." : reply}
                  </button>
                ))}
              </div>

              {/* Composer */}
              <div className="staff-composer">
                <textarea
                  className="staff-composer-input"
                  placeholder={
                    selectedSession.status === "CLOSED"
                      ? "Phiên hỗ trợ này đã kết thúc. Nhận lại phiên để tiếp tục chat."
                      : "Nhập nội dung trả lời khách hàng (nhấn Enter để gửi)..."
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending || selectedSession.status === "CLOSED"}
                  rows={2}
                />
                <button
                  type="button"
                  className="staff-send-btn"
                  onClick={handleSendMessage}
                  disabled={sending || !inputText.trim() || selectedSession.status === "CLOSED"}
                >
                  <Icon name="send" />
                  <span>Gửi</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
