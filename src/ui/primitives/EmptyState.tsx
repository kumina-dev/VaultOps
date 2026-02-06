import React from "react";
import { Text, View, type ViewStyle } from "react-native";

import { theme } from "../theme/theme";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
};

export function EmptyState({
  title,
  description,
  action,
  style,
}: EmptyStateProps) {
  return (
    <View
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          padding: theme.spacing(3),
        },
        style,
      ]}
    >
      <Text
        style={{
          color: theme.colors.text,
          fontSize: 18,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={{
            color: theme.colors.muted,
            marginTop: theme.spacing(1),
            textAlign: "center",
          }}
        >
          {description}
        </Text>
      ) : null}
      {action ? (
        <View style={{ marginTop: theme.spacing(2) }}>{action}</View>
      ) : null}
    </View>
  );
}
