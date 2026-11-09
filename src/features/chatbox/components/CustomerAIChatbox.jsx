import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/features/auth";
import { useCart } from "@/features/cart";
import { Icon } from "@/components/ui";
import { chatboxApi } from "../api/chatboxApi";
import "../chatbox.css";

const QUICK_SUGGESTIONS = [
  { label: "Đơn hàng gần nhất", icon: "package", query: "Đơn hàng gần nhất của tôi thế nào?" },
  { label: "Kiểm tra bảo hành", icon: "shield", query: "Linh kiện của tôi còn bảo hành bao lâu?" },
  { label: "Tư vấn cấu hình PC", icon: "chip", query: "Tư vấn cấu hình PC tối ưu trong tầm giá" },
  { label: "Chính sách GHN", icon: "truck", query: "Chính sách giao hàng GHN thế nào?" },
];

const STAFF_SUGGESTIONS = [
  { label: "Xuất hóa đơn VAT", icon: "fileText", query: "Tôi muốn xuất hóa đơn VAT điện tử" },
  { label: "Báo giá sỉ B2B", icon: "briefcase", query: "Tôi cần báo giá sỉ cho dự án doanh nghiệp" },
  { label: "Khiếu nại dịch vụ", icon: "alertCircle", query: "Tôi cần phản ánh về dịch vụ" },
  { label: "Về CyberBot AI", icon: "bot", query: "end_staff_session" },
];

function formatMarkdown(text) {
  if (!text) return "";

  const lines = text.split("\n");
  const elements = [];
  let currentList = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      const content = trimmed.substring(2);
      currentList.push(content);
    } else {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`ul-${idx}`}>
            {currentList.map((item, itemIdx) => (
              <li key={itemIdx} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
            ))}
          </ul>
        );
        currentList = [];
      }

      if (trimmed.startsWith("### ")) {
        elements.push(<h4 key={idx} style={{ margin: "6px 0", color: "var(--red, #d91f31)" }}>{trimmed.substring(4)}</h4>);
      } else if (trimmed.length > 0) {
        elements.push(
          <p key={idx} dangerouslySetInnerHTML={{ __html: renderInline(trimmed) }} />
        );
      }
    }
  });

  if (currentList.length > 0) {
    elements.push(
      <ul key="ul-end">
        {currentList.map((item, itemIdx) => (
          <li key={itemIdx} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
        ))}
      </ul>
    );
  }

  return elements;
}

