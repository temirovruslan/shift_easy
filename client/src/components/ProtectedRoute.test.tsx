import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

// Renders a protected manager page and a fake landing page to redirect to.
function renderAt(initialPath: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/" element={<div>LANDING</div>} />
          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute role="manager">
                <div>DASHBOARD</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => localStorage.clear());

  it("redirects to landing when there is no token", () => {
    renderAt("/manager/dashboard");
    expect(screen.getByText("LANDING")).toBeInTheDocument();
    expect(screen.queryByText("DASHBOARD")).not.toBeInTheDocument();
  });

  it("renders the page when token + matching role exist", () => {
    localStorage.setItem("token", "tok");
    localStorage.setItem(
      "user",
      JSON.stringify({ name: "M", role: "manager" }),
    );
    localStorage.setItem("loginAt", String(Date.now()));

    renderAt("/manager/dashboard");
    expect(screen.getByText("DASHBOARD")).toBeInTheDocument();
  });

  it("redirects when the role does not match", () => {
    localStorage.setItem("token", "tok");
    localStorage.setItem(
      "user",
      JSON.stringify({ name: "W", role: "worker" }),
    );
    localStorage.setItem("loginAt", String(Date.now()));

    renderAt("/manager/dashboard");
    expect(screen.getByText("LANDING")).toBeInTheDocument();
    expect(screen.queryByText("DASHBOARD")).not.toBeInTheDocument();
  });
});
