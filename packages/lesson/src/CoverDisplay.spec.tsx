import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoverDisplay } from "@vizteck/core";

it("renders img when coverImage provided", () => {
  render(
    <CoverDisplay
      coverImage="https://example.com/img.jpg"
      icon="⚡"
      breadcrumb={[]}
    />
  );
  expect(screen.getByRole("img").getAttribute("src")).toBe(
    "https://example.com/img.jpg"
  );
});

it("renders gradient fallback when no coverImage", () => {
  const { container } = render(
    <CoverDisplay coverImage={null} icon={null} breadcrumb={[]} />
  );
  const gradient = container.querySelector(".bg-gradient-to-br");
  expect(gradient).not.toBeNull();
});

it("renders default icon when icon is null", () => {
  render(<CoverDisplay coverImage={null} icon={null} breadcrumb={[]} />);
  expect(screen.getByText("📄")).toBeDefined();
});

it("renders provided icon", () => {
  render(<CoverDisplay coverImage={null} icon="🚀" breadcrumb={[]} />);
  expect(screen.getByText("🚀")).toBeDefined();
});

it("calls onIconClick when icon is clicked", async () => {
  const user = userEvent.setup();
  const onIconClick = vi.fn();
  render(
    <CoverDisplay
      coverImage={null}
      icon="⚡"
      breadcrumb={[]}
      onIconClick={onIconClick}
    />
  );
  await user.click(screen.getByText("⚡"));
  expect(onIconClick).toHaveBeenCalledOnce();
});
