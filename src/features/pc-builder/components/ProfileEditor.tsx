import { useState, type ChangeEvent } from "react";
import { Field, Select } from "@/components/form";
import type {
  MetadataDictionary,
  MetadataSpecEntry,
  ProfileConstraint,
  ProfileMetricConstraint,
  ProfilePriority,
  ProfileRole,
  RequirementProfile,
} from "../types/pcBuilder.types";

export const PRIORITY_LABELS: Record<ProfilePriority, string> = {
  1: "Bạn yêu cầu",
  2: "Đề xuất theo nhu cầu",
  3: "Nên có",
};

const OP_SYMBOLS: Record<string, string> = {
  GTE: "≥",
  LTE: "≤",
  EQ: "=",
  IN: "thuộc",
  NOT_IN: "không thuộc",
  CONTAINS: "có",
};

const OPS_BY_TYPE: Record<MetadataSpecEntry["type"], ProfileConstraint["op"][]> = {
  INT: ["GTE", "LTE", "EQ"],
  ENUM: ["IN", "NOT_IN"],
  LIST: ["CONTAINS"],
};

export type ProfileItem = ProfileConstraint | ProfileMetricConstraint;
export interface ProfileRow {
  item: ProfileItem;
  enabled: boolean;
}

/** Ràng buộc + metric của hồ sơ: hai loại khách thấy dạng chip. */
export function profileItems(profile: RequirementProfile | null | undefined): ProfileItem[] {
  return profile ? [...(profile.constraints || []), ...(profile.metrics || [])] : [];
}

/** Nhãn chip: ưu tiên `label` do server sinh, thiếu thì ghép từ spec/metric. */
export function itemLabel(item: ProfileItem): string {
  if (item.label) return item.label;
  const target = "metric" in item ? item.metric : item.spec;
  const value = "values" in item && item.values?.length ? item.values.join(", ") : item.value;
  return `${target} ${OP_SYMBOLS[item.op] ?? item.op} ${value ?? ""}`.trim();
}

/** Lý do của mục hồ sơ theo id (check `P:{id}`, `relaxedItems`). */
export function itemReason(profile: RequirementProfile | null | undefined, id: string): string {
  const item = profileItems(profile).find((i) => i.id === id);
  return item ? item.reason || itemLabel(item) : id;
}

/** Hồ sơ gửi lên khi "Đề xuất lại": mục bị tắt bị xóa, bỏ các trường do server điền (DD 10.3). */
export function toDraftProfile(profile: RequirementProfile, rows: ProfileRow[]): RequirementProfile {
  const kept = rows
    .filter((r) => r.enabled)
    .map(({ item }) => {
      const copy = { ...item };
      delete copy.label;
      delete copy.satisfied;
      delete copy.unsatisfiable;
      return copy;
    });
  return {
    ...profile,
    source: "USER_EDITED",
    constraints: kept.filter((i): i is ProfileConstraint => !("metric" in i)),
    metrics: kept.filter((i): i is ProfileMetricConstraint => "metric" in i),
  };
}

function clamp(value: number, min?: number, max?: number) {
  return Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value));
}

function specEntry(dictionary: MetadataDictionary | undefined, item: ProfileItem) {
  if ("metric" in item) {
    const m = dictionary?.metrics?.[item.metric];
    return m ? ({ type: "INT", ...m } as MetadataSpecEntry) : undefined;
  }
  return dictionary?.roles?.[item.role]?.specs?.[item.spec];
}

function enumOptions(entry: MetadataSpecEntry | undefined, current: string[] = []) {
  const values = entry?.values ?? Object.fromEntries(current.map((v) => [v, v]));
  return Object.entries(values).map(([value, label]) => ({ value, label }));
}

const priorityOptions = ([1, 2, 3] as ProfilePriority[]).map((p) => ({
  value: String(p),
  label: PRIORITY_LABELS[p],
}));

interface ValueEditorProps {
  item: ProfileItem;
  entry?: MetadataSpecEntry;
  onChange: (item: ProfileItem) => void;
}

/** INT: ô số giới hạn min/max theo từ điển; ENUM/LIST: chọn nhiều, hiện `display_value`. */
function ValueEditor({ item, entry, onChange }: ValueEditorProps) {
  const isList = "values" in item && Array.isArray(item.values) && entry?.type !== "INT";
  if (isList) {
    return (
      <Select
        label="Giá trị"
        multiple
        value={item.values}
        options={enumOptions(entry, item.values)}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          onChange({
            ...item,
            label: undefined,
            values: Array.from(e.target.selectedOptions, (o) => o.value),
          })
        }
      />
    );
  }
  return (
    <Field
      label={`Giá trị${entry?.unit ? ` (${entry.unit})` : ""}`}
      type="number"
      min={entry?.min}
      max={entry?.max}
      value={item.value ?? ""}
      onChange={(e: ChangeEvent<HTMLInputElement>) =>
        onChange({ ...item, label: undefined, value: Number(e.target.value) || 0 } as ProfileItem)
      }
      onBlur={() =>
        onChange({ ...item, value: clamp(item.value ?? 0, entry?.min, entry?.max) } as ProfileItem)
      }
    />
  );
}

interface ProfileEditorProps {
  profile: RequirementProfile;
  dictionary?: MetadataDictionary;
  onChange: (draft: RequirementProfile) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isBusy?: boolean;
}

