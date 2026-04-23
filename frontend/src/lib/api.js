import axios from "axios";
import { getToken } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function sendOtp(phone, purpose) {
  const { data } = await api.post("/auth/otp/send", { phone, purpose });
  return data;
}

export async function signup(payload) {
  const { data } = await api.post("/auth/signup", payload);
  return data;
}

export async function login(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function getMe() {
  const { data } = await api.get("/me");
  return data;
}

export async function updateMe(payload) {
  const { data } = await api.patch("/me", payload);
  return data;
}

export async function getQuizzes(params = {}) {
  const { data } = await api.get("/quizzes", { params });
  return data;
}

export async function createAttempt(payload) {
  const { data } = await api.post("/attempts", payload);
  return data;
}

export async function getAttempts() {
  const { data } = await api.get("/attempts");
  return data;
}

export async function getLeaderboard(params = {}) {
  const { data } = await api.get("/leaderboard", { params });
  return data;
}

export async function getWishlist() {
  const { data } = await api.get("/wishlist");
  return data;
}

export async function addWishlistItem(quizId) {
  const { data } = await api.post("/wishlist", { quiz_id: quizId });
  return data;
}

export async function removeWishlistItem(quizId) {
  await api.delete(`/wishlist/${quizId}`);
}

