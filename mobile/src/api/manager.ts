import api from "./axios";

export const getAllShifts = () => api.get("/shifts");
export const getAllWorkers = () => api.get("/worker");
export const getSites = () => api.get("/site");
export const getSite = (id: string) => api.get(`/site/${id}`);
export const createSite = (data: { name: string; address: string }) => api.post("/site", data);
export const updateSite = (id: string, data: { name?: string; address?: string }) => api.patch(`/site/${id}`, data);
export const archiveSite = (id: string) => api.patch(`/site/archive/${id}`);
export const activateSite = (id: string) => api.patch(`/site/activate/${id}`);
export const assignWorkers = (siteId: string, workerIds: string[]) =>
  api.post(`/worker/assign/${siteId}`, { workerIds });
export const getWorker = (id: string) => api.get(`/worker/${id}`);
export const createWorker = (data: { name: string; email: string; occupation: string }) =>
  api.post("/worker", data);
export const removeWorker = (id: string) => api.delete(`/worker/${id}`);
export const getArchivedWorkers = () => api.get("/worker/archived");
export const restoreWorker = (id: string) => api.patch(`/worker/restore/${id}`);
export const sendInvite = (id: string) => api.post(`/worker/${id}/invite`);
export const updateWorker = (id: string, data: { name: string; email: string; occupation: string }) =>
  api.put(`/worker/${id}`, data);
