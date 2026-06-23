/// <reference types="vitest/globals" />
import { renderHook, act } from "@testing-library/react";
import { useLessonPageShell } from "./useLessonPageShell";
import * as lessonService from "../services/lesson.service";

vi.mock("../services/lesson.service");

const mockUpdateCover = vi.mocked(lessonService.updateNodeCover);
const mockUpdateIcon = vi.mocked(lessonService.updateNodeIcon);

it("initializes cover and icon from initial values", () => {
  const { result } = renderHook(() =>
    useLessonPageShell("n1", "https://example.com/img.jpg", "⚡")
  );
  expect(result.current.cover).toBe("https://example.com/img.jpg");
  expect(result.current.icon).toBe("⚡");
});

it("setCover updates local state and calls API", async () => {
  mockUpdateCover.mockResolvedValue(undefined);
  const { result } = renderHook(() => useLessonPageShell("n1", null, null));
  await act(async () => {
    await result.current.setCover("https://cdn.example.com/new.jpg");
  });
  expect(result.current.cover).toBe("https://cdn.example.com/new.jpg");
  expect(mockUpdateCover).toHaveBeenCalledWith("n1", "https://cdn.example.com/new.jpg");
});

it("setCover rolls back on API error", async () => {
  mockUpdateCover.mockRejectedValue(new Error("Network error"));
  const { result } = renderHook(() => useLessonPageShell("n1", "https://old.jpg", null));
  await act(async () => {
    await result.current.setCover("https://new.jpg");
  });
  expect(result.current.cover).toBe("https://old.jpg");
});

it("setIcon updates local state and calls API", async () => {
  mockUpdateIcon.mockResolvedValue(undefined);
  const { result } = renderHook(() => useLessonPageShell("n1", null, null));
  await act(async () => {
    await result.current.setIcon("🚀");
  });
  expect(result.current.icon).toBe("🚀");
  expect(mockUpdateIcon).toHaveBeenCalledWith("n1", "🚀");
});

it("setIcon rolls back on API error", async () => {
  mockUpdateIcon.mockRejectedValue(new Error("fail"));
  const { result } = renderHook(() => useLessonPageShell("n1", null, "⚡"));
  await act(async () => {
    await result.current.setIcon("🚀");
  });
  expect(result.current.icon).toBe("⚡");
});

it("syncs cover when initialCover changes from undefined to a value", async () => {
  const { result, rerender } = renderHook(
    ({ cover }: { cover: string | null | undefined }) =>
      useLessonPageShell("n1", cover, null),
    { initialProps: { cover: undefined as string | null | undefined } },
  );
  expect(result.current.cover).toBeNull();
  rerender({ cover: "https://loaded.jpg" });
  expect(result.current.cover).toBe("https://loaded.jpg");
});
