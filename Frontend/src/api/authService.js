import axios from "axios";

const BASE_URL = "http://calories-foodai.somee.com/api/auth";

export const loginUser = async (email, password) => {
  const response = await axios.post(`${BASE_URL}/login`, { email, password });
  return response.data;
};

export const registerUser = async (email, password) => {
  const response = await axios.post(`${BASE_URL}/register`, {
    email,
    password,
  });
  return response.data;
};
