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

  // Format a date string using device local timezone & locale.
  // Handles Date objects, numeric epochs (seconds or ms), .NET "/Date(...)\/" and ISO strings
  // that may be missing a timezone (assume UTC in that case).
  const formatToLocal = (dateStr, options) => {
    if (dateStr == null || dateStr === "") return "";

    // Already a Date
    if (dateStr instanceof Date)
      return dateStr.toLocaleString("en-US", options);

    // Numeric epoch (seconds or milliseconds)
    if (typeof dateStr === "number" || /^-?\d+$/.test(String(dateStr))) {
      const num = Number(dateStr);
      // If value looks like seconds (<= 10 digits) convert to ms
      const ms = Math.abs(num) <= 9999999999 ? num * 1000 : num;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d.toLocaleString("en-US", options);
    }

    let s = String(dateStr);

    // Handle .NET JSON format with optional offset: /Date(123456789+0000)/
    const msMatch = /\/Date\((-?\d+)(?:[+-]\d+)?\)\//.exec(s);
    if (msMatch) {
      const d = new Date(parseInt(msMatch[1], 10));
      if (!isNaN(d.getTime())) return d.toLocaleString("en-US", options);
    }

    // If ISO string missing timezone (e.g. "2026-03-04T12:34:56"),
    // treat it as UTC by appending 'Z' so Date parses it as UTC.
    const isoNoTZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
    if (isoNoTZ.test(s)) s = s + "Z";

    const d = new Date(s);
    if (isNaN(d.getTime())) {
      // fallback: return original string
      return s;
    }

    return d.toLocaleString("en-US", options);
  };

  const renderDailyLog = ({ item }) => {
    // show date/time using the device's local timezone/locale
    const dateString = formatToLocal(item.date, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
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
