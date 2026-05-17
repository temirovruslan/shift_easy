import api from "./axios";

export const assignWorkers = async (siteId: string, workerIds: string[]) => {
  const res = await api.post(`/worker/assign/${siteId}`, { workerIds });
  return res.data;
};

export const getAllWorkers = async () => {
  const res = await api.get("/worker");
  return res.data;
};
