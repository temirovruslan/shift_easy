import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../app";
import { createTenant, newClientAddress, PASSWORD, type Tenant } from "./factories";

vi.mock("../utils/email.utils", () => ({
  sendInviteEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("auth endpoints do not reveal which emails are registered", () => {
  let acme: Tenant;

  beforeEach(async () => {
    acme = await createTenant("Acme");
  });

  it("answers forgot-password identically for known and unknown addresses", async () => {
    const known = await request(app)
      .post("/api/auth/forgot-password")
      .set("X-Forwarded-For", newClientAddress())
      .send({ email: acme.manager.email });

    const unknown = await request(app)
      .post("/api/auth/forgot-password")
      .set("X-Forwarded-For", newClientAddress())
      .send({ email: "nobody@nowhere.test" });

    expect(known.status).toBe(unknown.status);
    // Byte for byte. The previous version returned a `message` field only on
    // the unknown branch, which was enough to enumerate accounts.
    expect(known.body).toEqual(unknown.body);
  });

  it("answers a wrong password and an unknown address the same way", async () => {
    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .set("X-Forwarded-For", newClientAddress())
      .send({ email: acme.manager.email, password: "not-the-password" });

    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .set("X-Forwarded-For", newClientAddress())
      .send({ email: "nobody@nowhere.test", password: "not-the-password" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });

  it("still signs in a manager with the right password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("X-Forwarded-For", newClientAddress())
      .send({ email: acme.manager.email, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("manager");
    expect(res.body.data.token).toBeTruthy();
  });
});
