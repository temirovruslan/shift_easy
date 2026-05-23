import api from "./axios";

export const getMe = () => api.get("/user/me");
export const updateProfile = (data: { name: string; email: string }) => api.put("/user/me", data);
export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  api.post("/user/change-password", data);
