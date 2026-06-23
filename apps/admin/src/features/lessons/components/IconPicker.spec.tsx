/// <reference types="vitest/globals" />
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IconPicker } from "./IconPicker";

it("renders trigger with current icon", () => {
  render(<IconPicker icon="⚡" onIconChange={() => {}} isOpen={false} onToggle={() => {}} />);
  expect(screen.getByText("⚡")).toBeDefined();
});

it("renders default icon when icon is null", () => {
  render(<IconPicker icon={null} onIconChange={() => {}} isOpen={false} onToggle={() => {}} />);
  expect(screen.getByText("📄")).toBeDefined();
});

it("calls onToggle when trigger is clicked", async () => {
  const user = userEvent.setup();
  const onToggle = vi.fn();
  render(<IconPicker icon="⚡" onIconChange={() => {}} isOpen={false} onToggle={onToggle} />);
  await user.click(screen.getByText("⚡"));
  expect(onToggle).toHaveBeenCalledOnce();
});

it("shows emoji tab when open", () => {
  render(<IconPicker icon="⚡" onIconChange={() => {}} isOpen={true} onToggle={() => {}} />);
  expect(screen.getByText("Emoji")).toBeDefined();
  expect(screen.getByText("Text")).toBeDefined();
  expect(screen.getByText("Icons")).toBeDefined();
});

it("calls onIconChange when emoji is selected", async () => {
  const user = userEvent.setup();
  const onIconChange = vi.fn();
  render(<IconPicker icon={null} onIconChange={onIconChange} isOpen={true} onToggle={() => {}} />);
  await user.click(screen.getByText("🚀"));
  expect(onIconChange).toHaveBeenCalledWith("🚀");
});

it("calls onIconChange(null) when Remove is clicked", async () => {
  const user = userEvent.setup();
  const onIconChange = vi.fn();
  render(<IconPicker icon="⚡" onIconChange={onIconChange} isOpen={true} onToggle={() => {}} />);
  await user.click(screen.getByText("Remove"));
  expect(onIconChange).toHaveBeenCalledWith(null);
});
