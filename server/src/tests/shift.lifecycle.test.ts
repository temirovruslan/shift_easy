import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../app";
import ShiftModel from "../models/Shift.model";
import { bearer, createTenant, type Tenant } from "./factories";

const NOTES = "Poured the foundation on the east wing";

/**
 * Clocking in and out is the product. If these break, ShiftEasy records the
 * wrong hours and everything downstream — timesheets, exports, payroll — is
 * wrong with it, quietly.
 */
describe("shift lifecycle", () => {
  let acme: Tenant;

  beforeEach(async () => {
    acme = await createTenant("Acme");
  });

  it("starts a shift on a site the worker is assigned to", async () => {
    const res = await request(app)
      .post("/api/shifts/start")
      .set("Authorization", bearer(acme.workerToken))
      .send({ siteId: String(acme.site._id) });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("active");
    expect(res.body.data.site).toBe(String(acme.site._id));
    // Stamped from the worker, never from the request body.
    expect(res.body.data.company).toBe(String(acme.company._id));
  });

  it("refuses a second active shift", async () => {
    await request(app)
      .post("/api/shifts/start")
      .set("Authorization", bearer(acme.workerToken))
      .send({ siteId: String(acme.site._id) });

    const second = await request(app)
      .post("/api/shifts/start")
      .set("Authorization", bearer(acme.workerToken))
      .send({ siteId: String(acme.site._id) });

    expect(second.status).toBe(400);
    expect(await ShiftModel.countDocuments({ status: "active" })).toBe(1);
  });

  it("refuses a site the worker is not assigned to", async () => {
    const globex = await createTenant("Globex");

    const res = await request(app)
      .post("/api/shifts/start")
      .set("Authorization", bearer(acme.workerToken))
      .send({ siteId: String(globex.site._id) });

    expect(res.status).toBe(403);
    expect(await ShiftModel.countDocuments()).toBe(0);
  });

  it("completes the shift and records its duration", async () => {
    await request(app)
      .post("/api/shifts/start")
      .set("Authorization", bearer(acme.workerToken))
      .send({ siteId: String(acme.site._id) });

    // Backdate the start so the duration is a real number rather than zero.
    await ShiftModel.updateOne(
      { worker: acme.worker._id, status: "active" },
      { startTime: new Date(Date.now() - 90 * 60 * 1000) },
    );

    const res = await request(app)
      .post("/api/shifts/stop")
      .set("Authorization", bearer(acme.workerToken))
      .send({ notes: NOTES });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("completed");
    expect(res.body.data.duration).toBe(90);
    expect(res.body.data.notes).toBe(NOTES);
  });

  it("refuses to stop when nothing is running", async () => {
    const res = await request(app)
      .post("/api/shifts/stop")
      .set("Authorization", bearer(acme.workerToken))
      .send({ notes: NOTES });

    expect(res.status).toBe(409);
  });

  it("rejects a stop without usable notes", async () => {
    await request(app)
      .post("/api/shifts/start")
      .set("Authorization", bearer(acme.workerToken))
      .send({ siteId: String(acme.site._id) });

    const res = await request(app)
      .post("/api/shifts/stop")
      .set("Authorization", bearer(acme.workerToken))
      .send({ notes: "short" });

    expect(res.status).toBe(400);
    expect(await ShiftModel.countDocuments({ status: "active" })).toBe(1);
  });
});

describe("managers only see their own company's shifts", () => {
  it("excludes another company's shifts from the dashboard", async () => {
    const acme = await createTenant("Acme");
    const globex = await createTenant("Globex");

    await request(app)
      .post("/api/shifts/start")
      .set("Authorization", bearer(acme.workerToken))
      .send({ siteId: String(acme.site._id) });

    await request(app)
      .post("/api/shifts/start")
      .set("Authorization", bearer(globex.workerToken))
      .send({ siteId: String(globex.site._id) });

    const res = await request(app)
      .get("/api/shifts")
      .set("Authorization", bearer(acme.managerToken));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].worker.name).toBe("Acme Worker");
  });

  it("hides another company's shift behind a 404", async () => {
    const acme = await createTenant("Acme");
    const globex = await createTenant("Globex");

    const started = await request(app)
      .post("/api/shifts/start")
      .set("Authorization", bearer(globex.workerToken))
      .send({ siteId: String(globex.site._id) });

    const res = await request(app)
      .get(`/api/shifts/${started.body.data._id}`)
      .set("Authorization", bearer(acme.managerToken));

    expect(res.status).toBe(404);
  });
});
