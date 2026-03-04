import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { analyzeFoodImage } from "../api/foodService";

const App = () => {
  const [loading, setLoading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [libraryPermission, setLibraryPermission] = useState(null);
  const [lastLog, setLastLog] = useState(null);
  const cameraRef = useRef(null);

  // request permissions when component mounts
  React.useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(cameraStatus.status === "granted");

      const libStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setLibraryPermission(libStatus.status === "granted");
    })();
  }, []);

  // common analysis helper
  const analyzeUri = async (uri) => {
    try {
      setLoading(true);
      const result = await analyzeFoodImage(uri);
      console.log("AI Pipeline Result:", result);

      // Normalize and handle either legacy or new daily-log response shape
      // New shape example: { id, date, totalDailyCalories, foodItems: [...] }
      if (result && result.foodItems && Array.isArray(result.foodItems)) {
        setLastLog(result);
        const total = result.totalDailyCalories ?? result.totalCalories ?? 0;
        Alert.alert(
          "Analysis Saved",
          `Total Calories: ${Math.round(total)} kcal`
        );
      } else if (result && Array.isArray(result)) {
        // if server returns an array (unlikely here), pick first
        const first = result[0];
        setLastLog(first);
        const total = first?.totalDailyCalories ?? first?.totalCalories ?? 0;
        Alert.alert(
          "Analysis Saved",
          `Total Calories: ${Math.round(total)} kcal`
        );
      } else {
        // fallback to legacy shape
        const total = result?.totalCalories ?? 0;
        Alert.alert("Success", `Total Calories: ${Math.round(total)} kcal`);
      }
    } catch (error) {
      console.error("Analysis Error:", error);
      Alert.alert(
        "Analysis Failed",
        "Ensure your backend is reachable and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      setLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7, // Reduced for faster AI processing
        base64: false,
      });

      console.log("Captured URI:", photo.uri);
      await analyzeUri(photo.uri);
    } catch (error) {
      console.error("Capture/Analysis Error:", error);
      Alert.alert("Capture Failed", "Could not take picture.");
      setLoading(false);
    }
  };

  const pickImage = async () => {
    if (!libraryPermission) {
      Alert.alert(
        "Permission required",
        "App needs access to your photo library to choose an image."
      );
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        base64: false,
      });
      if (!result.canceled && result.assets.length > 0) {
        console.log("Picked URI:", result.assets[0].uri);
        await analyzeUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Library pick error", error);
    }
  };

  if (cameraPermission === false) {
    return (
      <View style={styles.center}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Standalone CameraView - No nested children to avoid warnings */}
      <CameraView style={styles.camera} ref={cameraRef} />

      {/* UI Overlay */}
      <View style={styles.overlay}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#00ff00" />
            <Text style={styles.loadingText}>AI Dissecting Plate...</Text>
          </View>
        ) : (
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}>
              <View style={styles.innerCircle} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickButton} onPress={pickImage}>
              <Text style={styles.pickText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {lastLog && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultDate}>
              {new Date(lastLog.date).toLocaleString()}
            </Text>
            <Text style={styles.resultTotal}>
              {Math.round(lastLog.totalDailyCalories)} kcal
            </Text>
          </View>
          <View style={styles.resultDivider} />
          <ScrollView style={styles.itemsList}>
            {lastLog.foodItems.map((f) => (
              <View key={f.id} style={styles.resultItemRow}>
                <Text style={styles.resultItemName}>{f.name}</Text>
                <Text style={styles.resultItemDetails}>
                  {f.estimatedGrams} g
                </Text>
                <Text style={styles.resultItemDetails}>
                  {Math.round(f.calories)} kcal
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  loadingBox: {
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontWeight: "bold",
  },
  buttonsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#ffffff88",
    borderRadius: 8,
  },
  pickText: {
    color: "#000",
    fontWeight: "bold",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resultCard: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 40,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    maxHeight: 220,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultDate: { fontSize: 14, color: "#333" },
  resultTotal: { fontSize: 16, fontWeight: "700", color: "#e74c3c" },
  resultDivider: { height: 1, backgroundColor: "#eee", marginVertical: 8 },
  itemsList: { maxHeight: 160 },
  resultItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  resultItemName: { flex: 2, fontSize: 14, color: "#222" },
  resultItemDetails: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    textAlign: "right",
  },
});

export default App;
