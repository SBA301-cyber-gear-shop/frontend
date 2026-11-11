import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { Button, Empty, Heading, Modal, Notice, Steps } from "@/components/ui";
import { CartActionBar } from "./CartActionBar";
import { CartSetCard } from "./CartSetCard";
import { CartLooseItem } from "./CartLooseItem";
import { CartSummary } from "./CartSummary";
import { isCartPcSet } from "../domain/pcBuildSets";

const STORAGE_PC_SETS = "techzone_pc_build_sets";
const STORAGE_SELECTED_IDS = "techzone_cart_selected_ids";
const STORAGE_CHECKOUT_SELECTED = "techzone_checkout_selected_ids";

export function CartView() {
  const {
    data,
    totalCount,
    hasRam,
    updateQuantity,
    removeFromCart,
    removeMultiple,
    user,
    demoMode,
    cartLoading,
    cartError,
    cartBusy,
    reloadCart,
  } = useCart();

  const navigate = useNavigate();

  // Confirmation Modal State (replaces all window.confirm)
  const [modalConfig, setModalConfig] = useState(null);

  // Local storage build sets state
  const [pcBuildSets, setPcBuildSets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_PC_SETS) || "[]");
    } catch {
      return [];
    }
  });

  // Track whether initial cart sync has taken place to avoid premature sessionStorage wipes
  const isCartReadyRef = useRef(false);

  // Track selected cart item IDs (Set of strings) persisted in sessionStorage
  const [selectedIds, setSelectedIds] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_SELECTED_IDS);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return new Set(parsed.map(String));
        }
      }
    } catch {}
    return new Set(data.cart ? data.cart.map((line) => String(line.cartItemId ?? line.id)) : []);
  });

  // Keep selectedIds in sync when cart changes (e.g. items added or deleted)
  useEffect(() => {
    if (cartLoading) return; // Do NOT clear selection while cart is still loading

    if (!data.cart || data.cart.length === 0) {
      if (isCartReadyRef.current) {
        setSelectedIds(new Set());
        try {
          sessionStorage.removeItem(STORAGE_SELECTED_IDS);
          sessionStorage.removeItem(STORAGE_CHECKOUT_SELECTED);
        } catch {}
      }
      return;
    }

    const currentIds = new Set(data.cart.map((line) => String(line.cartItemId ?? line.id)));

    setSelectedIds((prev) => {
      let storedSet = null;
      try {
        const stored = sessionStorage.getItem(STORAGE_SELECTED_IDS);
        if (stored !== null) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            storedSet = new Set(parsed.map(String));
          }
        }
      } catch {}

      // If user has an existing selection (in prev state or in sessionStorage)
      const baseSet = prev && prev.size > 0 ? prev : storedSet;
      if (baseSet !== null) {
        const retained = new Set();
        for (const id of baseSet) {
          if (currentIds.has(id)) retained.add(id);
        }
        // If user intentionally unchecked all items (empty array in storage)
        if (storedSet !== null && storedSet.size === 0) {
          return new Set();
        }
        if (retained.size > 0) return retained;
      }
      return currentIds;
    });

    isCartReadyRef.current = true;
  }, [data.cart, cartLoading]);

  // Save selectedIds to sessionStorage whenever selection changes and cart is ready
  useEffect(() => {
    if (!isCartReadyRef.current && (!data.cart || data.cart.length === 0)) {
      return; // Do NOT overwrite sessionStorage before cart items are loaded
    }
    try {
      const arr = Array.from(selectedIds);
      sessionStorage.setItem(STORAGE_SELECTED_IDS, JSON.stringify(arr));
      sessionStorage.setItem(STORAGE_CHECKOUT_SELECTED, JSON.stringify(arr));
      sessionStorage.setItem("techzone_checkout_selected_cart_item_ids", JSON.stringify(arr));
    } catch {}
  }, [selectedIds, data.cart]);

  // Group items into PC Build Sets vs Loose Products
  const { groupedSets, looseItems } = useMemo(() => {
    const cartLines = data.cart;
    const sets = [];
    const claimedCartItemIds = new Set();

    // 1. Nhóm theo pcCustomId từ DB (Nguồn sự thật chuẩn xác nhất từ Backend)
    const pcGroupMap = new Map();
    for (const line of cartLines) {
      if (line.pcCustomId) {
        if (!pcGroupMap.has(line.pcCustomId)) {
          pcGroupMap.set(line.pcCustomId, []);
        }
        pcGroupMap.get(line.pcCustomId).push(line);
        claimedCartItemIds.add(String(line.cartItemId ?? line.id));
      }
    }

    for (const [pcCustomId, items] of pcGroupMap.entries()) {
      const matchedLocalMeta = pcBuildSets.find((s) => String(s.id) === String(pcCustomId));
      sets.push({
        setMeta: {
          id: pcCustomId,
          name: items[0]?.pcCustomName || matchedLocalMeta?.name || `Bộ PC #${pcCustomId}`,
          itemVariantIds: items.map((i) => String(i.id)),
          parts: matchedLocalMeta?.parts || [],
        },
        items,
      });
    }

    // 2. Fallback duy nhất cho phiên khách vãng lai (không có pcCustomId trong DB)
    if (pcGroupMap.size === 0) {
      for (const buildSet of pcBuildSets) {
        if (!Array.isArray(buildSet.itemVariantIds) || buildSet.itemVariantIds.length === 0) {
          continue;
        }
        const setVariants = new Set(buildSet.itemVariantIds.map(String));
        const matchingLines = cartLines.filter(
          (line) => !claimedCartItemIds.has(String(line.cartItemId ?? line.id)) && setVariants.has(String(line.id))
        );

        if (matchingLines.length >= buildSet.itemVariantIds.length && matchingLines.length >= 2) {
          sets.push({
            setMeta: buildSet,
            items: matchingLines,
          });
          matchingLines.forEach((l) => claimedCartItemIds.add(String(l.cartItemId ?? l.id)));
        }
      }
    }

    // 3. Toàn bộ các dòng còn lại (kể cả linh kiện có cùng variantId với bộ PC) là hàng mua lẻ độc lập
    const loose = cartLines.filter((line) => !claimedCartItemIds.has(String(line.cartItemId ?? line.id)));

    return { groupedSets: sets, looseItems: loose };
  }, [data.cart, pcBuildSets]);

  // Calculate selection metrics
  const selectedLines = useMemo(() => {
    return data.cart.filter((line) => selectedIds.has(String(line.cartItemId ?? line.id)));
  }, [data.cart, selectedIds]);

  const selectedVariantIds = useMemo(() => {
    return Array.from(new Set(selectedLines.map((line) => Number(line.id))));
  }, [selectedLines]);

  const selectedCount = useMemo(() => {
    return selectedLines.reduce((sum, line) => sum + line.quantity, 0);
  }, [selectedLines]);

  const selectedTotalAmount = useMemo(() => {
    return selectedLines.reduce((sum, line) => {
      const p = data.products.find((prod) => prod.id === line.id);
      const unitPrice = line.unitPrice ?? p?.price ?? 0;
      return sum + unitPrice * line.quantity;
    }, 0);
  }, [selectedLines, data.products]);

  const isAllSelected = data.cart.length > 0 && selectedLines.length === data.cart.length;

  // Selected sets breakdown
  const selectedSetsCount = useMemo(() => {
    return groupedSets.filter((s) => s.items.some((i) => selectedIds.has(String(i.cartItemId ?? i.id)))).length;
  }, [groupedSets, selectedIds]);

  const selectedLooseCount = useMemo(() => {
    return looseItems.filter((i) => selectedIds.has(String(i.cartItemId ?? i.id))).length;
  }, [looseItems, selectedIds]);

  // Handlers for Checkbox toggling
  const handleToggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(data.cart.map((line) => String(line.cartItemId ?? line.id))));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSet = (setId, checked) => {
    const setObj = groupedSets.find((s) => s.setMeta.id === setId);
    if (!setObj) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      setObj.items.forEach((item) => {
        const key = String(item.cartItemId ?? item.id);
        if (checked) next.add(key);
        else next.delete(key);
      });
      return next;
    });
  };

  const handleToggleLooseItem = (cartItemId, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(String(cartItemId));
      else next.delete(String(cartItemId));
      return next;
    });
  };

  // Navigate to PC Builder with this specific build loaded
  const handleEditInBuilder = (setMeta) => {
    navigate(`/build-pc?editBuildId=${setMeta.id}`);
  };

  // Ungroup PC Set
  const executeUngroupSet = (setId) => {
    const updated = pcBuildSets.filter((s) => s.id !== setId);
    setPcBuildSets(updated);
    try {
      localStorage.setItem(STORAGE_PC_SETS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestUngroupSet = (setMeta) => {
    setModalConfig({
      title: "Tách bộ PC thành linh kiện mua lẻ?",
      message: `Bạn đang chọn tách bộ máy "${setMeta.name || "Bộ PC"}" thành các linh kiện mua lẻ riêng biệt.`,
      warning:
        "⚠️ Lưu ý quan trọng: Khi tách lẻ, bạn sẽ không còn được hưởng ưu đãi 'Miễn phí công lắp ráp & Test máy 100%' và chính sách 'Bảo hành nguyên bộ máy' của TechZone Pro. Các linh kiện sẽ được đóng gói dưới dạng linh kiện rời nguyên hộp.",
      confirmText: "Xác nhận tách mua lẻ",
      tone: "primary",
      onConfirm: async () => {
        if (!demoMode && Number.isInteger(Number(setMeta.id))) {
          try {
            await cartApi.detachPcSet(Number(setMeta.id));
            await reloadCart();
          } catch (err) {
            console.error("[Cart] Lỗi tách bộ PC:", err);
          }
        }
        executeUngroupSet(setMeta.id);
      },
    });
  };

  // Delete Set
  const handleRequestDeleteSet = (setMeta, items) => {
    setModalConfig({
      title: "Xác nhận xóa bộ PC khỏi giỏ hàng?",
      message: `Bạn có chắc muốn xóa toàn bộ bộ máy "${setMeta.name || "Bộ PC"}" (${items.length} linh kiện) khỏi giỏ hàng?`,
      warning: "Toàn bộ linh kiện thuộc bộ máy này sẽ bị gỡ khỏi giỏ hàng.",
      confirmText: "Xóa cả bộ máy",
      tone: "danger",
      onConfirm: async () => {
        if (!demoMode && Number.isInteger(Number(setMeta.id))) {
          try {
            await cartApi.removePcSet(Number(setMeta.id));
            await reloadCart();
          } catch (err) {
            console.error("[Cart] Lỗi xóa bộ PC:", err);
          }
        } else {
          const itemIds = items.map((i) => String(i.cartItemId ?? i.id));
          await removeMultiple(itemIds);
        }
        executeUngroupSet(setMeta.id);
      },
    });
  };

  // Delete single loose item
  const handleRequestDeleteLooseItem = (item) => {
    setModalConfig({
      title: "Xác nhận xóa sản phẩm?",
      message: `Bạn có chắc muốn xóa sản phẩm "${item.name || "sản phẩm"}" khỏi giỏ hàng?`,
      confirmText: "Xóa sản phẩm",
      tone: "danger",
      onConfirm: async () => {
        await removeFromCart(item.cartItemId ?? item.id);
      },
    });
  };

  // Bulk Delete Selected
  const handleRequestDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setModalConfig({
      title: "Xác nhận xóa các mục đã chọn?",
      message: `Bạn có chắc muốn xóa ${selectedCount} sản phẩm đang được chọn khỏi giỏ hàng?`,
      warning: "Thao tác này sẽ xóa tất cả sản phẩm đang tick chọn khỏi giỏ hàng của bạn.",
      confirmText: `Xóa ${selectedCount} sản phẩm`,
      tone: "danger",
      onConfirm: async () => {
        const idsToDelete = Array.from(selectedIds);
        await removeMultiple(idsToDelete);
        setSelectedIds(new Set());
      },
    });
  };

  // Auth / Empty / Loading / Error Guards
  if (!demoMode && !user) {
    return (
      <Empty
        title="Đăng nhập để xem giỏ hàng"
        action={
          <Button to="/dang-nhap" state={{ from: "/gio-hang" }}>
            Đăng nhập
          </Button>
        }
      />
    );
  }

  if (cartLoading && !data.cart.length) {
    return <Notice>Đang tải giỏ hàng…</Notice>;
  }

  if (cartError) {
    return (
      <div className="stack">
        <Notice tone="danger">{cartError}</Notice>
        <Button onClick={() => reloadCart()}>Tải lại giỏ hàng</Button>
      </div>
    );
  }

  if (!data.cart.length) {
    return (
      <div className="cart-page-container">
        <Heading title="Giỏ hàng của bạn" />
        <Empty
          title="Giỏ hàng đang trống"
          description="Bắt đầu xây dựng góc máy chuyên nghiệp hoặc cấu hình PC thông minh với AI ngay hôm nay."
          action={
            <div className="cart-empty-actions">
              <Button to="/build-pc">⚡ Xây dựng cấu hình PC với AI</Button>
              <Button to="/san-pham" tone="secondary">Khám phá linh kiện →</Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="cart-page-container">
      {/* Page Header */}
      <Heading
        title="Giỏ hàng của bạn"
        sub={`${data.cart.length} phiên bản · ${totalCount} sản phẩm${groupedSets.length > 0 ? ` (trong đó có ${groupedSets.length} bộ máy PC)` : ""}`}
        action={
          <Button to="/san-pham" tone="secondary">
            ← Tiếp tục mua sắm
          </Button>
        }
      />

      {/* Modern Checkout Stepper */}
      <Steps
        labels={["Giỏ hàng", "Thông tin & thanh toán", "Theo dõi đơn"]}
        current={0}
      />

      {/* Master Action Bar */}
      <CartActionBar
        totalItemsCount={totalCount}
        selectedItemsCount={selectedCount}
        isAllSelected={isAllSelected}
        onToggleSelectAll={handleToggleSelectAll}
        onDeleteSelected={handleRequestDeleteSelected}
        disabled={cartBusy || cartLoading}
      />

      {/* Main Two-Column Layout */}
      <div className="cart-main-grid">
        {/* Left Column: Cart Items */}
        <div className="cart-items-column">
          {/* 1. PC Build Sets */}
          {groupedSets.length > 0 && (
            <div className="cart-section-sets">
              {groupedSets.map((s) => (
                <CartSetCard
                  key={s.setMeta.id}
                  set={s.setMeta}
                  items={s.items}
                  products={data.products}
                  selectedIds={selectedIds}
                  onToggleSet={handleToggleSet}
                  onEditInBuilder={handleEditInBuilder}
                  onRequestUngroupSet={handleRequestUngroupSet}
                  onRequestDeleteSet={handleRequestDeleteSet}
                  disabled={cartBusy || cartLoading}
                />
              ))}
            </div>
          )}

          {/* 2. Loose Products */}
          {looseItems.length > 0 && (
            <div className="cart-section-loose">
              <div className="cart-section-heading">
                <h3>
                  Sản phẩm & Phụ kiện mua lẻ ({looseItems.length} sản phẩm)
                </h3>
              </div>

              <div className="cart-loose-list">
                {looseItems.map((item) => {
                  const product = data.products.find((p) => p.id === item.id);
                  const isSelected = selectedIds.has(String(item.cartItemId ?? item.id));

                  return (
                    <CartLooseItem
                      key={item.cartItemId ?? item.id}
                      item={item}
                      product={product}
                      isSelected={isSelected}
                      onToggleSelect={handleToggleLooseItem}
                      onUpdateQuantity={updateQuantity}
                      onRequestDelete={handleRequestDeleteLooseItem}
                      disabled={cartBusy || cartLoading}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Logistics Note */}
          <Notice>
            Nhận hàng trực tiếp tại cửa hàng. Thông tin người nhận được xác nhận ở bước tiếp theo.
          </Notice>

          {/* RAM Check Notification if applicable */}
          {hasRam && (
            <div className="cart-ram-notice">
              <strong>💡 Lưu ý về cấu hình RAM:</strong> RAM được tính theo từng thanh. Nếu bạn mua kit 2 thanh hoặc muốn kích hoạt Dual Channel, vui lòng kiểm tra số lượng thanh tương ứng trong cấu hình.
            </div>
          )}
        </div>

        {/* Right Column: Order Summary */}
        <CartSummary
          selectedCount={selectedCount}
          selectedSetsCount={selectedSetsCount}
          selectedLooseCount={selectedLooseCount}
          selectedTotalAmount={selectedTotalAmount}
          selectedVariantIds={selectedVariantIds}
          selectedCartItemIds={Array.from(selectedIds)}
          hasSelectedPcSet={groupedSets.length > 0}
          cartBusy={cartBusy}
          cartLoading={cartLoading}
        />
      </div>

      {/* Custom Confirmation Modal */}
      {modalConfig && (
        <Modal title={modalConfig.title} onClose={() => setModalConfig(null)}>
          <div className="cart-modal-content">
            <p className="cart-modal-message">{modalConfig.message}</p>
            {modalConfig.warning && (
              <div className={`cart-modal-warning ${modalConfig.tone === "danger" ? "danger" : "amber"}`}>
                {modalConfig.warning}
              </div>
            )}
            <div className="cart-modal-actions">
              <Button
                tone="secondary"
                onClick={() => setModalConfig(null)}
                disabled={cartBusy || cartLoading}
              >
                Hủy bỏ
              </Button>
              <Button
                tone={modalConfig.tone || "danger"}
                onClick={async () => {
                  await modalConfig.onConfirm();
                  setModalConfig(null);
                }}
                disabled={cartBusy || cartLoading}
              >
                {cartBusy ? "Đang xử lý..." : modalConfig.confirmText || "Xác nhận"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
