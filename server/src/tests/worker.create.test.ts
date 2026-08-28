import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../app";
import SiteModel from "../models/Site.model";
import UserModel from "../models/User.model";
import { bearer, createTenant, type Tenant } from "./factories";

vi.mock("../utils/email.utils", () => ({
  sendInviteEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

const newWorker = {
  name: "New Hire",
  email: "hire@acme.test",
  occupation: "Bricklayer",
};

describe("creating a worker", () => {
  let acme: Tenant;

  beforeEach(async () => {
    acme = await createTenant("Acme");
  });

  /**
   * Regression test. workerSchema did not declare siteId and the validate
   * middleware replaces the body with the parsed result, so Zod stripped the
   * field before the controller ran. The API answered 201 and the worker was
   * assigned to nothing — which only surfaced later, when they could not
   * start a shift.
   */
  it("assigns the worker to the site chosen in the request", async () => {
    const res = await request(app)
      .post("/api/worker")
      .set("Authorization", bearer(acme.managerToken))
      .send({ ...newWorker, siteId: String(acme.site._id) });

    expect(res.status).toBe(201);

    const created = await UserModel.findOne({ email: newWorker.email });
    expect(created?.sites.map(String)).toEqual([String(acme.site._id)]);

    // Both sides of the link, not just the worker's copy of it.
    const site = await SiteModel.findById(acme.site._id);
    expect(site?.workers.map(String)).toContain(String(created?._id));
  });

  it("lets the new worker start a shift on that site straight away", async () => {
    await request(app)
      .post("/api/worker")
      .set("Authorization", bearer(acme.managerToken))
      .send({ ...newWorker, siteId: String(acme.site._id) });

    const created = await UserModel.findOne({ email: newWorker.email });
    const { generateToken } = await import("../utils/jwt.utils");

    const res = await request(app)
      .post("/api/shifts/start")
      .set("Authorization", bearer(generateToken(String(created?._id))))
      .send({ siteId: String(acme.site._id) });

    expect(res.status).toBe(201);
  });

  it("creates an unassigned worker when no site is chosen", async () => {
    const res = await request(app)
      .post("/api/worker")
      .set("Authorization", bearer(acme.managerToken))
      .send(newWorker);

    expect(res.status).toBe(201);
    const created = await UserModel.findOne({ email: newWorker.email });
    expect(created?.sites).toHaveLength(0);
  });

  it("refuses another company's site and creates nobody", async () => {
    const globex = await createTenant("Globex");

    const res = await request(app)
      .post("/api/worker")
      .set("Authorization", bearer(acme.managerToken))
      .send({ ...newWorker, siteId: String(globex.site._id) });

    expect(res.status).toBe(404);
    expect(await UserModel.findOne({ email: newWorker.email })).toBeNull();
  });

  it("rejects a malformed site id with 400 rather than 500", async () => {
    const res = await request(app)
      .post("/api/worker")
      .set("Authorization", bearer(acme.managerToken))
      .send({ ...newWorker, siteId: "not-an-object-id" });

    expect(res.status).toBe(400);
    expect(res.body.errors.siteId).toBeDefined();
  });

  it("refuses an email that already exists", async () => {
    const res = await request(app)
      .post("/api/worker")
      .set("Authorization", bearer(acme.managerToken))
      .send({ ...newWorker, email: acme.worker.email });

    expect(res.status).toBe(409);
  });
});

/**
 * Creating a worker and inviting them are separate outcomes. The invite goes
 * through an external provider that fails on its own — a rejected key, an
 * unverified sender, an outage — and reporting only the creation turned a
 * silent failure into an apparent success.
 */
describe("invite delivery is reported separately from creation", () => {
  let acme: Tenant;

  beforeEach(async () => {
    acme = await createTenant("Acme");
  });

  it("says the invite was sent when it was", async () => {
    const res = await request(app)
      .post("/api/worker")
      .set("Authorization", bearer(acme.managerToken))
      .send(newWorker);

    expect(res.status).toBe(201);
    expect(res.body.inviteSent).toBe(true);
  });

  it("still creates the worker when the invite fails, and says so", async () => {
    const { sendInviteEmail } = await import("../utils/email.utils");
    vi.mocked(sendInviteEmail).mockRejectedValueOnce(new Error("provider down"));

    const res = await request(app)
      .post("/api/worker")
      .set("Authorization", bearer(acme.managerToken))
      .send(newWorker);

    // The worker exists — losing them because an email bounced would be worse.
    expect(res.status).toBe(201);
    expect(res.body.inviteSent).toBe(false);
    expect(await UserModel.findOne({ email: newWorker.email })).not.toBeNull();
  });

  it("reports a failed resend as a failure, not a success", async () => {
    const { sendInviteEmail } = await import("../utils/email.utils");
    vi.mocked(sendInviteEmail).mockRejectedValueOnce(new Error("provider down"));

    const res = await request(app)
      .post(`/api/worker/${acme.worker._id}/invite`)
      .set("Authorization", bearer(acme.managerToken));

    // Here sending the invite is the entire operation, so 200 would be a lie.
    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
  });
});
