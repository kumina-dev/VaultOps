import React from "react";
import { View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../theme/theme";

type ScreenLayoutProps = {
  children: React.ReactNode;
  header?: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

export function ScreenLayout({
  children,
  header,
  style,
  contentStyle,
}: ScreenLayoutProps) {
  return (
    <SafeAreaView
      style={[
        {
          flex: 1,
          backgroundColor: theme.colors.bg,
        },
        style,
      ]}
    >
      <View
        style={[
          {
            flex: 1,
            padding: theme.spacing(2),
          },
          contentStyle,
        ]}
      >
        {header ? (
          <View style={{ marginBottom: theme.spacing(2) }}>{header}</View>
        ) : null}
        {children}
      </View>
    </SafeAreaView>
  );
}
