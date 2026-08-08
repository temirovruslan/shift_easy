import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import PublicRoute from "./PublicRoute";

// A landing page wrapped in PublicRoute, plus the two dashboards it may redirect to.
function renderApp() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <div>LANDING</div>
              </PublicRoute>
            }
          />
          <Route path="/manager/dashboard" element={<div>MANAGER HOME</div>} />
          <Route path="/worker/home" element={<div>WORKER HOME</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("PublicRoute", () => {
  beforeEach(() => localStorage.clear());

  it("shows the public page when logged out", () => {
    renderApp();
    expect(screen.getByText("LANDING")).toBeInTheDocument();
  });

  it("auto-redirects a logged-in manager to the dashboard", () => {
    localStorage.setItem("token", "tok");
    localStorage.setItem(
      "user",
      JSON.stringify({ name: "M", role: "manager" }),
    );
    localStorage.setItem("loginAt", String(Date.now()));

    renderApp();
    expect(screen.getByText("MANAGER HOME")).toBeInTheDocument();
    expect(screen.queryByText("LANDING")).not.toBeInTheDocument();
  });

  it("auto-redirects a logged-in worker to the worker home", () => {
    localStorage.setItem("token", "tok");
    localStorage.setItem(
      "user",
      JSON.stringify({ name: "W", role: "worker" }),
    );
    localStorage.setItem("loginAt", String(Date.now()));

    renderApp();
    expect(screen.getByText("WORKER HOME")).toBeInTheDocument();
    expect(screen.queryByText("LANDING")).not.toBeInTheDocument();
  });
});
