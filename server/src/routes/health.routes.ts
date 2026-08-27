import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

/**
 * Liveness and readiness in one place.
 *
 * A deploy that starts the process but cannot reach the database looks
 * healthy from the outside: the port is open and routes answer. This is what
 * distinguishes the two, which is why it reports the database state rather
 * than a bare `ok`, and why it answers 503 rather than 200 when the
 * connection is down — a health check that always returns 200 is decoration.
 *
 * Unauthenticated by necessity: the platform probing it has no credentials.
 * It exposes nothing an anonymous caller could not already infer by watching
 * whether requests succeed.
 */
router.get("/", (_req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "degraded",
    database: connected ? "connected" : "disconnected",
    uptime: Math.round(process.uptime()),
  });
});

export default router;
