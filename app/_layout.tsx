import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="(modals)/quick-add"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="(modals)/edit-item"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="(modals)/reminder-edit"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="(modals)/note-link-picker"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="(modals)/item-filters"
          options={{ presentation: "modal" }}
        />
      </Stack>
    </>
  );
}
