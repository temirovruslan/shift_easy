import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount React trees and reset the DOM between tests so state doesn't leak.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
