import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin-token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const login = (data) => API.post("/auth/login", data);

export const getProjects = () => API.get("/projects");
export const getSkills = () => API.get("/skills");
export const getProfile = () => API.get("/profile");
export const getCompliments = () => API.get("/compliments");

export const sendMessage = (data) =>
  API.post("/messages", data);

export default API;