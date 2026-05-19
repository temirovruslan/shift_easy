import api from "./axios";

export const getMyShift = async () => {
  const res = await api.get("/shifts/my");
  return res;
};

export const startMyShift = async (data: any) => {
  const res = await api.post("/shifts/start", data);
  return res.data;
};

export const stopMyShift = async (data: any) => {
  const res = await api.post("/shifts/stop", data);
  return res.data;
};