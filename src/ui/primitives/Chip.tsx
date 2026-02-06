import React from "react";
import { Pressable, Text, type ViewStyle } from "react-native";

import { theme } from "../theme/theme";

export function Chip({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          paddingHorizontal: theme.spacing(1.5),
          paddingVertical: theme.spacing(0.75),
          borderRadius: 999,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: "rgba(155, 92, 255, 0.08)",
        },
        style,
      ]}
    >
      <Text style={{ color: theme.colors.text, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}
