import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../app";
import { bearer, createTenant, type Tenant } from "./factories";

/**
 * These guards are the layer company scoping sits on top of. They answer a
 * different question — "who are you" rather than "is this yours" — and the
 * status codes are part of the contract: 401 means we do not know you, 403
 * means we do and you still may not.
 */
describe("route guards", () => {
  let acme: Tenant;

  beforeEach(async () => {
    acme = await createTenant("Acme");
  });

  it("rejects a request with no token", async () => {
    const res = await request(app).get("/api/worker");
    expect(res.status).toBe(401);
  });

  it("rejects a malformed token", async () => {
    const res = await request(app)
      .get("/api/worker")
      .set("Authorization", bearer("not.a.jwt"));
    expect(res.status).toBe(401);
  });

  it("rejects a token signed for a user who no longer exists", async () => {
    const { generateToken } = await import("../utils/jwt.utils");
    const token = generateToken("6a0000000000000000000000");

    const res = await request(app)
      .get("/api/worker")
      .set("Authorization", bearer(token));

    expect(res.status).toBe(401);
  });

  it("keeps workers out of manager-only endpoints", async () => {
    const res = await request(app)
      .get("/api/worker")
      .set("Authorization", bearer(acme.workerToken));

    expect(res.status).toBe(403);
  });

  it("keeps workers out of the shifts dashboard", async () => {
    const res = await request(app)
      .get("/api/shifts")
      .set("Authorization", bearer(acme.workerToken));

    expect(res.status).toBe(403);
  });
});
