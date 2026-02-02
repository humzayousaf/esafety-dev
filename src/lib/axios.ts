import axios from "axios";

export const api = axios.create({
  baseURL: "https://dev.mepco.myflexihr.com", // your production API base URL
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // 👈 allows sending cookies with requests
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Optional: add auth token or CSRF handling if needed later
