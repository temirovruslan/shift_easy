import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// client/.env is not committed, so CI has no VITE_API_URL. The API client now
// refuses to start without one; give the suite a value rather than weakening
// the check that exists to catch a misconfigured deployment.
import.meta.env.VITE_API_URL = "http://localhost:5000/api";

// Unmount React trees and reset the DOM between tests so state doesn't leak.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
