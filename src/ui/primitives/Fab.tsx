import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, type ViewStyle } from "react-native";

import { theme } from "../theme/theme";

type FabProps = {
  label?: string;
  style?: ViewStyle;
};

export function Fab({ label = "+", style }: FabProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push("/(modals)/quick-add")}
      style={({ pressed }) => [
        {
          position: "absolute",
          right: theme.spacing(2),
          bottom: theme.spacing(2),
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.neon,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: theme.colors.neon,
          shadowOpacity: 0.35,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Text style={{ color: theme.colors.text, fontSize: 24 }}>{label}</Text>
    </Pressable>
  );
}
