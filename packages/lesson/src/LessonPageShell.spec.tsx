import { render, screen } from "@testing-library/react";
import { LessonPageShell } from "@vizteck/core";
import type { LessonShellNode, BreadcrumbItem } from "@vizteck/core";

const node: LessonShellNode = {
  id: "n1",
  title: "Box Model",
  coverImage: null,
  icon: "⚡",
  content: "[]",
  type: "LESSON",
};

const breadcrumb: BreadcrumbItem[] = [
  { title: "Frontend", slug: "frontend", nodeId: null },
];

it("view mode renders title", () => {
  render(<LessonPageShell mode="view" node={node} breadcrumb={breadcrumb} />);
  expect(screen.getByRole("heading", { name: "Box Model" })).toBeDefined();
});

it("view mode renders icon via CoverDisplay", () => {
  render(<LessonPageShell mode="view" node={node} breadcrumb={breadcrumb} />);
  expect(screen.getByText("⚡")).toBeDefined();
});

it("edit mode renders coverSlot when provided", () => {
  render(
    <LessonPageShell
      mode="edit"
      node={node}
      breadcrumb={breadcrumb}
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
      breadcrumb={breadcrumb}
      titleSlot={<h1 data-testid="custom-title">custom title</h1>}
    />
  );
  expect(screen.getByTestId("custom-title")).toBeDefined();
});

it("edit mode uses default title when titleSlot not provided", () => {
  render(<LessonPageShell mode="edit" node={node} breadcrumb={breadcrumb} />);
  expect(screen.getByRole("heading", { name: "Box Model" })).toBeDefined();
});
