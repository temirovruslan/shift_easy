import api from "./axios";

export const getMyShifts = () => api.get("/shifts/my");

export const startShift = (siteId: string) =>
  api.post("/shifts/start", { siteId });

export const stopShift = (data: { notes?: string; materials?: string }) =>
  api.post("/shifts/stop", data);
