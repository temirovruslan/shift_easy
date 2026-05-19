import api from "./axios";

export const assignWorkers = async (siteId: string, workerIds: string[]) => {
  const res = await api.post(`/worker/assign/${siteId}`, { workerIds });
  return res.data;
};

export const getAllWorkers = async () => {
  const res = await api.get("/worker");
  return res.data;
};

export const createWorker = async (data: any) => {
  const res = await api.post("/worker", data);
  return res.data;
};

export const getWorker = async (id: string) => {
  const res = await api.get(`/worker/${id}`);
  return res.data;
};
export const removeWorker = async (id: string) => {
  const res = await api.delete(`/worker/${id}`);
  return res.data;
};

export const getArchivedWorkers = async () => {
  const res = await api.get("/worker/archived");
  return res.data;
};

export const restoreWorker = async (id: string) => {
  const res = await api.patch(`/worker/restore/${id}`);
  return res.data;
};

export const sendInvite = async (id: string) => {
  const res = await api.post(`/worker/${id}/invite`);
  return res.data;
};

export const updateWorker = async (
  id: string,
  data: { name: string; email: string; occupation: string },
) => {
  const res = await api.put(`/worker/${id}`, data);
  return res.data;
};
