import apiClient from "./apiClient";

export const analyzeFoodImage = async (photoUri) => {
  const formData = new FormData();

  const filename = photoUri.split("/").pop();

  formData.append("image", {
    uri: photoUri,
    name: filename,
    type: "image/jpeg",
  });

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
