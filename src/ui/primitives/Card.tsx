import React from "react";
import { View, type ViewProps } from "react-native";

import { theme } from "../theme/theme";

export function Card({ style, ...props }: ViewProps) {
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: theme.colors.panel,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.md,
          padding: theme.spacing(2),
        },
        style,
      ]}
    />
  );
}
