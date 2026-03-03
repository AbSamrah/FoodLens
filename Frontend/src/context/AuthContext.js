import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useEffect, useState } from "react";
import { loginUser, registerUser } from "../api/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        setUserToken(token);
      } catch (e) {
        console.error("Failed to load token", e);
      }
      setIsLoading(false);
    };
    loadToken();
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    if (data.token) {
      setUserToken(data.token);
      await AsyncStorage.setItem("userToken", data.token);
    }
  };

  const register = async (email, password) => {
    const data = await registerUser(email, password);
    if (data.token) {
      setUserToken(data.token);
      await AsyncStorage.setItem("userToken", data.token);
    }
  };

  const logout = async () => {
    setUserToken(null);
    await AsyncStorage.removeItem("userToken");
  };

  return (
    <AuthContext.Provider
      value={{ login, register, logout, userToken, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
