import React from "react";
import { TextInput, type TextInputProps } from "react-native";

import { theme } from "../theme/theme";

export function NeonInput(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={theme.colors.muted}
      {...props}
      style={[
        {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing(2),
          paddingVertical: theme.spacing(1.25),
          color: theme.colors.text,
          backgroundColor: "rgba(13, 16, 32, 0.9)",
        },
        props.style,
      ]}
    />
  );
}
