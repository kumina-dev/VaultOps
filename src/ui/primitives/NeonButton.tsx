import React from "react";
import { Pressable, Text, type ViewStyle } from "react-native";

import { theme } from "../theme/theme";

export function NeonButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          paddingVertical: theme.spacing(1.25),
          paddingHorizontal: theme.spacing(2),
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: "rgba(155, 92, 255, 0.5)",
          backgroundColor: "rgba(155, 92, 255, 0.15)",
        },
        style,
      ]}
    >
      <Text
        style={{
          color: theme.colors.text,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
