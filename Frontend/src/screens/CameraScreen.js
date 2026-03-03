import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { analyzeFoodImage } from "../api/foodService";

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const cameraRef = useRef(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center", marginBottom: 20 }}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePictureAndAnalyze = async () => {
    if (cameraRef.current) {
      try {
        setIsAnalyzing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        const data = await analyzeFoodImage(photo.uri);
        setResult(data);
      } catch (error) {
        console.error("Analysis failed:", error);
        Alert.alert("Error", "Failed to analyze image.");
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const pickImageAndAnalyze = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photos to upload an image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      try {
        setIsAnalyzing(true);
        const imageUri = result.assets[0].uri;
        const data = await analyzeFoodImage(imageUri);
        setResult(data);
      } catch (error) {
        console.error("Analysis failed:", error);
        Alert.alert("Error", "Failed to analyze uploaded image.");
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      {isAnalyzing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff00" />
          <Text style={styles.loadingText}>Running AI Pipeline...</Text>
        </View>
      ) : result ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>
            Total Calories: {result.totalDailyCalories}
          </Text>
          <TouchableOpacity
            onPress={() => setResult(null)}
            style={[styles.button, { marginTop: 20 }]}>
            <Text style={styles.buttonText}>Scan Another</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <CameraView style={styles.camera} facing="back" ref={cameraRef}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={[
                styles.navButton,
                { marginRight: 10, backgroundColor: "rgba(44, 62, 80, 0.8)" },
              ]}
              onPress={() => navigation.navigate("Profile")}>
              <Text style={styles.buttonText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigation.navigate("History")}>
              <Text style={styles.buttonText}>History</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickImageAndAnalyze}>
              <Text style={styles.buttonText}>Upload</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePictureAndAnalyze}>
              <Text style={styles.buttonText}>Capture</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center" },
  camera: { flex: 1, justifyContent: "space-between" },

  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 20,
    marginTop: 40,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingBottom: 40,
    paddingHorizontal: 20,
  },

  navButton: {
    backgroundColor: "rgba(52, 152, 219, 0.8)",
    padding: 10,
    borderRadius: 8,
  },
  captureButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 5,
  },
  uploadButton: {
    backgroundColor: "#2c3e50",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 5,
  },
  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 10,
    alignSelf: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 20, fontSize: 18, fontWeight: "bold" },
  resultContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  resultText: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
});
