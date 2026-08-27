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

/**
 * Two companies exist in the same database. Acme's manager is a legitimate,
 * fully authenticated manager — `protect` and `requireManager` both pass for
 * them. The only thing standing between them and Globex's worker is company
 * scoping, so every request below is the real attack, not a stand-in for it.
 *
 * Each case is paired with the same call against Acme's own worker. Without
 * that control the suite would still pass if the endpoints started answering
 * 404 for everybody.
 */
describe("worker endpoints are scoped to the manager's company", () => {
  let acme: Tenant;
  let globex: Tenant;

  beforeEach(async () => {
    acme = await createTenant("Acme");
    globex = await createTenant("Globex");
  });

  it("hides another company's worker from GET /api/worker/:id", async () => {
    const foreign = await request(app)
      .get(`/api/worker/${globex.worker._id}`)
      .set("Authorization", bearer(acme.managerToken));
    expect(foreign.status).toBe(404);

    const own = await request(app)
      .get(`/api/worker/${acme.worker._id}`)
      .set("Authorization", bearer(acme.managerToken));
    expect(own.status).toBe(200);
    expect(own.body.data.name).toBe("Acme Worker");
  });

  it("refuses to edit another company's worker", async () => {
    const foreign = await request(app)
      .put(`/api/worker/${globex.worker._id}`)
      .set("Authorization", bearer(acme.managerToken))
      .send({ name: "Stolen", email: "attacker@acme.test", occupation: "Foreman" });
    expect(foreign.status).toBe(404);

    // The email is what makes this endpoint dangerous: rewriting it and then
    // resending the invite would hand the account to whoever owns the new
    // address. Confirm nothing moved.
    const untouched = await UserModel.findById(globex.worker._id);
    expect(untouched?.name).toBe("Globex Worker");
    expect(untouched?.email).toBe("worker@globex.test");

    const own = await request(app)
      .put(`/api/worker/${acme.worker._id}`)
      .set("Authorization", bearer(acme.managerToken))
      .send({ name: "Renamed", email: "renamed@acme.test", occupation: "Foreman" });
    expect(own.status).toBe(200);
    expect(own.body.data.name).toBe("Renamed");
  });

  it("refuses to archive another company's worker", async () => {
    const foreign = await request(app)
      .delete(`/api/worker/${globex.worker._id}`)
      .set("Authorization", bearer(acme.managerToken));
    expect(foreign.status).toBe(404);
    expect((await UserModel.findById(globex.worker._id))?.isArchived).toBe(false);

    const own = await request(app)
      .delete(`/api/worker/${acme.worker._id}`)
      .set("Authorization", bearer(acme.managerToken));
    expect(own.status).toBe(200);
    expect((await UserModel.findById(acme.worker._id))?.isArchived).toBe(true);
  });

  it("refuses to restore another company's archived worker", async () => {
    await UserModel.updateOne(
      { _id: globex.worker._id },
      { isArchived: true },
    );

    const foreign = await request(app)
      .patch(`/api/worker/restore/${globex.worker._id}`)
      .set("Authorization", bearer(acme.managerToken));
    expect(foreign.status).toBe(404);
    expect((await UserModel.findById(globex.worker._id))?.isArchived).toBe(true);
  });

  it("refuses to resend an invite to another company's worker", async () => {
    const before = await UserModel.findById(globex.worker._id);

    const foreign = await request(app)
      .post(`/api/worker/${globex.worker._id}/invite`)
      .set("Authorization", bearer(acme.managerToken));
    expect(foreign.status).toBe(404);

    // A fresh invite token would mean the invite email really was reissued.
    const after = await UserModel.findById(globex.worker._id);
    expect(after?.inviteToken).toBe(before?.inviteToken);

    const own = await request(app)
      .post(`/api/worker/${acme.worker._id}/invite`)
      .set("Authorization", bearer(acme.managerToken));
    expect(own.status).toBe(200);
  });

  it("keeps another company's workers out of the list", async () => {
    const res = await request(app)
      .get("/api/worker")
      .set("Authorization", bearer(acme.managerToken));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].email).toBe("worker@acme.test");
  });
});

describe("assigning workers to sites stays inside one company", () => {
  let acme: Tenant;
  let globex: Tenant;

  beforeEach(async () => {
    acme = await createTenant("Acme");
    globex = await createTenant("Globex");
  });

  it("refuses to assign our worker to another company's site", async () => {
    const res = await request(app)
      .post(`/api/worker/assign/${globex.site._id}`)
      .set("Authorization", bearer(acme.managerToken))
      .send({ workerIds: [String(acme.worker._id)] });

    expect(res.status).toBe(404);

    const site = await SiteModel.findById(globex.site._id);
    expect(site?.workers.map(String)).not.toContain(String(acme.worker._id));
  });

  it("refuses to assign another company's worker to our site", async () => {
    const res = await request(app)
      .post(`/api/worker/assign/${acme.site._id}`)
      .set("Authorization", bearer(acme.managerToken))
      .send({ workerIds: [String(globex.worker._id)] });

    expect(res.status).toBe(404);

    const worker = await UserModel.findById(globex.worker._id);
    expect(worker?.sites.map(String)).not.toContain(String(acme.site._id));
  });

  it("rejects the whole batch when one worker is not ours", async () => {
    const newcomer = await UserModel.create({
      name: "Acme Newcomer",
      email: "newcomer@acme.test",
      password: "hashed",
      role: "worker",
      company: acme.company._id,
      isActivated: true,
    });

    const res = await request(app)
      .post(`/api/worker/assign/${acme.site._id}`)
      .set("Authorization", bearer(acme.managerToken))
      .send({
        workerIds: [String(newcomer._id), String(globex.worker._id)],
      });

    expect(res.status).toBe(404);

    // Fail closed: a partly applied assignment is harder to notice than a
    // refused one, so the valid half must not have been written either.
    const untouched = await UserModel.findById(newcomer._id);
    expect(untouched?.sites).toHaveLength(0);
  });

  it("assigns our own workers to our own site", async () => {
    const newcomer = await UserModel.create({
      name: "Acme Newcomer",
      email: "newcomer@acme.test",
      password: "hashed",
      role: "worker",
      company: acme.company._id,
      isActivated: true,
    });

    const res = await request(app)
      .post(`/api/worker/assign/${acme.site._id}`)
      .set("Authorization", bearer(acme.managerToken))
      .send({ workerIds: [String(newcomer._id)] });

    expect(res.status).toBe(200);
    const updated = await UserModel.findById(newcomer._id);
    expect(updated?.sites.map(String)).toContain(String(acme.site._id));
  });
});
