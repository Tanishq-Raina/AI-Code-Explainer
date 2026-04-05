import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const submitCode = async (payload) => {
  const response = await API.post("/submit-code", payload);
  return response.data;
};

export const checkHealth = async () => {
  const response = await API.get("/health");
  return response.data;
};
