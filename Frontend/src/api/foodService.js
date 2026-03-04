import apiClient from "./apiClient";
import { Platform } from "react-native";

export const analyzeFoodImage = async (photoUri) => {
  const formData = new FormData();
  const filename = photoUri.split("/").pop() || "photo.jpg";

  if (Platform.OS === "web") {
    const response = await fetch(photoUri);
    const blob = await response.blob();
    formData.append("image", blob, filename);
  } else {
    formData.append("image", {
      uri: photoUri,
      name: filename,
      type: "image/jpeg",
    });
  }

  const response = await apiClient.post("/food/analyze", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getFoodHistory = async () => {
  const response = await apiClient.get("/food/history");
  return response.data;
};
