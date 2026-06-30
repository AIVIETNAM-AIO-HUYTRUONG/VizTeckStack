/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoverImage } from "./CoverImage";

vi.mock('@/lib/uploadthing', () => ({
  useUploadThing: () => ({ startUpload: vi.fn() }),
}));

it("renders without cover — shows gradient", () => {
  const { container } = render(
    <CoverImage
      cover={null}
      icon={null}
      onCoverChange={() => {}}
      onIconChange={() => {}}
    />
  );
  expect(container.querySelector(".bg-gradient-to-br")).not.toBeNull();
});

it("shows cover controls on hover", async () => {
  const user = userEvent.setup();
  const { container } = render(
    <CoverImage
      cover={null}
      icon={null}
      onCoverChange={() => {}}
      onIconChange={() => {}}
    />
  );
  const wrapper = container.firstChild as HTMLElement;
  await user.hover(wrapper);
  expect(screen.getByText("Upload")).toBeDefined();
  expect(screen.getByText("Paste URL")).toBeDefined();
});

it("calls onCoverChange(null) when Remove is clicked", () => {
  const onCoverChange = vi.fn();
  const { container } = render(
    <CoverImage
      cover="https://example.com/img.jpg"
      icon={null}
      onCoverChange={onCoverChange}
      onIconChange={() => {}}
    />
  );
  const wrapper = container.firstChild as HTMLElement;
  fireEvent.mouseEnter(wrapper);
  fireEvent.click(screen.getByText("Remove"));
  expect(onCoverChange).toHaveBeenCalledWith(null);
});
