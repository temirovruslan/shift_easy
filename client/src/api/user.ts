import api from "./axios";

export const getUser = async () => {
  const res = await api.get("/user/me");
  return res.data;
};

export const updateProfile = async (data: { name: string; email: string }) => {
  const res = await api.put("/user/me", data);
  return res.data;
};

export const userChangePassword = async (data: any) => {
  const res = await api.post("user/change-password", data);
  return res;
};
