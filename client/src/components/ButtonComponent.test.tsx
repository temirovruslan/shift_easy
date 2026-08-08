import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ButtonComponent from "./ButtonComponent";

describe("ButtonComponent", () => {
  it("renders the label", () => {
    render(<ButtonComponent label="Save" />);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<ButtonComponent label="Continue" onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    render(<ButtonComponent label="Continue" onClick={onClick} disabled />);
    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("defaults to type=button so it doesn't submit forms accidentally", () => {
    render(<ButtonComponent label="Click" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("honors an explicit submit type", () => {
    render(<ButtonComponent label="Submit" type="submit" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
