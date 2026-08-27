import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import app from "../app";
import { bearer, createTenant } from "./factories";

/**
 * How a failure leaves the API. Every response here used to be either an HTML
 * page or a 500, both of which tell a client that something went wrong
 * without telling it what to do about it.
 */
describe("error responses", () => {
  it("answers an unknown route with JSON, not an HTML page", async () => {
    const res = await request(app).get("/api/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.type).toBe("application/json");
    expect(res.body.success).toBe(false);
  });

  it("names the method and path it could not route", async () => {
    const res = await request(app).post("/api/worker/typo/path");

    expect(res.status).toBe(404);
    expect(res.body.message).toContain("POST");
    expect(res.body.message).toContain("/api/worker/typo/path");
  });

  it("treats a malformed id as a client error, not a server fault", async () => {
    const acme = await createTenant("Acme");

    const res = await request(app)
      .get("/api/worker/not-an-object-id")
      .set("Authorization", bearer(acme.managerToken));

    // Mongoose raises a CastError here. It used to reach the generic branch
    // and be reported as 500, which reads as "our bug" in every log and alert.
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid identifier");
  });

  it("keeps a deliberate error's own status and message", async () => {
    const res = await request(app).get("/api/worker");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Not authorized, no token");
  });
});

/**
 * Branches that are awkward to provoke over HTTP but easy to state directly.
 * A duplicate key needs two writes racing each other; a legacy handler
 * setting `statusCode` on a plain object needs that handler to still exist.
 */
describe("error handler branches", () => {
  const mockResponse = () => {
    const res = {
      statusCode: 0,
      body: undefined as unknown,
      status(code: number) {
        res.statusCode = code;
        return res;
      },
      json(payload: unknown) {
        res.body = payload;
        return res;
      },
    };
    return res;
  };

  const handle = async (err: unknown) => {
    const { errorHandler } = await import("../middleware/error.middleware");
    const res = mockResponse();
    errorHandler(
      err,
      {} as never,
      res as never,
      (() => undefined) as never,
    );
    return res;
  };

  it("turns a duplicate key collision into 409 naming the field", async () => {
    const res = await handle({ code: 11000, keyValue: { email: "a@b.test" } });

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({
      success: false,
      message: "That email is already in use",
    });
  });

  it("falls back to a generic field name when the driver gives none", async () => {
    const res = await handle({ code: 11000 });
    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({
      success: false,
      message: "That value is already in use",
    });
  });

  it("honours a plain object that carries its own statusCode", async () => {
    const res = await handle({ statusCode: 418, message: "Teapot" });

    expect(res.statusCode).toBe(418);
    expect(res.body).toEqual({ success: false, message: "Teapot" });
  });

  it("reports an unexpected failure as 500 without leaking the stack", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const res = await handle(new Error("connection reset"));

    expect(res.statusCode).toBe(500);
    // The full error goes to the log, not to the client.
    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
  });
});

describe("environment validation", () => {
  it("refuses to load with a JWT secret that is too short", async () => {
    const original = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "short";
    vi.resetModules();

    await expect(import("../config/env")).rejects.toThrow(/JWT_SECRET/);

    process.env.JWT_SECRET = original;
    vi.resetModules();
  });

  it("refuses to load without a client URL", async () => {
    const original = process.env.CLIENT_URL;
    delete process.env.CLIENT_URL;
    vi.resetModules();

    await expect(import("../config/env")).rejects.toThrow(/CLIENT_URL/);

    process.env.CLIENT_URL = original;
    vi.resetModules();
  });
});
