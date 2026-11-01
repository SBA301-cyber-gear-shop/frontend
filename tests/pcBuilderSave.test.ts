import { expect, test, vi } from "vitest";
import { saveBuildOrNotify } from "../src/features/pc-builder/hooks/usePcBuilder";

test("B27: save failure reports an error and never claims the build was saved", async () => {
  const notify = vi.fn();
  vi.spyOn(console, "warn").mockImplementation(() => {});

  const result = await saveBuildOrNotify(
    () => Promise.reject(new Error("Linh kiện #999 không còn bán")),
    notify,
  );

  expect(result).toEqual({ saved: false });
  expect(notify).toHaveBeenCalledTimes(1);
  expect(notify.mock.calls[0][1]).toBe("danger");
  expect(notify.mock.calls[0][0]).toContain("Linh kiện #999 không còn bán");
  expect(notify.mock.calls[0][0]).not.toContain("Đã lưu");
});

test("save success reports success with the new build id", async () => {
  const notify = vi.fn();

  const result = await saveBuildOrNotify(() => Promise.resolve(42), notify);

  expect(result).toEqual({ saved: true, buildId: 42 });
  expect(notify).toHaveBeenCalledWith(expect.stringContaining("Đã lưu"), "success");
});
