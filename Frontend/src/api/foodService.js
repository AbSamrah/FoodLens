import apiClient from "./apiClient";
import { Platform } from "react-native";

export const analyzeFoodImage = async (photoUri) => {
  const formData = new FormData();
  const rawName = (photoUri || "").split("/").pop() || "photo.jpg";
  const filename = rawName.split("?")[0];

  const guessType = (name) => {
    const n = (name || "").toLowerCase();
    if (n.endsWith(".png")) return "image/png";
    if (n.endsWith(".webp")) return "image/webp";
    return "image/jpeg";
  };

  if (Platform.OS === "web") {
    const response = await fetch(photoUri);
    const blob = await response.blob();
    formData.append("image", blob, filename);
  } else {
    // On native (Android/iOS) the URI may be a content:// or file:// URI returned by document picker.
    // Fetch the URI and append a blob if it's a content URI to ensure the multipart upload works.
    try {
      if (photoUri && photoUri.startsWith("content://")) {
        // content URIs (Android) may require fetching as blob
        const fetched = await fetch(photoUri);
        const blob = await fetched.blob();
        formData.append("image", blob, filename);
      } else {
        // file:// URIs (local cache) and other URIs work when passed as form field
        formData.append("image", {
          uri: photoUri,
          name: filename,
          type: guessType(filename),
        });
      }
    } catch (err) {
      // Fallback to sending the raw uri object — some environments handle this directly
      formData.append("image", {
        uri: photoUri,
        name: filename,
        type: guessType(filename),
      });
    }
  }

  try {
    const response = await apiClient.post("/food/analyze", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (err) {
    // If server responded with error details, include them in the thrown error
    if (err.response && err.response.data) {
      const serverMsg =
        typeof err.response.data === "string"
          ? err.response.data
          : JSON.stringify(err.response.data);
      const e = new Error(`Server error: ${serverMsg}`);
      e.original = err;
      throw e;
    }
    throw err;
  }
};

export const getFoodHistory = async () => {
  const response = await apiClient.get("/food/history");
  return response.data;
};
