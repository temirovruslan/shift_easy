import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Expo inlines EXPO_PUBLIC_* at build time. The production URL stays as the
// fallback so an unset variable behaves exactly as before, while a build
// against staging or a laptop no longer needs a source edit and a release.
const api = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_API_URL ?? "https://shift-easy-api.onrender.com/api",
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
