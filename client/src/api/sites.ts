import api from "./axios";

export const createSite = async (data: any) => {
  const res = await api.post("/site", data);
  return res.data;
};

export const getSites = async () => {
  const res = await api.get("/site");
  return res.data;
};

export const getSite = async (id: string) => {
  const res = await api.get(`/site/${id}`);
  return res.data;
};

export const updateSite = async (id: string, data: { name?: string; address?: string }) => {
  const res = await api.patch(`/site/${id}`, data);
  return res.data;
};

export const archiveSite = async (id: string) => {
  const res = await api.patch(`/site/archive/${id}`);
  return res.data;
};

export const activateSite = async (id: string) => {
  const res = await api.patch(`/site/activate/${id}`);
  return res.data;
};

