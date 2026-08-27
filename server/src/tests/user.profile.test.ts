import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../app";
import UserModel from "../models/User.model";
import { comparePassword } from "../utils/hash.utils";
import { bearer, createTenant, PASSWORD, type Tenant } from "./factories";

const STRONG = "brandnew99";

/**
 * The password policy was written out separately at each endpoint that
 * accepts one, and change-password was the endpoint it was never written
 * into. Registering under the rule and then stepping around it was a
 * two-request sequence, which is what these tests now close.
 */
describe("changing a password", () => {
  let acme: Tenant;

  beforeEach(async () => {
    acme = await createTenant("Acme");
  });

  const change = (body: Record<string, unknown>) =>
    request(app)
      .post("/api/user/change-password")
      .set("Authorization", bearer(acme.managerToken))
      .send(body);

  it("accepts a password that meets the policy", async () => {
    const res = await change({
      currentPassword: PASSWORD,
      newPassword: STRONG,
    });

    expect(res.status).toBe(200);
    // The response used to say `seccess`, so a client reading `success` saw
    // undefined and reported a successful change as a failure.
    expect(res.body.success).toBe(true);

    const user = await UserModel.findById(acme.manager._id);
    expect(await comparePassword(STRONG, user!.password)).toBe(true);
  });

  it("refuses a password shorter than the registration rule allows", async () => {
    const res = await change({ currentPassword: PASSWORD, newPassword: "1" });

    expect(res.status).toBe(400);
    expect(res.body.errors.newPassword).toBeDefined();

    const user = await UserModel.findById(acme.manager._id);
    expect(await comparePassword(PASSWORD, user!.password)).toBe(true);
  });

  it("refuses a password with no digit, as registration does", async () => {
    const res = await change({
      currentPassword: PASSWORD,
      newPassword: "nodigitshere",
    });

    expect(res.status).toBe(400);
  });

  it("refuses the change when the current password is wrong", async () => {
    const res = await change({
      currentPassword: "not-my-password",
      newPassword: STRONG,
    });

    expect(res.status).toBe(400);
    const user = await UserModel.findById(acme.manager._id);
    expect(await comparePassword(PASSWORD, user!.password)).toBe(true);
  });

  it("lets the user sign in with the new password afterwards", async () => {
    await change({ currentPassword: PASSWORD, newPassword: STRONG });

    const res = await request(app)
      .post("/api/auth/login")
      .set("X-Forwarded-For", "198.51.100.7")
      .send({ email: acme.manager.email, password: STRONG });

    expect(res.status).toBe(200);
  });
});

describe("editing a profile", () => {
  let acme: Tenant;

  beforeEach(async () => {
    acme = await createTenant("Acme");
  });

  const update = (body: Record<string, unknown>) =>
    request(app)
      .put("/api/user/me")
      .set("Authorization", bearer(acme.managerToken))
      .send(body);

  it("saves a valid name and email", async () => {
    const res = await update({ name: "Renamed", email: "renamed@acme.test" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Renamed");
    expect(res.body.data.password).toBeUndefined();
  });

  it("refuses an address that is not an email", async () => {
    const res = await update({ name: "Renamed", email: "not-an-email" });

    expect(res.status).toBe(400);
    const user = await UserModel.findById(acme.manager._id);
    expect(user!.email).toBe("manager@acme.test");
  });

  it("refuses an empty name", async () => {
    const res = await update({ name: "", email: "renamed@acme.test" });
    expect(res.status).toBe(400);
  });

  it("refuses an email another account already uses", async () => {
    const res = await update({
      name: "Renamed",
      email: acme.worker.email,
    });

    expect(res.status).toBe(409);
  });

  it("never returns the password hash from the profile endpoint", async () => {
    const res = await request(app)
      .get("/api/user/me")
      .set("Authorization", bearer(acme.managerToken));

    expect(res.status).toBe(200);
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.inviteToken).toBeUndefined();
  });
});
