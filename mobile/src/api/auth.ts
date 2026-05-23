import api from "./axios";

export const loginManager = (data: { email: string; password: string }) =>
  api.post("/auth/login", data);

export const loginWorker = (data: { email: string; password: string }) =>
  api.post("/auth/login", data);

export const checkEmail = (email: string) =>
  api.post("/auth/check-email", { email });

export const registerManager = (data: {
  name: string;
  companyName: string;
  email: string;
  password: string;
  siteName: string;
  siteAddress: string;
}) => api.post("/auth/register", data);

export const forgotPassword = (email: string) =>
  api.post("/auth/forgot-password", { email });

export const resetPassword = (data: { password: string }, token?: string) =>
  api.post(`/auth/reset-password/${token}`, data);
