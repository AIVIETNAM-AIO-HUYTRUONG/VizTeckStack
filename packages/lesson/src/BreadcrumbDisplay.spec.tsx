import { render, screen } from "@testing-library/react";
import { BreadcrumbDisplay } from "@vizteck/core";
import type { BreadcrumbItem } from "@vizteck/core";

const items: BreadcrumbItem[] = [
  { title: "Frontend Roadmap", slug: "frontend", nodeId: null },
  { title: "HTML & CSS", slug: "html-css", nodeId: "clx1" },
  { title: "Box Model", slug: null, nodeId: "cly1" },
];

it("renders all breadcrumb titles", () => {
  render(<BreadcrumbDisplay items={items} />);
  expect(screen.getByText("Frontend Roadmap")).toBeDefined();
  expect(screen.getByText("HTML & CSS")).toBeDefined();
  expect(screen.getByText("Box Model")).toBeDefined();
});

it("last item is not a link", () => {
  render(<BreadcrumbDisplay items={items} />);
  const lastItem = screen.getByText("Box Model");
  expect(lastItem.tagName).not.toBe("A");
});

it("non-last items with getLinkHref are links", () => {
  render(
    <BreadcrumbDisplay
      items={items}
      getLinkHref={(item) => item.slug ? `/roadmap/${item.slug}` : undefined}
    />
  );
  const link = screen.getByText("Frontend Roadmap").closest("a");
  expect(link?.getAttribute("href")).toBe("/roadmap/frontend");
});

it("renders nothing for empty items", () => {
  const { container } = render(<BreadcrumbDisplay items={[]} />);
  expect(container.firstChild).toBeNull();
});
