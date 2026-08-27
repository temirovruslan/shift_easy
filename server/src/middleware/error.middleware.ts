import { NextFunction, Request, Response } from "express";
import AppError from "../errors/AppError";
import { isProduction } from "../config/env";

/**
 * Reached when no route matched. Express's built-in fallback answers with an
 * HTML page, so a client that mistyped a path got a parse error instead of a
 * status it could act on.
 */
export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
};

type MongoLikeError = {
  name?: string;
  code?: number;
  statusCode?: number;
  message?: string;
  keyValue?: Record<string, unknown>;
};

/**
 * The single place a failure becomes a response.
 *
 * Errors we raise on purpose carry their own status. Two failures from
 * Mongoose are the client's fault and used to be reported as 500: an id that
 * is not an ObjectId, and a write that collides with a unique index. Anything
 * else is a bug, so it is logged in full and answered with a generic message
 * — a stack trace in a response body tells an attacker about the stack for
 * free.
 */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  const candidate = (err ?? {}) as MongoLikeError;

  if (candidate.name === "CastError") {
    res.status(400).json({ success: false, message: "Invalid identifier" });
    return;
  }

  if (candidate.code === 11000) {
    const field = Object.keys(candidate.keyValue ?? {})[0] ?? "value";
    res.status(409).json({
      success: false,
      message: `That ${field} is already in use`,
    });
    return;
  }

  // Kept for handlers that still set statusCode on a plain object.
  if (typeof candidate.statusCode === "number") {
    res
      .status(candidate.statusCode)
      .json({ success: false, message: candidate.message ?? "Request failed" });
    return;
  }

  console.error(err);
  res.status(500).json({
    success: false,
    message: isProduction ? "Something went wrong" : String(candidate.message),
  });
};
