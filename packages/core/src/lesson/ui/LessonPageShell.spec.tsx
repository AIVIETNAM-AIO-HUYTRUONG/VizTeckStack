import { render, screen } from "@testing-library/react";
import { LessonPageShell } from "./LessonPageShell";
import type { LessonShellNode } from "../types";

const node: LessonShellNode = {
  id: "n1",
  title: "Box Model",
  coverImage: null,
  icon: "⚡",
  content: "[]",
  type: "LESSON",
};

it("view mode renders title", () => {
  render(<LessonPageShell mode="view" node={node} />);
  expect(screen.getByRole("heading", { name: "Box Model" })).toBeDefined();
});

it("view mode renders icon via CoverDisplay", () => {
  render(<LessonPageShell mode="view" node={node} />);
  expect(screen.getByText("⚡")).toBeDefined();
});

it("edit mode renders coverSlot when provided", () => {
  render(
    <LessonPageShell
      mode="edit"
      node={node}
      coverSlot={<div data-testid="custom-cover">custom</div>}
    />
  );
  expect(screen.getByTestId("custom-cover")).toBeDefined();
});

it("edit mode renders titleSlot when provided", () => {
  render(
    <LessonPageShell
      mode="edit"
      node={node}
      titleSlot={<h1 data-testid="custom-title">custom title</h1>}
    />
  );
  expect(screen.getByTestId("custom-title")).toBeDefined();
});

it("edit mode uses default title when titleSlot not provided", () => {
  render(<LessonPageShell mode="edit" node={node} />);
  expect(screen.getByRole("heading", { name: "Box Model" })).toBeDefined();
});
