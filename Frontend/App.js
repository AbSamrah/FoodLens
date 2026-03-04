import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { AuthContext, AuthProvider } from "./src/context/AuthContext";

// Screens
import CameraScreen from "./src/screens/CameraScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

const Stack = createNativeStackNavigator();

// Stack for Unauthenticated users
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Stack for Authenticated users
const MainAppStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Camera"
      component={CameraScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="History"
      component={HistoryScreen}
      options={{ title: "My Food Log" }}
    />
    <Stack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ title: "Settings" }}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isLoading, userToken } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {userToken !== null ? <MainAppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
