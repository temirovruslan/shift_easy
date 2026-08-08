import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputComponent from "./InputComponent";

describe("InputComponent", () => {
  it("renders label and placeholder", () => {
    render(
      <InputComponent
        label="Email"
        value=""
        onChange={() => {}}
        placeholder="you@example.com"
      />,
    );
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  });

  it("fires onChange with the typed value", async () => {
    const onChange = vi.fn();
    render(<InputComponent value="" onChange={onChange} placeholder="name" />);
    await userEvent.type(screen.getByPlaceholderText("name"), "a");
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("shows the error message when provided", () => {
    render(
      <InputComponent
        value=""
        onChange={() => {}}
        error="Required field"
        placeholder="x"
      />,
    );
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it("shows the hint when there is no error", () => {
    render(
      <InputComponent
        value=""
        onChange={() => {}}
        hint="At least 8 characters"
        placeholder="x"
      />,
    );
    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    render(
      <InputComponent
        value="secret123"
        onChange={() => {}}
        type="password"
        placeholder="password"
      />,
    );
    const input = screen.getByPlaceholderText("password");
    expect(input).toHaveAttribute("type", "password");

    // the eye toggle is the only button rendered inside the field
    await userEvent.click(screen.getByRole("button"));
    expect(input).toHaveAttribute("type", "text");
  });
});
