import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoverDisplay } from "./CoverDisplay";

it("renders img when coverImage provided", () => {
  render(
    <CoverDisplay
      coverImage="https://example.com/img.jpg"
      icon="⚡"
    />,
  );
  expect(screen.getByAltText("").getAttribute("src")).toBe(
    "https://example.com/img.jpg",
  );
});

it("renders gradient fallback when no coverImage", () => {
  const { container } = render(
    <CoverDisplay coverImage={null} icon={null} />,
  );
  const gradient = container.querySelector(".bg-gradient-to-br");
  expect(gradient).not.toBeNull();
});

it("renders default icon when icon is null", () => {
  render(<CoverDisplay coverImage={null} icon={null} />);
  expect(screen.getByText("📄")).toBeDefined();
});

it("renders provided icon", () => {
  render(<CoverDisplay coverImage={null} icon="🚀" />);
  expect(screen.getByText("🚀")).toBeDefined();
});

it("calls onIconClick when icon is clicked", async () => {
  const user = userEvent.setup();
  const onIconClick = vi.fn();
  render(
    <CoverDisplay
      coverImage={null}
      icon="⚡"
      onIconClick={onIconClick}
    />,
  );
  await user.click(screen.getByText("⚡"));
  expect(onIconClick).toHaveBeenCalledOnce();
});
