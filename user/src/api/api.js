import axios from 'axios';

// Environment variable from .env
const BASE = import.meta.env.VITE_API_URL;

// Create Axios instance
const API = axios.create({
  baseURL: BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Profile
export const getProfile = () => API.get('/profile');

// Projects
export const getProjects = () => API.get('/projects');

// Compliments
export const getCompliments = () => API.get('/compliments');
export const sendCompliment = (data) => API.post('/compliments', data);

// Messages
export const sendMessage = (data) => API.post('/messages', data);

// Optional default export
export default API;