import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import app from "../app";

/**
 * The whole product, once, in the order a real company lives it.
 *
 * Every other suite tests a boundary. This one asks the question the product
 * exists to answer: a manager signs up, invites someone, that person works a
 * shift, and the hours arrive in the manager's export. Each step depends on
 * the one before it, so a break anywhere in the chain fails here even when
 * the individual endpoints still pass their own tests.
 *
 * It runs against the real HTTP surface and the real database. The one thing
 * mocked is the email provider, and only to capture the invite link a worker
 * would receive — without it there is no way to activate the account, which
 * is exactly the point the chain would otherwise break at.
 */
const sentInvites: string[] = [];

vi.mock("../utils/email.utils", () => ({
  sendInviteEmail: vi.fn(async (_to: string, _name: string, link: string) => {
    sentInvites.push(link);
  }),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

const from = (address: string) => ({ "X-Forwarded-For": address });

describe("a company's first week", () => {
  it("carries hours from a worker's shift to the manager's export", async () => {
    const client = from("198.51.100.42");

    // ── The manager signs up. This creates the company and its first site.
    const registered = await request(app)
      .post("/api/auth/register")
      .set(client)
      .send({
        name: "Dana Mor",
        email: "dana@northbuild.test",
        password: "scaffold99",
        companyName: "Northbuild",
        siteName: "Riverside Block A",
        siteAddress: "14 Riverside Way, Leeds",
      });

    expect(registered.status).toBe(201);
    expect(registered.body.data.role).toBe("manager");
    const managerToken = `Bearer ${registered.body.data.token}`;

    // ── The site exists and belongs to them.
    const sites = await request(app)
      .get("/api/site")
      .set("Authorization", managerToken);

    expect(sites.status).toBe(200);
    expect(sites.body.data).toHaveLength(1);
    const siteId = sites.body.data[0]._id;

    // ── They invite a worker onto it.
    const invited = await request(app)
      .post("/api/worker")
      .set("Authorization", managerToken)
      .send({
        name: "Sam Reid",
        email: "sam@northbuild.test",
        occupation: "Scaffolder",
        siteId,
      });

    expect(invited.status).toBe(201);
    expect(invited.body.inviteSent).toBe(true);

    // ── The invite email carries a one-time link. Without it the worker
    //    cannot set a password, and the chain stops here.
    expect(sentInvites).toHaveLength(1);
    const token = sentInvites[0].split("/activate/")[1];
    expect(token).toBeTruthy();

    // ── The worker activates and chooses their own password.
    const activated = await request(app)
      .post(`/api/auth/activate/${token}`)
      .set(client)
      .send({ password: "hardhat42" });

    expect(activated.status).toBe(200);

    // ── The link is one-time: using it again must not work.
    const reused = await request(app)
      .post(`/api/auth/activate/${token}`)
      .set(client)
      .send({ password: "someoneelse7" });

    expect(reused.status).toBe(400);

    // ── They sign in with the password they chose, not the one they were sent.
    const signedIn = await request(app)
      .post("/api/auth/login")
      .set(from("198.51.100.43"))
      .send({ email: "sam@northbuild.test", password: "hardhat42" });

    expect(signedIn.status).toBe(200);
    expect(signedIn.body.data.role).toBe("worker");
    const workerToken = `Bearer ${signedIn.body.data.token}`;

    // ── They clock in at the site the manager put them on.
    const started = await request(app)
      .post("/api/shifts/start")
      .set("Authorization", workerToken)
      .send({ siteId });

    expect(started.status).toBe(201);

    // ── Backdated so the shift has a duration worth reading. The server owns
    //    the clock; the client never sends a time.
    const ShiftModel = (await import("../models/Shift.model")).default;
    await ShiftModel.updateOne(
      { _id: started.body.data._id },
      { startTime: new Date(Date.now() - 7 * 60 * 60 * 1000 - 50 * 60 * 1000) },
    );

    // ── They clock out at the end of the day.
    const stopped = await request(app)
      .post("/api/shifts/stop")
      .set("Authorization", workerToken)
      .send({ notes: "Erected the east face scaffold to level three" });

    expect(stopped.status).toBe(200);
    expect(stopped.body.data.status).toBe("completed");
    expect(stopped.body.data.duration).toBe(470);

    // ── And the manager sees those hours. This is the payoff: seven hours and
    //    fifty minutes, attributed to the right person and the right site.
    const exported = await request(app)
      .get("/api/shifts/export")
      .set("Authorization", managerToken);

    expect(exported.status).toBe(200);
    expect(exported.body.count).toBe(1);
    expect(exported.body.data[0].duration).toBe(470);
    expect(exported.body.data[0].worker.name).toBe("Sam Reid");
    expect(exported.body.data[0].site.name).toBe("Riverside Block A");
  });
});
