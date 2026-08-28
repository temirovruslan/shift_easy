import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";

// Small consumer that surfaces the auth state so we can assert on it.
function Consumer() {
  const { user, token, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.name : "none"}</span>
      <span data-testid="token">{token ?? "none"}</span>
      <button
        onClick={() => login({ name: "Ruslan", role: "manager" }, "tok-123")}
      >
        login
      </button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

const renderWithProvider = () =>
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts logged out when nothing is stored", () => {
    renderWithProvider();
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(screen.getByTestId("token")).toHaveTextContent("none");
  });

  it("login persists user + token to localStorage", async () => {
    renderWithProvider();
    await userEvent.click(screen.getByText("login"));

    expect(screen.getByTestId("user")).toHaveTextContent("Ruslan");
    expect(screen.getByTestId("token")).toHaveTextContent("tok-123");
    expect(localStorage.getItem("token")).toBe("tok-123");
    expect(JSON.parse(localStorage.getItem("user")!).name).toBe("Ruslan");
    expect(localStorage.getItem("loginAt")).not.toBeNull();
  });

  it("logout clears everything from localStorage", async () => {
    renderWithProvider();
    await userEvent.click(screen.getByText("login"));
    await userEvent.click(screen.getByText("logout"));

    expect(screen.getByTestId("token")).toHaveTextContent("none");
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("loginAt")).toBeNull();
  });

  it("restores a remembered session on mount (this is the auto-login fix)", () => {
    localStorage.setItem("token", "saved-tok");
    localStorage.setItem(
      "user",
      JSON.stringify({ name: "Maria", role: "worker" }),
    );
    localStorage.setItem("loginAt", String(Date.now()));

    renderWithProvider();
    expect(screen.getByTestId("user")).toHaveTextContent("Maria");
    expect(screen.getByTestId("token")).toHaveTextContent("saved-tok");
  });

  it("expires a session older than 90 days", () => {
    const ninetyOneDaysAgo = Date.now() - 91 * 24 * 60 * 60 * 1000;
    localStorage.setItem("token", "old-tok");
    localStorage.setItem(
      "user",
      JSON.stringify({ name: "Old", role: "worker" }),
    );
    localStorage.setItem("loginAt", String(ninetyOneDaysAgo));

    renderWithProvider();
    expect(screen.getByTestId("token")).toHaveTextContent("none");
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("slides the expiry window forward when restoring a valid session", () => {
    const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
    localStorage.setItem("token", "tok");
    localStorage.setItem(
      "user",
      JSON.stringify({ name: "Slide", role: "manager" }),
    );
    localStorage.setItem("loginAt", String(tenDaysAgo));

    renderWithProvider();
    // loginAt should have been bumped to ~now, not left 10 days in the past
    expect(Number(localStorage.getItem("loginAt"))).toBeGreaterThan(tenDaysAgo);
  });
});

/**
 * Only a known shape is allowed into localStorage, and only a known shape is
 * accepted back out of it.
 *
 * Writing whatever the API returned means trusting a remote response with
 * something the app later reads as its own state. Reading it back with a bare
 * `JSON.parse` was the worse half: a corrupted entry threw inside the effect
 * that restores the session, so the app rendered nothing and the user could
 * not even sign out to clear it.
 */
describe("session storage only accepts a known shape", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const fresh = () => String(Date.now());

  it("recovers from a corrupted stored user instead of rendering nothing", () => {
    localStorage.setItem("user", "{not json");
    localStorage.setItem("token", "tok-123");
    localStorage.setItem("loginAt", fresh());

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("user")).toHaveTextContent("none");
    // And it clears the remains, so the next load does not repeat this.
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("rejects a stored user carrying an unknown role", () => {
    localStorage.setItem(
      "user",
      JSON.stringify({ name: "Mallory", role: "admin" }),
    );
    localStorage.setItem("token", "tok-123");
    localStorage.setItem("loginAt", fresh());

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("user")).toHaveTextContent("none");
  });

  it("rejects a stored user with no name", () => {
    localStorage.setItem("user", JSON.stringify({ role: "manager" }));
    localStorage.setItem("token", "tok-123");
    localStorage.setItem("loginAt", fresh());

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("user")).toHaveTextContent("none");
  });

  it("stores only name and role, dropping anything else the API returned", async () => {
    const user = userEvent.setup();

    function ExtraFieldConsumer() {
      const { login } = useAuth();
      return (
        <button
          onClick={() =>
            login(
              {
                name: "Ruslan",
                role: "manager",
                // Not part of the type. A response carrying it must not have
                // it persisted alongside the session.
                isAdmin: true,
              } as never,
              "tok-123",
            )
          }
        >
          login
        </button>
      );
    }

    render(
      <AuthProvider>
        <ExtraFieldConsumer />
      </AuthProvider>,
    );
    await user.click(screen.getByRole("button", { name: "login" }));

    const stored = JSON.parse(localStorage.getItem("user") ?? "{}");
    expect(stored).toEqual({ name: "Ruslan", role: "manager" });
  });

  it("restores a session that is intact", () => {
    localStorage.setItem(
      "user",
      JSON.stringify({ name: "Ruslan", role: "manager" }),
    );
    localStorage.setItem("token", "tok-123");
    localStorage.setItem("loginAt", fresh());

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("user")).toHaveTextContent("Ruslan");
    expect(screen.getByTestId("token")).toHaveTextContent("tok-123");
  });
});
