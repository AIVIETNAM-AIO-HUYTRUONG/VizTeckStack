/// <reference types="vitest/globals" />
import { renderHook, act } from "@testing-library/react";
import { useState, useEffect } from "react";
import { useAdminLessonPageShell } from "./useLessonPageShell";

vi.mock("@/lib/apolloClient", () => ({ adminApolloClient: {} }));

const mockUpdateCover = vi.fn();
const mockUpdateIcon = vi.fn();

// ponytail: inline the shell logic so tests own the service boundary
vi.mock("@vizteck/core", () => ({
  useLessonPageShell: (_client: unknown, nodeId: string, initialCover: string | null | undefined, initialIcon: string | null | undefined) => {
    const [cover, setCoverState] = useState(initialCover ?? null);
    const [icon, setIconState] = useState(initialIcon ?? null);
    useEffect(() => { if (initialCover !== undefined) setCoverState(initialCover ?? null); }, [initialCover]);
    useEffect(() => { if (initialIcon !== undefined) setIconState(initialIcon ?? null); }, [initialIcon]);
    const setCover = async (url: string | null) => {
      const prev = cover;
      setCoverState(url);
      try { await mockUpdateCover(nodeId, url); } catch { setCoverState(prev); }
    };
    const setIcon = async (value: string | null) => {
      const prev = icon;
      setIconState(value);
      try { await mockUpdateIcon(nodeId, value); } catch { setIconState(prev); }
    };
    return { cover, icon, setCover, setIcon };
  },
}));

beforeEach(() => {
  mockUpdateCover.mockReset();
  mockUpdateIcon.mockReset();
});

it("initializes cover and icon from initial values", () => {
  const { result } = renderHook(() =>
    useAdminLessonPageShell("n1", "https://example.com/img.jpg", "⚡")
  );
  expect(result.current.cover).toBe("https://example.com/img.jpg");
  expect(result.current.icon).toBe("⚡");
});

it("setCover updates local state and calls API", async () => {
  mockUpdateCover.mockResolvedValue(undefined);
  const { result } = renderHook(() => useAdminLessonPageShell("n1", null, null));
  await act(async () => {
    await result.current.setCover("https://cdn.example.com/new.jpg");
  });
  expect(result.current.cover).toBe("https://cdn.example.com/new.jpg");
  expect(mockUpdateCover).toHaveBeenCalledWith("n1", "https://cdn.example.com/new.jpg");
});

it("setCover rolls back on API error", async () => {
  mockUpdateCover.mockRejectedValue(new Error("Network error"));
  const { result } = renderHook(() => useAdminLessonPageShell("n1", "https://old.jpg", null));
  await act(async () => {
    await result.current.setCover("https://new.jpg");
  });
  expect(result.current.cover).toBe("https://old.jpg");
});

it("setIcon updates local state and calls API", async () => {
  mockUpdateIcon.mockResolvedValue(undefined);
  const { result } = renderHook(() => useAdminLessonPageShell("n1", null, null));
  await act(async () => {
    await result.current.setIcon("🚀");
  });
  expect(result.current.icon).toBe("🚀");
  expect(mockUpdateIcon).toHaveBeenCalledWith("n1", "🚀");
});

it("setIcon rolls back on API error", async () => {
  mockUpdateIcon.mockRejectedValue(new Error("fail"));
  const { result } = renderHook(() => useAdminLessonPageShell("n1", null, "⚡"));
  await act(async () => {
    await result.current.setIcon("🚀");
  });
  expect(result.current.icon).toBe("⚡");
});

it("syncs cover when initialCover changes from undefined to a value", async () => {
  const { result, rerender } = renderHook(
    ({ cover }: { cover: string | null | undefined }) =>
      useAdminLessonPageShell("n1", cover, null),
    { initialProps: { cover: undefined as string | null | undefined } },
  );
  expect(result.current.cover).toBeNull();
  rerender({ cover: "https://loaded.jpg" });
  expect(result.current.cover).toBe("https://loaded.jpg");
});
