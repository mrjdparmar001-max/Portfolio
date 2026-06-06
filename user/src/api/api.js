import axios from "axios";

// Axios Instance
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ==========================
   PROFILE
========================== */
export const getProfile = () => API.get("/profile");

/* ==========================
   PROJECTS
========================== */
export const getProjects = () => API.get("/projects");

/* ==========================
   SKILLS
========================== */
export const getSkills = () => API.get("/skills");

/* ==========================
   COMPLIMENTS
========================== */
export const getCompliments = () => API.get("/compliments");

export const sendCompliment = (data) =>
  API.post("/compliments", data);

/* ==========================
   MESSAGES
========================== */
export const sendMessage = (data) =>
  API.post("/messages", data);

/* ==========================
   EXPORT
========================== */
export default API;