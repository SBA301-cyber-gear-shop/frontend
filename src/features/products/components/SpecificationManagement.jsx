import { Button, Heading, Notice, Panel, Badge, Empty, Skeleton } from "@/components/ui";
import { useSpecificationManagement } from "../hooks/useSpecificationManagement";

export function SpecificationManagement() {
  const {
    categories,
    selectedCategory,
    selectedCategoryId,
    allSpecs,
    draft,
    loading,
    saving,
    newName,
    setNewName,
    selectedSpecId,
    setSelectedSpecId,
    choose,
    toggle,
    removeSpec,
    addExistingSpec,
    createNewSpec,
    saveChanges,
  } = useSpecificationManagement();

  const availableSpecsToAdd = allSpecs.filter(
    (s) => !draft.some((d) => d.specificationId === s.id)
  );

  return (
    <>
      <Heading
        title="Danh mục & thông số"
        sub="Cấu hình bộ lọc, thông số nổi bật và kiểm tra tương thích phần cứng theo từng danh mục."
        eyebrow="QUẢN TRỊ / DANH MỤC"
        action={
          <Button
            onClick={saveChanges}
            disabled={saving || loading || !selectedCategory}
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        }
      />

      <div className="catalog-layout">
        <aside className="panel pad">
          <div className="row spread" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Danh mục</h3>
            <Badge tone="neutral">{categories.length}</Badge>
          </div>

          {loading && categories.length === 0 ? (
            <div className="stack">
              <Skeleton style={{ height: 36 }} />
              <Skeleton style={{ height: 36 }} />
              <Skeleton style={{ height: 36 }} />
              <Skeleton style={{ height: 36 }} />
            </div>
          ) : (
            <nav className="spec-tree">
              {categories.map((c) => {
                const count = c.specifications?.length || 0;
                const isActive = selectedCategoryId === c.id;
                return (
                  <button
                    key={c.id}
                    className={`row spread ${isActive ? "active" : ""}`}
                    onClick={() => choose(c.id)}
                    style={{ width: "100%", textAlign: "left" }}
                  >
                    <span>{c.name}</span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        opacity: isActive ? 1 : 0.6,
                        background: isActive ? "rgba(255,255,255,0.2)" : "var(--line)",
                        padding: "2px 8px",
                        borderRadius: 999,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          )}
        </aside>

        <div className="stack">
          <Panel
            title={
              selectedCategory
                ? `Thông số áp dụng cho ${selectedCategory.name} (${draft.length})`
                : "Thông số danh mục"
            }
          >
            {loading ? (
              <div style={{ padding: "32px 0" }}>
                <Skeleton style={{ height: 48, marginBottom: 8 }} />
                <Skeleton style={{ height: 48, marginBottom: 8 }} />
                <Skeleton style={{ height: 48 }} />
              </div>
            ) : draft.length === 0 ? (
              <div
                style={{
                  padding: "48px 24px",
                  textAlign: "center",
                  border: "1px dashed var(--line)",
                  borderRadius: 12,
                  margin: "12px 0 24px",
                  background: "var(--card-subtle, rgba(0,0,0,0.02))",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: 12 }}>⚙️</div>
                <h4 style={{ margin: "0 0 6px 0", color: "var(--ink)" }}>
                  Chưa có thông số nào được gán cho danh mục này
                </h4>
                <p
                  style={{
                    margin: 0,
                    color: "var(--muted)",
                    fontSize: "0.875rem",
                    maxWidth: 460,
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                >
                  Chọn một thông số đã có trong từ điển hệ thống hoặc nhập thông số mới bên dưới để thiết lập bộ lọc và bảng kỹ thuật.
                </p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tên thông số</th>
                      <th style={{ textAlign: "center" }}>Bộ lọc</th>
                      <th style={{ textAlign: "center" }}>Nổi bật</th>
                      <th style={{ textAlign: "center" }}>Mega menu</th>
                      <th style={{ textAlign: "center" }}>Tương thích</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {draft.map((s, i) => (
                      <tr key={s.specificationId || s.name}>
                        <td>
                          <b>{s.name}</b>
                        </td>
                        {[
                          { key: "filter", label: "Bộ lọc" },
                          { key: "primary", label: "Nổi bật" },
                          { key: "menu", label: "Mega menu" },
                          { key: "compatibility", label: "Tương thích" },
                        ].map(({ key, label }) => (
                          <td key={key} style={{ textAlign: "center" }}>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={s[key]}
                              aria-label={`${label} ${s.name}`}
                              className={"toggle " + (s[key] ? "" : "off")}
                              onClick={() => toggle(i, key)}
                            />
                          </td>
                        ))}
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="text-button"
                            style={{ color: "var(--danger, #ef4444)" }}
                            onClick={() => removeSpec(i)}
                          >
                            Gỡ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Thêm thông số vào danh mục */}
            <div
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: "1px solid var(--line)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {/* Option 1: Chọn từ từ điển */}
              <div className="stack" style={{ gap: 8 }}>
                <span className="eyebrow" style={{ fontSize: "0.75rem" }}>
                  CHỌN THÔNG SỐ TỪ TỪ ĐIỂN
                </span>
                <div className="row" style={{ gap: 8 }}>
                  <select
                    className="input flex"
                    value={selectedSpecId}
                    onChange={(e) => setSelectedSpecId(e.target.value)}
                    disabled={loading || availableSpecsToAdd.length === 0}
                  >
                    <option value="">
                      {availableSpecsToAdd.length === 0
                        ? "-- Đã thêm tất cả thông số hiện có --"
                        : "-- Chọn thông số có sẵn --"}
                    </option>
                    {availableSpecsToAdd.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    tone="secondary"
                    disabled={!selectedSpecId || loading}
                    onClick={() => addExistingSpec(selectedSpecId)}
                  >
                    + Thêm
                  </Button>
                </div>
              </div>

              {/* Option 2: Tạo thông số mới */}
              <div className="stack" style={{ gap: 8 }}>
                <span className="eyebrow" style={{ fontSize: "0.75rem" }}>
                  HOẶC TẠO THÔNG SỐ MỚI
                </span>
                <div className="row" style={{ gap: 8 }}>
                  <input
                    className="input flex"
                    aria-label="Tên thông số mới"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="VD: Chuẩn Wi-Fi, Led RGB..."
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        createNewSpec();
                      }
                    }}
                  />
                  <Button
                    tone="secondary"
                    disabled={!newName.trim() || loading}
                    onClick={createNewSpec}
                  >
                    + Tạo mới
                  </Button>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Xem trước cách hiển thị">
            <div className="two-col">
              <div>
                <div className="eyebrow">BỘ LỌC TÌM KIẾM SẢN PHẨM</div>
                <div className="chips" style={{ minHeight: 32, marginTop: 8 }}>
                  {draft.filter((s) => s.filter).length === 0 ? (
                    <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                      Chưa có thông số nào được bật làm bộ lọc
                    </span>
                  ) : (
                    draft
                      .filter((s) => s.filter)
                      .map((s) => (
                        <span className="chip" key={s.name}>
                          {s.name}
                        </span>
                      ))
                  )}
                </div>

                <div className="eyebrow" style={{ marginTop: 20 }}>
                  QUY TẮC TƯƠNG THÍCH PC BUILDER
                </div>
                <div className="chips" style={{ minHeight: 32, marginTop: 8 }}>
                  {draft.filter((s) => s.compatibility).length === 0 ? (
                    <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                      Chưa cấu hình kiểm tra tương thích cho danh mục này
                    </span>
                  ) : (
                    draft
                      .filter((s) => s.compatibility)
                      .map((s) => (
                        <span
                          className="chip"
                          key={s.name}
                          style={{ borderColor: "var(--accent)" }}
                        >
                          ⚡ {s.name}
                        </span>
                      ))
                  )}
                </div>
              </div>

              <div>
                <div className="eyebrow">THÔNG SỐ NỔI BẬT TRÊN THẺ</div>
                <div className="chips" style={{ minHeight: 32, marginTop: 8 }}>
                  {draft.filter((s) => s.primary).length === 0 ? (
                    <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                      Chưa có thông số nổi bật
                    </span>
                  ) : (
                    draft
                      .filter((s) => s.primary)
                      .map((s) => (
                        <span className="chip active" key={s.name}>
                          ★ {s.name}
                        </span>
                      ))
                  )}
                </div>

                <div className="eyebrow" style={{ marginTop: 20 }}>
                  MEGA MENU DANH MỤC
                </div>
                <div style={{ minHeight: 32, marginTop: 8 }}>
                  {draft.filter((s) => s.menu).length === 0 ? (
                    <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                      Chưa đưa thông số nào vào Mega Menu
                    </span>
                  ) : (
                    <div className="chips">
                      {draft
                        .filter((s) => s.menu)
                        .map((s) => (
                          <span
                            className="chip"
                            key={s.name}
                            style={{ background: "rgba(0,0,0,0.04)" }}
                          >
                            {s.name}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          <Notice tone="neutral">
            💡 <b>Ghi chú:</b> Cấu hình bộ lọc và thông số nổi bật sẽ tự động áp dụng lên trang Danh mục cửa hàng &amp; Công cụ xây dựng cấu hình PC. Sau khi tùy chỉnh, hãy nhấn nút <b>"Lưu thay đổi"</b> ở góc trên bên phải.
          </Notice>
        </div>
      </div>
    </>
  );
}
