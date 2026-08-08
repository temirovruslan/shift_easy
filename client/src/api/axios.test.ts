import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";
import api from "./axios";

// Reach into the axios instance to run the interceptor functions directly.
// This is the cleanest way to unit-test interceptor logic without real HTTP.
type Handler<T> = {
  fulfilled: (v: T) => T;
  rejected: (e: unknown) => Promise<unknown>;
};

const requestHandler = (api.interceptors.request as any).handlers[0] as Handler<
  InternalAxiosRequestConfig
>;
const responseHandler = (api.interceptors.response as any)
  .handlers[0] as Handler<unknown>;

describe("axios request interceptor", () => {
  beforeEach(() => localStorage.clear());

  it("attaches the Bearer token when one is stored", () => {
    localStorage.setItem("token", "abc-123");
    const config = { headers: {} } as InternalAxiosRequestConfig;
    const result = requestHandler.fulfilled(config);
    expect(result.headers.Authorization).toBe("Bearer abc-123");
  });

  it("leaves the header off when there is no token", () => {
    const config = { headers: {} } as InternalAxiosRequestConfig;
    const result = requestHandler.fulfilled(config);
    expect(result.headers.Authorization).toBeUndefined();
  });
});

describe("axios response interceptor (401 handling)", () => {
  let hrefSetter: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "expired");
    localStorage.setItem("user", JSON.stringify({ name: "X", role: "worker" }));
    localStorage.setItem("loginAt", String(Date.now()));

    // Stub window.location so we can observe redirects without jsdom navigating.
    hrefSetter = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        pathname: "/worker/home",
        set href(v: string) {
          hrefSetter(v);
        },
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("clears the stored session on a 401", async () => {
    await expect(
      responseHandler.rejected({ response: { status: 401 } }),
    ).rejects.toBeDefined();

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("loginAt")).toBeNull();
  });

  it("redirects to landing when 401 happens on a protected page", async () => {
    await responseHandler.rejected({ response: { status: 401 } }).catch(() => {});
    expect(hrefSetter).toHaveBeenCalledWith("/");
  });

  it("does not touch the session for non-401 errors", async () => {
    await responseHandler
      .rejected({ response: { status: 500 } })
      .catch(() => {});
    expect(localStorage.getItem("token")).toBe("expired");
    expect(hrefSetter).not.toHaveBeenCalled();
  });
});
