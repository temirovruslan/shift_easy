import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../app";
import SiteModel from "../models/Site.model";
import { bearer, createTenant, type Tenant } from "./factories";

/**
 * Site queries were already company-scoped — this controller is the pattern
 * the worker fixes were brought in line with. What it got wrong was the
 * answer: a foreign or missing site came back as 400 "Something went wrong"
 * from archive and activate, and 400 "Not founed site" from get. A refused
 * request is the caller's situation to handle, and it needs a status that
 * says so.
 */
describe("site endpoints answer 404 for foreign and missing sites", () => {
  let acme: Tenant;
  let globex: Tenant;

  beforeEach(async () => {
    acme = await createTenant("Acme");
    globex = await createTenant("Globex");
  });

  it("serves the manager's own site", async () => {
    const res = await request(app)
      .get(`/api/site/${acme.site._id}`)
      .set("Authorization", bearer(acme.managerToken));

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Acme Site");
  });

  it("hides another company's site behind a 404", async () => {
    const res = await request(app)
      .get(`/api/site/${globex.site._id}`)
      .set("Authorization", bearer(acme.managerToken));

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Site not found");
  });

  it("refuses to archive another company's site and leaves it active", async () => {
    const res = await request(app)
      .patch(`/api/site/archive/${globex.site._id}`)
      .set("Authorization", bearer(acme.managerToken));

    expect(res.status).toBe(404);
    expect((await SiteModel.findById(globex.site._id))?.status).toBe("active");
  });

  it("archives and reactivates the manager's own site", async () => {
    const archived = await request(app)
      .patch(`/api/site/archive/${acme.site._id}`)
      .set("Authorization", bearer(acme.managerToken));
    expect(archived.status).toBe(200);
    expect((await SiteModel.findById(acme.site._id))?.status).toBe("archived");

    const activated = await request(app)
      .patch(`/api/site/activate/${acme.site._id}`)
      .set("Authorization", bearer(acme.managerToken));
    expect(activated.status).toBe(200);
    expect((await SiteModel.findById(acme.site._id))?.status).toBe("active");
  });

  it("keeps site lists inside one company", async () => {
    const res = await request(app)
      .get("/api/site")
      .set("Authorization", bearer(acme.managerToken));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Acme Site");
  });

  it("refuses to rename another company's site", async () => {
    const res = await request(app)
      .patch(`/api/site/${globex.site._id}`)
      .set("Authorization", bearer(acme.managerToken))
      .send({ name: "Taken Over", address: "1 Hostile Way" });

    expect(res.status).toBe(404);
    expect((await SiteModel.findById(globex.site._id))?.name).toBe("Globex Site");
  });
});
