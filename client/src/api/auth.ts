import api from "./axios";

export const checkEmail = async (email: string) => {
  const response = await api.post("/auth/check-email", { email });
  return response.data;
};

export const register = async (data: any) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const login = async (credential: any) => {
  const response = await api.post("/auth/login", credential);
  return response.data;
};

export const forgotPassword = async (email: string) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const activate = async (data: any, token: any) => {
  const response = await api.post(`/auth/activate/${token}`, data);
  return response.data;
};

export const resetPassword = async (data: any, token: any) => {
  const response = await api.post(`/auth/reset-password/${token}`, data);
  return response.data;
};