function renderInline(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: var(--red, #d91f31); text-decoration: underline; font-weight: 500;">$1</a>');
}

function ProductCardsCarousel({ products, navigate, onAddToCart }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < maxScroll - 6);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();

    // Wheel event handler with { passive: false } to translate vertical scroll to horizontal scroll
    const onWheel = (e) => {
      if (e.deltaY === 0) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      const scrollingLeft = e.deltaY < 0;
      const scrollingRight = e.deltaY > 0;
      const canLeft = el.scrollLeft > 0;
      const canRight = el.scrollLeft < maxScroll - 1;

      // Only intercept if we can scroll horizontally in that direction
      if ((scrollingLeft && canLeft) || (scrollingRight && canRight)) {
        e.preventDefault();
        e.stopPropagation();
        el.scrollLeft += e.deltaY * 1.15;
        checkScroll();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, products]);

  const scrollByAmount = (amount) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
      setTimeout(checkScroll, 250);
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="cyberbot-products-list">
      <div className="cyberbot-products-header">
        <div className="cyberbot-products-header-title">
          <Icon name="chip" />
          <span>LINH KIỆN CÓ SẴN TẠI TECHZONE:</span>
        </div>
        <div className="cyberbot-products-nav-btns">
          <button
            type="button"
            className="cyberbot-nav-arrow"
            onClick={() => scrollByAmount(-220)}
            disabled={!canScrollLeft}
            aria-label="Cuộn sang trái"
            title="Cuộn sang trái"
          >
            <Icon name="chevronLeft" />
          </button>
          <button
            type="button"
            className="cyberbot-nav-arrow"
            onClick={() => scrollByAmount(220)}
            disabled={!canScrollRight}
            aria-label="Cuộn sang phải"
            title="Cuộn sang phải"
          >
            <Icon name="chevronRight" />
          </button>
        </div>
      </div>
      <div
        className="cyberbot-products-scroll"
        ref={scrollRef}
        onScroll={checkScroll}
      >
        {products.map((prod) => (
          <div
            key={`${prod.id}-${prod.variantId || ""}`}
            className="cyberbot-product-card"
            onClick={() => navigate(prod.route || `/san-pham/${prod.id}`)}
          >
            <div className="cyberbot-product-thumb">
              {prod.imageUrl ? (
                <img
                  src={prod.imageUrl}
                  alt={prod.name}
                  className="cyberbot-product-img"
                  loading="lazy"
                />
              ) : (
                <div className="cyberbot-fallback-icon">
                  <Icon name="chip" />
                </div>
              )}
              <span
                className={`cyberbot-stock-badge ${
                  prod.stock > 0 ? "in-stock" : "out-stock"
                }`}
              >
                {prod.stock > 0 ? `Còn ${prod.stock}` : "Hết hàng"}
              </span>
            </div>
            <div className="cyberbot-product-body">
              <span className="cyberbot-product-cat">{prod.category || "Linh kiện"}</span>
              <h5 className="cyberbot-product-title" title={prod.name}>
                {prod.name}
              </h5>
              {prod.variantName && (
                <div className="cyberbot-product-variant-name">{prod.variantName}</div>
              )}
              {/* Metadata UI Badges: Brand, Warranty, Specs, Rating */}
              <div className="cyberbot-product-meta-badges">
                {prod.brand && prod.brand !== "Chính hãng" && (
                  <span className="cyberbot-meta-chip is-brand">{prod.brand}</span>
                )}
                {prod.warrantyMonths && (
                  <span className="cyberbot-meta-chip is-warranty">BH {prod.warrantyMonths}T</span>
                )}
                {prod.rating && prod.rating > 0 && (
                  <span className="cyberbot-meta-chip is-rating">★ {prod.rating}</span>
                )}
              </div>
              {prod.specs && (
                <div className="cyberbot-product-specs-line" title={prod.specs}>
                  {prod.specs}
                </div>
              )}
              <div className="cyberbot-product-price-row">
                <span className="cyberbot-product-cur-price">
                  {prod.price ? Number(prod.price).toLocaleString("vi-VN") + "₫" : "Liên hệ"}
                </span>
                {prod.originalPrice && prod.originalPrice > (prod.price || 0) && (
                  <span className="cyberbot-product-old-price">
                    {Number(prod.originalPrice).toLocaleString("vi-VN")}₫
                  </span>
                )}
              </div>
              <div className="cyberbot-product-actions">
                <button
                  type="button"
                  className="cyberbot-product-btn cyberbot-product-btn-view"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(prod.route || `/san-pham/${prod.id}`);
                  }}
                >
                  Chi tiết →
                </button>
                {onAddToCart && (
                  <button
                    type="button"
                    className="cyberbot-product-btn cyberbot-product-btn-add"
                    disabled={prod.stock <= 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(prod);
                    }}
                    title={prod.stock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
                  >
                    {prod.stock > 0 ? '+ Giỏ' : 'Hết hàng'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickChipsBar({ suggestions, onSelect }) {
  const chipsRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = chipsRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < max - 6);
  }, []);

  useEffect(() => {
    const el = chipsRef.current;
    if (!el) return;
    checkScroll();

    const onWheel = (e) => {
      if (e.deltaY === 0) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      e.preventDefault();
      e.stopPropagation();
      el.scrollLeft += e.deltaY * 1.25;
      checkScroll();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, suggestions]);

  const handleMouseDown = (e) => {
    const el = chipsRef.current;
    if (!el) return;
    isDragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeftStart.current = el.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const el = chipsRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    el.scrollLeft = scrollLeftStart.current - walk;
    checkScroll();
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  const scrollBy = (amount) => {
    if (chipsRef.current) {
      chipsRef.current.scrollBy({ left: amount, behavior: "smooth" });
      setTimeout(checkScroll, 200);
    }
  };

  return (
    <div className="cyberbot-quick-chips-wrapper">
      {canScrollLeft && (
        <button
          type="button"
          className="cyberbot-chips-nav-btn cyberbot-chips-nav-left"
          onClick={() => scrollBy(-160)}
          aria-label="Cuộn sang trái"
          title="Cuộn sang trái"
        >
          ‹
        </button>
      )}
      <div
        className="cyberbot-quick-chips"
        ref={chipsRef}
        onScroll={checkScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      >
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            type="button"
            className="cyberbot-chip"
            onClick={() => onSelect(item)}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      {canScrollRight && (
        <button
          type="button"
          className="cyberbot-chips-nav-btn cyberbot-chips-nav-right"
          onClick={() => scrollBy(160)}
          aria-label="Cuộn sang phải"
          title="Cuộn sang phải"
        >
          ›
        </button>
      )}
    </div>
  );
}

export function CustomerAIChatbox() {
  const { user } = useSession();
  const { addToCart, addMultipleToCart } = useCart();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(() => {
    return sessionStorage.getItem("cyberbot_open") === "true";
  });
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem("cyberbot_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Lỗi đọc lịch sử chat từ sessionStorage:", e);
    }
    return [
      {
        id: "init",
        sender: "bot",
        text: user
          ? `Xin chào **${user.fullName || "bạn"}**! Mình là **CyberBot** - Trợ lý AI chính thức của TechZone.\n\nMình có thể hỗ trợ bạn:\n* **Tra cứu đơn hàng gần nhất & shipper GHN**\n* **Kiểm tra thời hạn bảo hành linh kiện & số Serial**\n* **Tư vấn cấu hình PC tối ưu ngân sách từ kho thực tế**\n\nBạn cần hỗ trợ điều gì hôm nay?`
          : `Xin chào bạn! Mình là **CyberBot** - Trợ lý AI chính thức của TechZone.\n\nMình có thể hỗ trợ bạn tra cứu linh kiện có sẵn trong kho, giải đáp bảo hành và giao nhận hàng toàn quốc. Bạn cần tìm hiểu gì hôm nay?`,
        quickActions: [],
      },
    ];
  });
  const [input, setInput] = useState("");

  const prevUserIdRef = useRef(user?.id ?? null);
  useEffect(() => {
    const currentId = user?.id ?? null;
    if (prevUserIdRef.current !== currentId) {
      prevUserIdRef.current = currentId;
      sessionStorage.removeItem("cyberbot_conv_id");
      sessionStorage.removeItem("cyberbot_messages");
      sessionStorage.removeItem("cyberbot_staff");
      sessionStorage.setItem("cyberbot_mode", "ai");
      setChatMode("ai");
      setActiveStaff(null);
      setConversationId("");
      setMessages([
        {
          id: "init-" + Date.now(),
          sender: "bot",
          text: user
            ? `Xin chào **${user.fullName || "bạn"}**! Mình là **CyberBot** - Trợ lý AI chính thức của TechZone.\n\nMình có thể hỗ trợ bạn:\n* **Tra cứu đơn hàng gần nhất & shipper GHN**\n* **Kiểm tra thời hạn bảo hành linh kiện & số Serial**\n* **Tư vấn cấu hình PC tối ưu ngân sách từ kho thực tế**\n\nBạn cần hỗ trợ điều gì hôm nay?`
            : `Xin chào bạn! Mình là **CyberBot** - Trợ lý AI chính thức của TechZone.\n\nMình có thể hỗ trợ bạn tra cứu linh kiện có sẵn trong kho, giải đáp bảo hành và giao nhận hàng toàn quốc. Bạn cần tìm hiểu gì hôm nay?`,
          quickActions: [],
        },
      ]);
    }
  }, [user]);

  const isProductDetailPage = typeof window !== "undefined" && window.location.pathname.startsWith("/san-pham/");
  const currentSuggestions = useMemo(() => {
    if (chatMode === "staff") return STAFF_SUGGESTIONS;
    if (isProductDetailPage) {
      return [
        { label: "Đánh giá mẫu này", icon: "chip", query: "Đánh giá chi tiết ưu nhược điểm của sản phẩm đang xem này" },
        { label: "Linh kiện tương thích", icon: "check", query: "Linh kiện nào tương thích và tối ưu với mẫu này?" },
        ...QUICK_SUGGESTIONS,
      ];
    }
    return QUICK_SUGGESTIONS;
  }, [chatMode, isProductDetailPage]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(() => {
    return sessionStorage.getItem("cyberbot_conv_id") || "";
  });
  const [navCountdown, setNavCountdown] = useState(null);
  const [chatMode, setChatMode] = useState(() => {
    return sessionStorage.getItem("cyberbot_mode") || "ai";
  });
  const [activeStaff, setActiveStaff] = useState(() => {
    try {
      const saved = sessionStorage.getItem("cyberbot_staff");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const lastStaffMsgIdRef = useRef(0);

  useEffect(() => {
    sessionStorage.setItem("cyberbot_open", isOpen ? "true" : "false");
  }, [isOpen]);

  useEffect(() => {
    try {
      if (messages && messages.length > 0) {
        sessionStorage.setItem("cyberbot_messages", JSON.stringify(messages));
      }
    } catch (e) {
      console.warn("Lỗi lưu lịch sử chat vào sessionStorage:", e);
    }
  }, [messages]);

  useEffect(() => {
    if (activeStaff) {
      sessionStorage.setItem("cyberbot_staff", JSON.stringify(activeStaff));
    } else {
      sessionStorage.removeItem("cyberbot_staff");
    }
  }, [activeStaff]);

  useEffect(() => {
    if (conversationId) {
      sessionStorage.setItem("cyberbot_conv_id", conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    sessionStorage.setItem("cyberbot_mode", chatMode);
  }, [chatMode]);

  const scrollToBottom = (behavior = "smooth") => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: behavior,
      });
    }
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom("auto");
      const t1 = setTimeout(() => scrollToBottom("smooth"), 80);
      const t2 = setTimeout(() => scrollToBottom("smooth"), 320);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [messages, loading, isOpen]);

  // Polling tin nhắn từ Nhân viên khi đang ở chế độ Live Chat
  useEffect(() => {
    if (chatMode !== "staff" || !conversationId) return;

    const interval = setInterval(async () => {
      try {
        const pollData = await chatboxApi.pollStaffMessages(conversationId, lastStaffMsgIdRef.current);
        if (!pollData) return;

        if (pollData.status === "CLOSED") {
          setChatMode("ai");
          setActiveStaff(null);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              sender: "bot",
              text: "Chuyên viên đã kết thúc phiên hỗ trợ trực tuyến. CyberBot đã sẵn sàng tiếp tục đồng hành cùng bạn!",
              quickActions: [
                { label: "Đơn hàng gần nhất", action: "ask", route: "Đơn hàng gần nhất của tôi thế nào?" },
                { label: "Kiểm tra bảo hành", action: "ask", route: "Linh kiện của tôi còn bảo hành bao lâu?" },
                { label: "Thử AI Build PC", action: "navigate", route: "/build-pc" },
              ],
            },
          ]);
          return;
        }

        if (pollData.assignedStaffName && (!activeStaff || activeStaff.name !== pollData.assignedStaffName)) {
          setActiveStaff({
            id: 1,
            name: pollData.assignedStaffName,
            role: "Chuyên viên tư vấn & CSKH TechZone",
            phone: "1900 8888",
            status: "online",
          });
        }

        if (pollData.messages && pollData.messages.length > 0) {
          const latestId = Math.max(...pollData.messages.map((m) => m.id));
          lastStaffMsgIdRef.current = latestId;

          const staffMsgs = pollData.messages.filter((m) => m.senderType === "STAFF");
          if (staffMsgs.length > 0) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const toAppend = staffMsgs
                .filter((sm) => !existingIds.has("staff-" + sm.id))
                .map((sm) => ({
                  id: "staff-" + sm.id,
                  sender: "bot",
                  text: sm.content,
                  messageType: "staff_reply",
                  staffInfo: {
                    name: sm.senderName || "Chuyên viên CSKH",
                    role: "Chuyên viên tư vấn",
                  },
                }));

              return toAppend.length > 0 ? [...prev, ...toAppend] : prev;
            });
          }
        }
      } catch (err) {
        // im lặng bỏ qua lỗi poll tạm thời
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [chatMode, conversationId, activeStaff]);

  const handleSend = async (textToSend = input) => {
    const query = (textToSend || "").trim();
    if (!query || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => m.id !== "init" && m.text)
        .slice(-6)
        .map((m) => ({
          sender: m.sender,
          text: m.text,
        }));

      const data = await chatboxApi.sendMessage({
        message: query,
        conversationId: conversationId || undefined,
        currentPath: window.location.pathname,
        history: historyPayload,
        mode: chatMode,
      });

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      if (data.messageType === "staff_connected") {
        setChatMode("staff");
        if (data.staffInfo) {
          setActiveStaff(data.staffInfo);
        }
      } else if (data.messageType === "staff_ended") {
        setChatMode("ai");
        setActiveStaff(null);
      }

      const validProducts = (data.products || []).filter((p) => (p.stock ?? 0) > 0);
      if (data.messageType === "cart_action" && validProducts.length > 0) {
        addMultipleToCart(validProducts);
      }

      if (data.messageType === "staff_sent" || (!data.message && data.messageType !== "navigate")) {
        return;
      }

      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: data.message,
        quickActions: data.quickActions || [],
        messageType: data.messageType,
        messageRoute: data.messageRoute,
        products: data.products || [],
        staffInfo: data.staffInfo || null,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Lỗi gửi tin nhắn CyberBot:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "Xin lỗi bạn, CyberBot đang gặp chút gián đoạn kết nối. Bạn vui lòng thử lại sau giây lát nhé!",
          quickActions: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action, currentMsg) => {
    if (action.action === "add_all_to_cart") {
      const rawProds = currentMsg?.products && currentMsg.products.length > 0
        ? currentMsg.products
        : messages.slice().reverse().find((m) => m.products && m.products.length > 0)?.products;
      const prods = (rawProds || []).filter((p) => (p.stock ?? 0) > 0);

      if (prods && prods.length > 0) {
        addMultipleToCart(prods);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: "bot",
            text: `Dạ, CyberBot đã thêm trọn bộ **${prods.length} linh kiện** vào giỏ hàng của bạn thành công! 🎉\n\nBạn có thể kiểm tra giỏ hàng hoặc tiến hành thanh toán ngay nhé!`,
            quickActions: [
              { label: "🛒 Xem giỏ hàng", action: "navigate", route: "/gio-hang" },
              { label: "💳 Thanh toán ngay", action: "navigate", route: "/thanh-toan" },
              { label: "💬 Nhờ chuyên viên hỗ trợ", action: "connect_staff" },
            ],
          },
        ]);
      } else {
        handleSend("thêm tất cả linh kiện vào giỏ hàng");
      }
      setTimeout(() => scrollToBottom("smooth"), 60);
      return;
    }
    if (action.action === "connect_staff") {
      handleSend("connect_staff");
    } else if (action.action === "end_staff_session") {
      handleSend("end_staff_session");
    } else if (action.action === "navigate" && action.route) {
      navigate(action.route);
    } else if (action.action === "ask" || action.route) {
      handleSend(action.route || action.label);
    }
    setTimeout(() => scrollToBottom("smooth"), 60);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          className="cyberbot-toggle-btn"
          onClick={() => setIsOpen(true)}
          title="Mở trợ lý AI TechZone"
        >
          <div className="cyberbot-toggle-icon">
            <Icon name="bot" />
            <span className="cyberbot-pulse-dot" />
          </div>
          <span>Trợ lý AI TechZone</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="cyberbot-window">
          {/* Header */}
          <div className={`cyberbot-header ${chatMode === "staff" ? "is-staff-mode" : ""}`}>
            <div className="cyberbot-header-info">
              <div className={chatMode === "staff" ? "cyberbot-staff-avatar" : "cyberbot-avatar"}>
                <Icon name={chatMode === "staff" ? "headset" : "bot"} />
              </div>
              <div className="cyberbot-header-titles">
                <h4>{chatMode === "staff" ? (activeStaff?.name || "Chuyên viên tư vấn") : "CyberBot AI"}</h4>
                <p>
                  <span
                    className="cyberbot-status-indicator"
                    style={chatMode === "staff" ? { background: "#10b981" } : {}}
                  />
                  {chatMode === "staff"
                    ? (activeStaff?.role || "Tư vấn viên trực tuyến")
                    : "Trực tuyến 24/7 · Trợ lý TechZone"}
                </p>
              </div>
            </div>
            <div className="cyberbot-header-actions">
              {chatMode === "staff" && (
                <button
                  type="button"
                  className="cyberbot-return-ai-btn"
                  onClick={() => handleSend("end_staff_session")}
                  title="Quay lại với CyberBot AI"
                >
                  <Icon name="bot" />
                  <span>Về AI Bot</span>
                </button>
              )}
              <button
                className="cyberbot-btn-icon"
                onClick={() => {
                  setChatMode("ai");
                  setActiveStaff(null);
                  sessionStorage.removeItem("cyberbot_conv_id");
                  sessionStorage.removeItem("cyberbot_messages");
                  sessionStorage.removeItem("cyberbot_staff");
                  sessionStorage.setItem("cyberbot_mode", "ai");
                  setConversationId("");
                  setMessages([
                    {
                      id: "init_reset",
                      sender: "bot",
                      text: "Đã làm mới cuộc hội thoại! CyberBot có thể hỗ trợ gì cho bạn?",
                      quickActions: [],
                    },
                  ]);
                }}
                title="Làm mới cuộc trò chuyện"
              >
                <Icon name="refresh" />
              </button>
              <button
                className="cyberbot-btn-icon"
                onClick={() => setIsOpen(false)}
                title="Đóng cửa sổ chat"
              >
                <Icon name="x" />
              </button>
            </div>
          </div>

          {/* Staff banner if in staff mode */}
          {chatMode === "staff" && (
            <div className="cyberbot-staff-banner">
              <div className="cyberbot-staff-banner-text">
                <Icon name="headset" />
                <span>Phiên tư vấn trực tiếp cùng <strong>{activeStaff?.name || "Chuyên viên"}</strong></span>
              </div>
              <span className="cyberbot-staff-hotline">Hotline: {activeStaff?.phone || "1900 8888"}</span>
            </div>
          )}

          {/* Messages Area */}
          <div className="cyberbot-messages" ref={messagesContainerRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`cyberbot-msg ${
                  msg.sender === "user" ? "cyberbot-msg-user" : "cyberbot-msg-bot"
                }`}
              >
                {msg.sender === "bot" && (
                  <div
                    className="cyberbot-msg-avatar"
                    style={{
                      background: msg.messageType === "staff_reply" || msg.messageType === "staff_connected" ? "#047857" : "#0f172a",
                    }}
                  >
                    <Icon name={msg.messageType === "staff_reply" || msg.messageType === "staff_connected" ? "headset" : "bot"} />
                  </div>
                )}
                <div className="cyberbot-msg-bubble">
                  {formatMarkdown(msg.text)}

                  {/* Product Cards Carousel UI with Mouse Wheel Horizontal Scroll & Arrows */}
                  <ProductCardsCarousel products={msg.products} navigate={navigate} onAddToCart={(prod) => addToCart(prod.variantId || prod.id, 1)} />

                  {/* Quick Action Buttons */}
                  {msg.quickActions && msg.quickActions.length > 0 && (
                    <div className="cyberbot-actions-container">
                      {msg.quickActions.map((act, actIdx) => (
                        <button
                          key={actIdx}
                          className="cyberbot-action-btn"
                          onClick={() => handleActionClick(act, msg)}
                        >
                          <span>{act.label}</span>
                          <span className="cyberbot-action-arrow">→</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Dots */}
            {loading && (
              <div className="cyberbot-msg cyberbot-msg-bot">
                <div
                  className="cyberbot-msg-avatar"
                  style={{ background: "#0f172a" }}
                >
                  <Icon name="bot" />
                </div>
                <div className="cyberbot-msg-bubble cyberbot-typing-dots">
                  <div className="cyberbot-dot" />
                  <div className="cyberbot-dot" />
                  <div className="cyberbot-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips with Drag & Wheel Scroll */}
          <QuickChipsBar
            suggestions={currentSuggestions}
            onSelect={(item) => {
              if (item.query === "end_staff_session") {
                handleSend("end_staff_session");
              } else {
                handleSend(item.query);
              }
              setTimeout(() => scrollToBottom("smooth"), 60);
            }}
          />

          {/* Input Area */}
          <div className="cyberbot-input-area">
            <input
              className="cyberbot-input"
              type="text"
              placeholder={
                chatMode === "staff"
                  ? "Nhắn tin trao đổi với chuyên viên tư vấn..."
                  : "Hỏi về đơn hàng, bảo hành, linh kiện..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="cyberbot-send-btn"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              title="Gửi tin nhắn"
              style={chatMode === "staff" ? { background: "#059669" } : {}}
            >
              <Icon name="send" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
