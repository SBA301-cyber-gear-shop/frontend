import { useState } from "react";
import { categories } from "../data/seed";
import { useStore } from "../state/context";
import { money } from "../domain/commerce";
import {
  Art,
  Badge,
  Button,
  Field,
  Heading,
  KV,
  Notice,
  Panel,
  Select,
} from "../components/ui";
export function AdminProduct() {
  const { data } = useStore(),
    [selected, setSelected] = useState("ram16");
  return (
    <>
      <Heading
        title="Sản phẩm & phiên bản"
        sub="Thông tin chung của sản phẩm và dữ liệu của từng SKU."
        eyebrow="QUẢN TRỊ / SẢN PHẨM"
        action={
          <Button onClick={() => setSelected("new")}>+ Thêm sản phẩm</Button>
        }
      />
      <select
        className="input section-title"
        aria-label="Chọn sản phẩm quản trị"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="new">Tạo sản phẩm mới</option>
        {data.products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} · {p.variant}
          </option>
        ))}
      </select>
      <ProductEditor
        key={selected}
        product={data.products.find((p) => p.id === selected)}
        onCreated={setSelected}
      />
    </>
  );
}
function ProductEditor({ product, onCreated }) {
  const { commit, notify } = useStore();
  const [form, setForm] = useState(
    product || {
      name: "",
      productId: "",
      brand: "",
      category: "ram",
      variant: "",
      sku: "",
      price: 0,
      originalPrice: 0,
      stock: 0,
      warranty: 36,
      status: "draft",
      image: "",
      description: "",
      specs: {},
      tech: {},
    },
  );
  const [specText, setSpecText] = useState(
    Object.entries(form.specs)
      .map(([k, v]) => k + ": " + v)
      .join("\n"),
  );
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  function save(status) {
    try {
      if (
        !form.name.trim() ||
        !form.brand.trim() ||
        !form.sku.trim() ||
        !form.variant.trim()
      )
        throw new Error("Nhập đủ tên, thương hiệu, SKU và phiên bản.");
      if (
        !Number.isFinite(Number(form.price)) ||
        Number(form.price) <= 0 ||
        !Number.isInteger(Number(form.stock)) ||
        Number(form.stock) < 0 ||
        !Number.isInteger(Number(form.warranty)) ||
        Number(form.warranty) < 0
      )
        throw new Error("Kiểm tra giá, tồn kho và thời hạn bảo hành.");
      if (form.image && !/^(https?:\/\/|\/(?!\/))/.test(form.image))
        throw new Error("Ảnh phải là URL http(s) hoặc đường dẫn nội bộ.");
      const specs = {};
      for (const line of specText.split("\n").filter((l) => l.trim())) {
        const pos = line.indexOf(":");
        if (pos < 1 || !line.slice(pos + 1).trim())
          throw new Error(
            "Nhập thông số theo dạng Tên: Giá trị, mỗi dòng một thông số.",
          );
        const key = line.slice(0, pos).trim();
        if (specs[key]) throw new Error("Thông số bị trùng: " + key);
        specs[key] = line.slice(pos + 1).trim();
      }
      const id = product?.id || crypto.randomUUID(),
        value = {
          ...form,
          id,
          productId: form.productId || id,
          price: Number(form.price),
          originalPrice: Number(form.originalPrice),
          stock: Number(form.stock),
          warranty: Number(form.warranty),
          sku: form.sku.trim().toUpperCase(),
          specs,
          status,
        };
      // Changing raw display specifications invalidates the separate demo compatibility data.
      if (
        product &&
        (specText !==
          Object.entries(product.specs)
            .map(([k, v]) => k + ": " + v)
            .join("\n") ||
          form.category !== product.category)
      )
        value.tech = {};
      commit((d) => {
        if (d.products.some((p) => p.id !== id && p.sku === value.sku))
          throw new Error("SKU đã được sử dụng.");
        return {
          ...d,
          products: product
            ? d.products.map((p) => (p.id === id ? value : p))
            : [...d.products, value],
        };
      });
      notify("Đã lưu sản phẩm demo.");
      if (!product) onCreated(id);
    } catch (e) {
      notify(e.message, "danger");
    }
  }
  return (
    <>
      <div className="split">
        <div className="stack">
          <Panel title="Thông tin sản phẩm">
            <div className="two-col">
              <Field
                label="Tên sản phẩm *"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
              <Field
                label="Thương hiệu *"
                value={form.brand}
                onChange={(e) => update("brand", e.target.value)}
              />
              <Select
                label="Danh mục"
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
              <Field
                label="Bảo hành (tháng)"
                type="number"
                min="0"
                value={form.warranty}
                onChange={(e) => update("warranty", e.target.value)}
              />
            </div>
            <div className="section">
              <Field label="Mô tả">
                {(id) => (
                  <textarea
                    id={id}
                    className="input full"
                    value={form.description || ""}
                    onChange={(e) => update("description", e.target.value)}
                  />
                )}
              </Field>
            </div>
          </Panel>
          <Panel title="Phiên bản đang chỉnh sửa">
            <div className="two-col">
              <Field
                label="Tên phiên bản *"
                value={form.variant}
                onChange={(e) => update("variant", e.target.value)}
              />
              <Field
                label="Mã SKU *"
                value={form.sku}
                onChange={(e) => update("sku", e.target.value)}
              />
              <Field
                label="Giá bán (₫)"
                type="number"
                min="1"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
              <Field
                label="Giá gốc (₫)"
                type="number"
                min="0"
                value={form.originalPrice}
                onChange={(e) => update("originalPrice", e.target.value)}
              />
              <Field
                label="Lượng còn có thể bán"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => update("stock", e.target.value)}
              />
              <Field
                label="Mã nhóm sản phẩm"
                hint="Cùng mã nhóm để liên kết các phiên bản."
                value={form.productId}
                onChange={(e) => update("productId", e.target.value)}
              />
            </div>
            <div className="section">
              <Field
                label="URL ảnh phiên bản"
                value={form.image}
                onChange={(e) => update("image", e.target.value)}
                placeholder="/assets/... hoặc https://..."
              />
            </div>
          </Panel>
          <Panel title="Thông số của phiên bản">
            <Field
              label="Tên thông số: Giá trị"
              hint="Mỗi dòng một thông số. Dữ liệu kỹ thuật cần kiểm chứng trước khi đưa vào bộ kiểm tra build."
            >
              {(id) => (
                <textarea
                  id={id}
                  className="input full mono"
                  rows="7"
                  value={specText}
                  onChange={(e) => setSpecText(e.target.value)}
                  placeholder={"Chuẩn RAM: DDR5\nDung lượng: 16GB"}
                />
              )}
            </Field>
          </Panel>
        </div>
        <aside className="stack">
          <Panel title="Xem trước phiên bản">
            <Art type={form.category} image={form.image} name={form.name} />
            <div className="eyebrow section">{form.brand || "THƯƠNG HIỆU"}</div>
            <h3>{form.name || "Tên sản phẩm"}</h3>
            <p className="muted small">{form.variant}</p>
            <div className="price section">{money(Number(form.price))}</div>
            <Badge tone={form.status === "active" ? "success" : "warning"}>
              {form.status === "active" ? "Đang bán" : "Bản nháp"}
            </Badge>
          </Panel>
          <Notice tone="neutral">
            Giá mới áp dụng cho lần mua tiếp theo. Giá chụp trong đơn đã đặt
            được giữ nguyên.
          </Notice>
        </aside>
      </div>
      <div className="editor-actions">
        <p className="small muted">Chỉ áp dụng thay đổi sau khi lưu.</p>
        <div className="row">
          <Button tone="secondary" onClick={() => save("draft")}>
            Lưu nháp
          </Button>
          <Button onClick={() => save("active")}>Lưu & đăng bán</Button>
        </div>
      </div>
    </>
  );
}
export function AdminSpecs() {
  const { data, commit, notify } = useStore(),
    [category, setCategory] = useState("ram"),
    [newName, setNewName] = useState(""),
    [draft, setDraft] = useState(data.specSettings.ram || []);
  function choose(id) {
    setCategory(id);
    setDraft(data.specSettings[id] || []);
  }
  function toggle(i, key) {
    setDraft((d) => d.map((s, n) => (n === i ? { ...s, [key]: !s[key] } : s)));
  }
  return (
    <>
      <Heading
        title="Danh mục & thông số"
        sub="Cấu hình bộ lọc và các thông số nổi bật của từng danh mục."
        eyebrow="QUẢN TRỊ / DANH MỤC"
        action={
          <Button
            onClick={() => {
              commit((d) => ({
                ...d,
                specSettings: { ...d.specSettings, [category]: draft },
              }));
              notify("Đã lưu cấu hình thông số.");
            }}
          >
            Lưu thay đổi
          </Button>
        }
      />
      <div className="catalog-layout">
        <aside className="panel pad">
          <h3>Danh mục</h3>
          <nav className="spec-tree">
            {categories.map((c) => (
              <button
                className={category === c.id ? "active" : ""}
                onClick={() => choose(c.id)}
                key={c.id}
              >
                {c.name}
              </button>
            ))}
          </nav>
        </aside>
        <div className="stack">
          <Panel
            title={
              "Thông số áp dụng cho " +
              categories.find((c) => c.id === category)?.name
            }
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tên thông số</th>
                    <th>Bộ lọc</th>
                    <th>Nổi bật</th>
                    <th>Mega menu</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {draft.map((s, i) => (
                    <tr key={s.name}>
                      <td>
                        <b>{s.name}</b>
                      </td>
                      {["filter", "primary", "menu"].map((k, j) => (
                        <td key={k}>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={s[k]}
                            aria-label={
                              ["Bộ lọc", "Nổi bật", "Menu"][j] + " " + s.name
                            }
                            className={"toggle " + (s[k] ? "" : "off")}
                            onClick={() => toggle(i, k)}
                          />
                        </td>
                      ))}
                      <td>
                        <button
                          className="text-button"
                          onClick={() =>
                            setDraft((d) => d.filter((_, n) => n !== i))
                          }
                        >
                          Gỡ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row section">
              <input
                className="input flex"
                aria-label="Tên thông số mới"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Tên thông số mới"
              />
              <Button
                tone="secondary"
                onClick={() => {
                  if (
                    !newName.trim() ||
                    draft.some(
                      (s) =>
                        s.name.toLowerCase() === newName.trim().toLowerCase(),
                    )
                  )
                    return notify("Thông số trống hoặc bị trùng.", "danger");
                  setDraft([
                    ...draft,
                    {
                      name: newName.trim(),
                      filter: false,
                      primary: false,
                      menu: false,
                    },
                  ]);
                  setNewName("");
                }}
              >
                + Thêm thông số
              </Button>
            </div>
          </Panel>
          <Panel title="Xem trước cách hiển thị">
            <div className="two-col">
              <div>
                <div className="eyebrow">BỘ LỌC DANH MỤC</div>
                {draft
                  .filter((s) => s.filter)
                  .map((s) => (
                    <div className="section" key={s.name}>
                      <b>{s.name}</b>
                      <div className="chips">
                        {[
                          ...new Set(
                            data.products
                              .filter((p) => p.category === category)
                              .map((p) => p.specs[s.name])
                              .filter(Boolean),
                          ),
                        ].map((v) => (
                          <span className="chip" key={v}>
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
              <div>
                <div className="eyebrow">THÔNG SỐ NỔI BẬT</div>
                <div className="chips">
                  {draft
                    .filter((s) => s.primary)
                    .map((s) => (
                      <span className="chip active" key={s.name}>
                        {s.name}
                      </span>
                    ))}
                </div>
                <div className="eyebrow section">MEGA MENU</div>
                {draft
                  .filter((s) => s.menu)
                  .map((s) => (
                    <p className="small" key={s.name}>
                      {s.name}
                    </p>
                  ))}
              </div>
            </div>
          </Panel>
          <Notice tone="neutral">
            Cấu hình hiển thị không thay thế quy tắc kiểm tra tương thích phần
            cứng.
          </Notice>
        </div>
      </div>
    </>
  );
}
export function AdminPromotion() {
  const { data, commit, notify } = useStore(),
    [p, setP] = useState({ ...data.promotions[0] });
  const set = (k, v) => setP((f) => ({ ...f, [k]: v })),
    used = data.usages.filter(
      (u) => u.code === p.code && u.status === "USED",
    ).length,
    reserved = data.usages.filter(
      (u) => u.code === p.code && u.status === "RESERVED",
    ).length;
  function save(e) {
    e.preventDefault();
    try {
      if (
        !p.code.trim() ||
        !p.name.trim() ||
        Number(p.value) <= 0 ||
        !Number.isInteger(Number(p.limit)) ||
        Number(p.limit) < used + reserved ||
        Number(p.limit) < 1
      )
        throw new Error("Kiểm tra mã, tên, mức giảm và hạn mức.");
      if (p.type === "percentage" && Number(p.value) > 100)
        throw new Error("Phần trăm giảm phải từ 0 đến 100.");
      if (!p.start || !p.end || new Date(p.start) >= new Date(p.end))
        throw new Error("Ngày kết thúc phải sau ngày bắt đầu.");
      if (!p.bannerLink.startsWith("/") || p.bannerLink.startsWith("//"))
        throw new Error("Dùng đường dẫn nội bộ, ví dụ /san-pham.");
      const saved = {
        ...p,
        code: p.code.trim().toUpperCase(),
        value: Number(p.value),
        limit: Number(p.limit),
        bannerOrder: Number(p.bannerOrder) || 0,
      };
      commit((d) => {
        const old = d.promotions.find((x) => x.id === p.id);
        if (
          old.code !== saved.code &&
          d.usages.some((u) => u.code === old.code)
        )
          throw new Error("Mã đã có lượt sử dụng không được đổi.");
        return {
          ...d,
          promotions: d.promotions.map((x) => (x.id === p.id ? saved : x)),
        };
      });
      notify("Đã lưu khuyến mãi và banner.");
    } catch (err) {
      notify(err.message, "danger");
    }
  }
  return (
    <>
      <Heading
        title={"Chương trình " + p.code}
        sub="Quản lý mã giảm giá và banner liên kết."
        eyebrow="QUẢN TRỊ / KHUYẾN MÃI"
      />
      <form onSubmit={save}>
        <div className="split">
          <div className="stack">
            <Panel
              title="Thông tin khuyến mãi"
              action={
                <Badge tone={p.active ? "success" : "neutral"}>
                  {p.active ? "Đang bật" : "Đã tắt"}
                </Badge>
              }
            >
              <div className="two-col">
                <Field
                  label="Mã giảm giá"
                  value={p.code}
                  required
                  onChange={(e) => set("code", e.target.value)}
                />
                <Field
                  label="Tên chương trình"
                  value={p.name}
                  required
                  onChange={(e) => set("name", e.target.value)}
                />
                <Select
                  label="Loại giảm giá"
                  value={p.type}
                  onChange={(e) => set("type", e.target.value)}
                  options={[
                    { value: "fixed_amount", label: "Số tiền cố định" },
                    { value: "percentage", label: "Phần trăm" },
                  ]}
                />
                <Field
                  label={
                    "Giá trị giảm " + (p.type === "percentage" ? "(%)" : "(₫)")
                  }
                  type="number"
                  min="1"
                  value={p.value}
                  required
                  onChange={(e) => set("value", e.target.value)}
                />
                <Field
                  label="Tổng lượt sử dụng"
                  type="number"
                  min="1"
                  value={p.limit}
                  required
                  onChange={(e) => set("limit", e.target.value)}
                />
                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked={p.active}
                    onChange={(e) => set("active", e.target.checked)}
                  />
                  Kích hoạt chương trình
                </label>
                <Field
                  label="Bắt đầu"
                  type="datetime-local"
                  value={p.start}
                  required
                  onChange={(e) => set("start", e.target.value)}
                />
                <Field
                  label="Kết thúc"
                  type="datetime-local"
                  value={p.end}
                  required
                  onChange={(e) => set("end", e.target.value)}
                />
              </div>
              <div className="section">
                <Notice>
                  Mỗi đơn áp dụng một mã. Mỗi khách sử dụng chương trình một
                  lần.
                </Notice>
              </div>
            </Panel>
            <Panel title="Banner liên kết">
              <Field
                label="Tiêu đề"
                value={p.bannerTitle}
                required
                onChange={(e) => set("bannerTitle", e.target.value)}
              />
              <Field
                label="Ảnh banner"
                value={p.bannerImage}
                onChange={(e) => set("bannerImage", e.target.value)}
              />
              <div className="two-col section">
                <Field
                  label="Đường dẫn khi nhấn"
                  value={p.bannerLink}
                  required
                  onChange={(e) => set("bannerLink", e.target.value)}
                />
                <Field
                  label="Thứ tự hiển thị"
                  type="number"
                  min="0"
                  value={p.bannerOrder}
                  onChange={(e) => set("bannerOrder", e.target.value)}
                />
              </div>
              <label className="filter-option section">
                <input
                  type="checkbox"
                  checked={p.bannerActive}
                  onChange={(e) => set("bannerActive", e.target.checked)}
                />
                Hiển thị banner
              </label>
              <div className="coupon-preview">
                <span>TECHZONE · THÁNG NÂNG CẤP</span>
                <h2>{p.code}</h2>
                <p>
                  Giảm{" "}
                  {p.type === "percentage" ? p.value + "%" : money(p.value)} cho
                  đơn hàng
                </p>
              </div>
            </Panel>
          </div>
          <aside className="stack">
            <Panel title="Lượt sử dụng">
              <div className="price">
                {used + reserved} / {p.limit} lượt
              </div>
              <progress
                className="usage-meter"
                max={p.limit || 1}
                value={used + reserved}
              />
              <KV label="Đã dùng">{used}</KV>
              <KV label="Đang giữ">{reserved}</KV>
              <KV label="Còn lại">{Math.max(0, p.limit - used - reserved)}</KV>
              <p className="small muted section">
                Lượt đang giữ được tính vào hạn mức để tránh cấp vượt số lượng.
              </p>
            </Panel>
            <Panel title="Lưu cấu hình">
              <Button type="submit" className="full">
                Lưu thay đổi
              </Button>
              <p className="small muted section">
                Thay đổi có hiệu lực trong dữ liệu demo trên thiết bị này.
              </p>
            </Panel>
          </aside>
        </div>
      </form>
    </>
  );
}
