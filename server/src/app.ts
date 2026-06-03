import express from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json";
const app = express();
import { Request, Response, NextFunction } from "express";

// routers
import authRouter from "./routes/auth.routes";
import shiftsRouter from "./routes/shifts.routes";
import userRouter from "./routes/user.routes";
import siteRouter from "./routes/site.routes";
import workerRouter from './routes/worker.routes'
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:5173",
].filter((o): o is string => Boolean(o));
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(morgan("dev"));

// API docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// temp debug — remove after testing
app.get("/api/ping", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// routers
app.use("/api/auth", authRouter);
app.use("/api/shifts", shiftsRouter);
app.use("/api/user", userRouter);
app.use("/api/site", siteRouter);
app.use("/api/worker", workerRouter);
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.statusCode) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }
  console.error(err);
  res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
});

export default app;
