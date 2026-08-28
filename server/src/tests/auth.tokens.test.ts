import crypto from "crypto";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../app";
import UserModel, { IUser } from "../models/User.model";
import { comparePassword } from "../utils/hash.utils";
import { createTenant, newClientAddress, type Tenant } from "./factories";

vi.mock("../utils/email.utils", () => ({
  sendInviteEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

/**
 * A one-time link has to stop working once it is used.
 *
 * It did not. Both handlers cleared the token by assigning `undefined`, and
 * Mongoose drops undefined values from an update object, so the field was
 * never removed. An invite stayed usable for its full thirty days and a reset
 * link for its fifteen minutes — after the account holder had already set
 * their password. Anyone still holding the link could take the account.
 */
const issueToken = async (userId: IUser["_id"], minutesValid: number) => {
  const raw = crypto.randomBytes(32).toString("hex");
  await UserModel.updateOne(
    { _id: userId },
    {
      inviteToken: crypto.createHash("sha256").update(raw).digest("hex"),
      inviteTokenExpires: new Date(Date.now() + minutesValid * 60 * 1000),
    },
  );
  return raw;
};

describe("one-time links are one-time", () => {
  let acme: Tenant;

  beforeEach(async () => {
    acme = await createTenant("Acme");
  });

  it("refuses an activation link that has already been used", async () => {
    const token = await issueToken(acme.worker._id, 30 * 24 * 60);

    const first = await request(app)
      .post(`/api/auth/activate/${token}`)
      .set("X-Forwarded-For", newClientAddress())
      .send({ password: "chosen123" });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post(`/api/auth/activate/${token}`)
      .set("X-Forwarded-For", newClientAddress())
      .send({ password: "stolen456" });
    expect(second.status).toBe(400);

    // The password the account holder chose is still the one that works.
    const user = await UserModel.findById(acme.worker._id);
    expect(await comparePassword("chosen123", user!.password)).toBe(true);
    expect(await comparePassword("stolen456", user!.password)).toBe(false);
  });

  it("removes the token from the record rather than leaving it set", async () => {
    const token = await issueToken(acme.worker._id, 30 * 24 * 60);

    await request(app)
      .post(`/api/auth/activate/${token}`)
      .set("X-Forwarded-For", newClientAddress())
      .send({ password: "chosen123" });

    const user = await UserModel.findById(acme.worker._id);
    expect(user!.inviteToken).toBeUndefined();
    expect(user!.inviteTokenExpires).toBeUndefined();
    expect(user!.isActivated).toBe(true);
  });

  it("refuses a password reset link that has already been used", async () => {
    const token = await issueToken(acme.manager._id, 15);

    const first = await request(app)
      .post(`/api/auth/reset-password/${token}`)
      .set("X-Forwarded-For", newClientAddress())
      .send({ password: "chosen123" });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post(`/api/auth/reset-password/${token}`)
      .set("X-Forwarded-For", newClientAddress())
      .send({ password: "stolen456" });
    expect(second.status).toBe(400);

    const user = await UserModel.findById(acme.manager._id);
    expect(await comparePassword("chosen123", user!.password)).toBe(true);
  });

  it("refuses a token that has expired", async () => {
    const raw = crypto.randomBytes(32).toString("hex");
    await UserModel.updateOne(
      { _id: acme.worker._id },
      {
        inviteToken: crypto.createHash("sha256").update(raw).digest("hex"),
        inviteTokenExpires: new Date(Date.now() - 1000),
      },
    );

    const res = await request(app)
      .post(`/api/auth/activate/${raw}`)
      .set("X-Forwarded-For", newClientAddress())
      .send({ password: "chosen123" });

    expect(res.status).toBe(400);
  });
});
