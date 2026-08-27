import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json";
const app = express();
import { Request, Response, NextFunction } from "express";
import { env, isTest } from "./config/env";

// routers
import authRouter from "./routes/auth.routes";
import shiftsRouter from "./routes/shifts.routes";
import userRouter from "./routes/user.routes";
import siteRouter from "./routes/site.routes";
import workerRouter from './routes/worker.routes'
// The client origin plus whatever CORS_ORIGINS lists. Local development
// ports used to be compiled in, so adding an environment meant editing this
// file and shipping a release.
const allowedOrigins = [env.CLIENT_URL, ...env.CORS_ORIGINS];
// How many proxies sit in front of the API. Render adds one; a different
// deployment says so through TRUST_PROXY rather than by editing this line.
// It decides which address the rate limiters count.
app.set("trust proxy", env.TRUST_PROXY);

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
// Request logging is noise in the test suite, where the useful output is the
// assertion results rather than a few hundred request lines.
if (!isTest) {
  app.use(morgan("dev"));
}

// API docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
