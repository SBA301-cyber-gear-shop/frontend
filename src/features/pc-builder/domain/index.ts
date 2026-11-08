// Bộ kiểm tra của demo mode, phần đặt hàng (features/orders) vẫn dùng
export { validateBuild, suggestBuild } from "./legacyValidator.js";
export {
  MAX_BUDGET,
  MAX_MESSAGE_LENGTH,
  SLOT_LABELS,
  SLOT_ORDER,
  buildKey,
  buildableRequirement,
  checkInput,
  itemsFromCartSet,
  lineTotal,
  replaceLine,
  saveErrorText,
  setLineQty,
  slotLabel,
  slotRows,
  toItemRequests,
} from "./buildLines";
export type { CartBuildSet, SlotRow } from "./buildLines";