export function ProfileEditor({
  profile,
  dictionary,
  onChange,
  onSubmit,
  onCancel,
  isBusy = false,
}: ProfileEditorProps) {
  const [rows, setRows] = useState<ProfileRow[]>(() =>
    profileItems(profile).map((item) => ({ item, enabled: true })),
  );

  // Form thêm ràng buộc mới: role → spec → op → giá trị
  const roles = Object.keys(dictionary?.roles ?? {}) as ProfileRole[];
  const [newRole, setNewRole] = useState<ProfileRole | "">("");
  const [newSpec, setNewSpec] = useState("");
  const [newOp, setNewOp] = useState<ProfileConstraint["op"]>("GTE");
  const [newValue, setNewValue] = useState<number | "">("");
  const [newValues, setNewValues] = useState<string[]>([]);
  const role = roles.includes(newRole as ProfileRole) ? (newRole as ProfileRole) : roles[0];
  const specs = role ? dictionary?.roles?.[role]?.specs ?? {} : {};
  const spec = newSpec in specs ? newSpec : Object.keys(specs)[0];
  const entry = spec ? specs[spec] : undefined;
  const ops = entry ? OPS_BY_TYPE[entry.type] : [];
  const op = ops.includes(newOp) ? newOp : ops[0];
  const validValues = newValues.filter((v) => entry?.values && v in entry.values);
  const canAdd = Boolean(
    role && spec && entry && (entry.type === "INT" ? newValue !== "" : validValues.length > 0),
  );

  function update(next: ProfileRow[]) {
    setRows(next);
    onChange(toDraftProfile(profile, next));
  }

  function updateRow(index: number, patch: Partial<ProfileRow>) {
    update(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addConstraint() {
    if (!canAdd || !role || !spec || !entry || !op) return;
    const ids = new Set(rows.map((r) => r.item.id));
    let n = rows.length + 1;
    while (ids.has(`u${n}`)) n++;
    const item: ProfileConstraint = {
      id: `u${n}`,
      role,
      spec,
      op,
      priority: 1,
      reason: "Bạn thêm khi chỉnh hồ sơ",
      ...(entry.type === "INT"
        ? { value: clamp(Number(newValue), entry.min, entry.max) }
        : { values: validValues }),
    };
    update([...rows, { item, enabled: true }]);
    setNewValue("");
    setNewValues([]);
  }

  return (
    <div className="profile-editor">
      {rows.length === 0 && <p className="needs-profile-empty">Hồ sơ chưa có yêu cầu nào.</p>}
      <ul className="profile-editor-rows">
        {rows.map((row, index) => {
          const { item } = row;
          const rowEntry = specEntry(dictionary, item);
          const target =
            "metric" in item
              ? dictionary?.metrics?.[item.metric]?.label ?? item.metric
              : `${dictionary?.roles?.[item.role]?.label ?? item.role} · ${item.spec}`;
          return (
            <li key={item.id} className={`profile-editor-row ${row.enabled ? "" : "disabled"}`}>
              <label className="profile-row-toggle">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) => updateRow(index, { enabled: e.target.checked })}
                />
                <span>{itemLabel(item)}</span>
              </label>
              <small className="profile-row-target">{target}</small>
              {item.reason && <small className="profile-chip-reason">{item.reason}</small>}
              {row.enabled && (
                <div className="profile-row-fields">
                  <ValueEditor
                    item={item}
                    entry={rowEntry}
                    onChange={(next) => updateRow(index, { item: next })}
                  />
                  <Select
                    label="Mức ưu tiên"
                    value={String(item.priority)}
                    options={priorityOptions}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      updateRow(index, {
                        item: { ...item, priority: Number(e.target.value) as ProfilePriority },
                      })
                    }
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {roles.length > 0 ? (
        <fieldset className="profile-add">
          <legend>Thêm yêu cầu mới</legend>
          <div className="profile-row-fields">
            <Select
              label="Linh kiện"
              value={role}
              options={roles.map((r) => ({ value: r, label: dictionary?.roles?.[r]?.label ?? r }))}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                setNewRole(e.target.value as ProfileRole);
                setNewSpec("");
                setNewValues([]);
              }}
            />
            <Select
              label="Thông số"
              value={spec}
              options={Object.keys(specs)}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                setNewSpec(e.target.value);
                setNewValues([]);
              }}
            />
            <Select
              label="Điều kiện"
              value={op}
              options={ops.map((o) => ({ value: o, label: OP_SYMBOLS[o] }))}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setNewOp(e.target.value as ProfileConstraint["op"])
              }
            />
            {entry?.type === "INT" ? (
              <Field
                label={`Giá trị${entry.unit ? ` (${entry.unit})` : ""}`}
                type="number"
                min={entry.min}
                max={entry.max}
                value={newValue}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNewValue(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            ) : (
              <Select
                label="Giá trị"
                multiple
                value={validValues}
                options={enumOptions(entry)}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setNewValues(Array.from(e.target.selectedOptions, (o) => o.value))
                }
              />
            )}
          </div>
          <button type="button" className="btn-profile-edit" onClick={addConstraint} disabled={!canAdd}>
            Thêm yêu cầu
          </button>
        </fieldset>
      ) : (
        <p className="needs-profile-empty">
          Chưa tải được danh sách thông số, tạm thời chỉ sửa được các yêu cầu có sẵn.
        </p>
      )}

      <div className="profile-editor-actions">
        <button type="button" className="btn-ai-submit" onClick={onSubmit} disabled={isBusy}>
          {isBusy ? "AI đang tính toán..." : "Đề xuất lại theo hồ sơ này"}
        </button>
        <button type="button" className="btn-ai-back" onClick={onCancel} disabled={isBusy}>
          Hủy
        </button>
      </div>
    </div>
  );
}
