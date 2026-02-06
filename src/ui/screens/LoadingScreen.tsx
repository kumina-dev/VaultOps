import React from "react";
import { Text, View } from "react-native";

import { theme } from "../theme/theme";

export function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bg,
        padding: theme.spacing(3),
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: theme.colors.muted, fontSize: 16 }}>
        Preparing your vault...
      </Text>
    </View>
  );
}
