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

/**
 * check-email was the only auth route mounted without a schema. Mongoose
 * treats an object as a set of query operators rather than a malformed
 * string, so `{ $ne: null }` was a valid query that matched the first user in
 * the collection — an unvalidated operator reaching the database.
 */
describe("check-email rejects query operators", () => {
  it("refuses an object where an email address belongs", async () => {
    await createTenant("Acme");

    const res = await request(app)
      .post("/api/auth/check-email")
      .set("X-Forwarded-For", newClientAddress())
      .send({ email: { $ne: null } });

    expect(res.status).toBe(400);
    expect(res.body.errors.email).toBeDefined();
  });

  it("refuses an array as well", async () => {
    const res = await request(app)
      .post("/api/auth/check-email")
      .set("X-Forwarded-For", newClientAddress())
      .send({ email: ["a@b.test"] });

    expect(res.status).toBe(400);
  });

  it("still answers a real address", async () => {
    const acme = await createTenant("Acme");

    const taken = await request(app)
      .post("/api/auth/check-email")
      .set("X-Forwarded-For", newClientAddress())
      .send({ email: acme.manager.email });
    expect(taken.status).toBe(200);
    expect(taken.body.available).toBe(false);

    const free = await request(app)
      .post("/api/auth/check-email")
      .set("X-Forwarded-For", newClientAddress())
      .send({ email: "nobody@nowhere.test" });
    expect(free.body.available).toBe(true);
  });
});
