import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../app";
import { createTenant, newClientAddress, PASSWORD, type Tenant } from "./factories";

vi.mock("../utils/email.utils", () => ({
  sendInviteEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("auth endpoints are rate limited", () => {
  let acme: Tenant;

  beforeEach(async () => {
    acme = await createTenant("Acme");
  });

  it("stops password guessing after ten wrong attempts", async () => {
    const client = newClientAddress();
    const attempt = () =>
      request(app)
        .post("/api/auth/login")
        .set("X-Forwarded-For", client)
        .send({ email: acme.manager.email, password: "wrong" });

    for (let i = 0; i < 10; i += 1) {
      expect((await attempt()).status).toBe(401);
    }

    const blocked = await attempt();
    expect(blocked.status).toBe(429);
  });

  it("counts wrong attempts, not successful ones", async () => {
    const client = newClientAddress();

    for (let i = 0; i < 20; i += 1) {
      const res = await request(app)
        .post("/api/auth/login")
        .set("X-Forwarded-For", client)
        .send({ email: acme.manager.email, password: PASSWORD });
      expect(res.status).toBe(200);
    }
  });

  it("limits how often one client can ask whether an email is taken", async () => {
    const client = newClientAddress();
    const ask = () =>
      request(app)
        .post("/api/auth/check-email")
        .set("X-Forwarded-For", client)
        .send({ email: `probe-${Math.random()}@nowhere.test` });

    for (let i = 0; i < 15; i += 1) {
      expect((await ask()).status).toBe(200);
    }

    expect((await ask()).status).toBe(429);
  });

  it("keeps one client's limit from affecting another", async () => {
    const noisy = newClientAddress();
    for (let i = 0; i < 11; i += 1) {
      await request(app)
        .post("/api/auth/login")
        .set("X-Forwarded-For", noisy)
        .send({ email: acme.manager.email, password: "wrong" });
    }

    const bystander = await request(app)
      .post("/api/auth/login")
      .set("X-Forwarded-For", newClientAddress())
      .send({ email: acme.manager.email, password: PASSWORD });

    expect(bystander.status).toBe(200);
  });
});

describe("security headers", () => {
  it("sends the headers helmet is there to add", async () => {
    const res = await request(app)
      .post("/api/auth/check-email")
      .set("X-Forwarded-For", newClientAddress())
      .send({ email: "someone@nowhere.test" });

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
    // Helmet removes this one; leaving it advertises the stack for free.
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});
