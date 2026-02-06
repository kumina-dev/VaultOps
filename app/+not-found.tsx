import { Link } from "expo-router";
import React from "react";
import { View, Text } from "react-native";

export default function NotFound() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 18, marginBottom: 12 }}>Not found</Text>
      <Link href="/(tabs)/inbox">Go to Inbox</Link>
    </View>
  );
}
