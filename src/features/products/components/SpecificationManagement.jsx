import { categories } from "../constants";
import { Button, Heading, Notice, Panel } from "@/components/ui";
import { useSpecificationManagement } from "../hooks/useSpecificationManagement";

export function SpecificationManagement() {
  const {
    data,
    commit,
    notify,
    category,
    newName,
    setNewName,
    draft,
    setDraft,
    choose,
    toggle,
  } = useSpecificationManagement();
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
