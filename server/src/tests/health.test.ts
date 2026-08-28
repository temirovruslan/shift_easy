import mongoose from "mongoose";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../app";

describe("health check", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports ok while the database is reachable", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.database).toBe("connected");
    expect(typeof res.body.uptime).toBe("number");
  });

  it("needs no credentials", async () => {
    // Everything else answers 401 without a token. A probe has none.
    const res = await request(app).get("/api/health");
    expect(res.status).not.toBe(401);
  });

  /**
   * The case the endpoint exists for: the process is up and serving, but the
   * database is gone. Returning 200 here would let a broken deploy pass its
   * own smoke check.
   */
  it("answers 503 when the database is unreachable", async () => {
    vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(0);

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(503);
    expect(res.body.status).toBe("degraded");
    expect(res.body.database).toBe("disconnected");
  });
});
