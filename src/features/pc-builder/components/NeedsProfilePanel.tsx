import { useState } from "react";
import { Badge } from "@/components/ui";
import type { MetadataDictionary, RequirementProfile } from "../types/pcBuilder.types";
import { ProfileEditor, PRIORITY_LABELS, itemLabel, profileItems } from "./ProfileEditor";

interface NeedsProfilePanelProps {
  profile: RequirementProfile;
  relaxedItems?: string[];
  dictionary?: MetadataDictionary;
  onDraftChange: (draft: RequirementProfile) => void;
  onResuggest: () => void;
  isBusy?: boolean;
}

export function NeedsProfilePanel({
  profile,
  relaxedItems = [],
  dictionary,
  onDraftChange,
  onResuggest,
  isBusy = false,
}: NeedsProfilePanelProps) {
  // Gắn chế độ sửa với đúng hồ sơ đang mở: có hồ sơ mới từ server thì tự đóng
  const [editingFor, setEditingFor] = useState<RequirementProfile | null>(null);
  const editing = editingFor === profile;
  const items = profileItems(profile);
  const dropped = profile.droppedItems || [];
  const unmet = profile.unmetNeeds || [];

  function cancelEdit() {
    onDraftChange(profile);
    setEditingFor(null);
  }

  return (
    <section className="needs-profile-panel" aria-labelledby="needsProfileTitle">
      <div className="needs-profile-head">
        <div>
          <h2 id="needsProfileTitle">Hệ thống hiểu bạn cần</h2>
          <p className="needs-profile-summary">{profile.summary}</p>
        </div>
        <div className="needs-profile-actions">
          {profile.source === "USER_EDITED" && <Badge tone="info">Bạn đã chỉnh</Badge>}
          {!editing && (
            <button
              type="button"
              className="btn-profile-edit"
              onClick={() => {
                onDraftChange(profile);
                setEditingFor(profile);
              }}
              disabled={isBusy}
            >
              Chỉnh hồ sơ
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <ProfileEditor
          profile={profile}
          dictionary={dictionary}
          onChange={onDraftChange}
          onSubmit={onResuggest}
          onCancel={cancelEdit}
          isBusy={isBusy}
        />
      ) : (
        <>
          {items.length > 0 ? (
            <ul className="profile-chips" aria-label="Yêu cầu trong hồ sơ">
              {items.map((item) => {
                const relaxed = relaxedItems.includes(item.id);
                const state = relaxed
                  ? "relaxed"
                  : item.satisfied === true
                    ? "ok"
                    : item.satisfied === false
                      ? "miss"
                      : "neutral";
                return (
                  <li key={item.id} className={`profile-chip ${state}`}>
                    <div className="profile-chip-main">
                      <span className="profile-chip-label">{itemLabel(item)}</span>
                      <Badge tone={item.priority === 1 ? "dark" : item.priority === 2 ? "info" : "neutral"}>
                        {PRIORITY_LABELS[item.priority] ?? "Nên có"}
                      </Badge>
                    </div>
                    {item.reason && <small className="profile-chip-reason">{item.reason}</small>}
                    {relaxed && (
                      <small className="profile-chip-note">Đã hạ để vừa ngân sách</small>
                    )}
                    {!relaxed && item.satisfied === false && (
                      <small className="profile-chip-note">Bộ máy hiện tại chưa đạt</small>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="needs-profile-empty">Hồ sơ chưa có yêu cầu cụ thể nào.</p>
          )}

          {unmet.length > 0 && (
            <div className="needs-profile-unmet">
              <strong>Chưa đáp ứng được bằng dữ liệu kho:</strong>
              <ul>
                {unmet.map((need) => (
                  <li key={need}>{need}</li>
                ))}
              </ul>
            </div>
          )}

          {dropped.length > 0 && (
            <details className="needs-profile-dropped">
              <summary>Mục AI đề xuất nhưng bị bỏ qua ({dropped.length})</summary>
              <ul>
                {dropped.map((d) => (
                  <li key={d.id}>
                    <code>{d.id}</code>: {d.detail || d.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
