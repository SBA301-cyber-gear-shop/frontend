import type {
  BudgetFit,
  PeripheralRange,
  PeripheralRole,
  PeripheralSelection,
  PeripheralSuggestionResponse,
} from "../types/pcBuilder.types";

/** Giữ 1/5 ngân sách cho màn, phím, chuột, trong khoảng giá kho thật sự có. */
export function reserveFor(budget: number, range: PeripheralRange): number {
  return Math.min(range.max, Math.max(range.min, Math.ceil(budget / 5)));
}

/** Ngân sách nhỏ nhất của trọn bộ để phần còn lại vẫn đạt mức tối thiểu của thùng máy. */
export function minFullSetBudget(pcMin: number, range: PeripheralRange): number {
  const atFloor = pcMin + range.min;
  if (reserveFor(atFloor, range) === range.min) return atFloor;
  const atCeiling = pcMin + range.max;
  if (reserveFor(atCeiling, range) === range.max) return atCeiling;
  return Math.ceil((pcMin * 5) / 4);
}

/** Ngân sách dành cho thùng máy; tối thiểu 1 vì /validate không nhận 0, và để vượt ngân sách vẫn bị phát hiện. */
export function pcBudgetOf(budget: number, peripheralTotal: number): number {
  return Math.max(1, budget - peripheralTotal);
}

export function fullSetFit(budget: number, pcTotal: number, peripheralTotal: number) {
  const total = pcTotal + peripheralTotal;
  return {
    percent: budget > 0 ? (total / budget) * 100 : 0,
    leftover: budget - total,
    isOver: total > budget,
  };
}

/** budgetFit tính trên cả bộ, để "đạt X%, còn dư Y" không nói theo số tiền đã trừ phụ kiện. */
export function withPeripherals(
  fit: BudgetFit | null | undefined,
  budget: number,
  pcTotal: number,
  peripheralTotal: number,
): BudgetFit | null {
  if (!fit) return null;
  const { percent, leftover } = fullSetFit(budget, pcTotal, peripheralTotal);
  const windowMin = Math.ceil(budget * 0.9);
  const total = budget - leftover;
  return {
    ...fit,
    ratio: budget > 0 ? total / budget : 0,
    percent,
    leftover,
    windowMin,
    windowMax: budget,
    status: total > budget ? "OVER" : total >= windowMin ? "IN_WINDOW" : "UNDER_WINDOW",
  };
}

export function selectionFromSuggestion(suggestion: PeripheralSuggestionResponse): PeripheralSelection {
  const selection: PeripheralSelection = {};
  suggestion.roles.forEach((entry) => {
    selection[entry.role as PeripheralRole] = entry.picked;
  });
  return selection;
}

export function selectionTotal(selection: PeripheralSelection): number {
  return Object.values(selection).reduce((sum, item) => sum + (item?.price ?? 0), 0);
}
