import express from "express";
import cors from "cors";
import morgan from "morgan";
const app = express();
import authRouter from "./routes/auth.routes";
import shiftsRouter from "./routes/shifts.routes";
import userRouter from "./routes/user.routes";
import AppError from "./errors/AppError";
import { Request, Response, NextFunction } from "express";

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRouter);
app.use("/api/shifts", shiftsRouter);
app.use("/api/user", userRouter);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
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
