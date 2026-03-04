import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getFoodHistory } from "../api/foodService";

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchHistory = async () => {
        setIsLoading(true);
        try {
          const data = await getFoodHistory();
          setHistory(data);
        } catch (error) {
          console.error("Failed to fetch history:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchHistory();
    }, [])
  );

  const renderFoodItem = (item) => (
    <View key={item.id} style={styles.itemRow}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemDetails}>{item.estimatedGrams}g</Text>
      <Text style={styles.itemDetails}>{item.calories} kcal</Text>
    </View>
  );

  const renderDailyLog = ({ item }) => {
    const dateObj = new Date(item.date);
    // always show English format regardless of device locale
    const dateString = dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{dateString}</Text>
          <Text style={styles.totalCaloriesText}>
            {item.totalDailyCalories} kcal
          </Text>
        </View>

        <View style={styles.divider} />

        {item.foodItems.map((food) => renderFoodItem(food))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderDailyLog}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No meals logged yet. Go scan some food!
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dateText: { fontSize: 18, fontWeight: "bold" },
  totalCaloriesText: { fontSize: 18, fontWeight: "bold", color: "#e74c3c" },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 8 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  itemName: { flex: 2, fontSize: 16, color: "#333" },
  itemDetails: { flex: 1, fontSize: 16, color: "#666", textAlign: "right" },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#7f8c8d",
  },
});
