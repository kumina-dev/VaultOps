import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

import {
  VaultProvider,
  useVault,
} from "../src/core/services/security/VaultProvider";
import { AppErrorBoundary } from "../src/ui/primitives/AppErrorBoundary";
import { FatalDbErrorScreen } from "../src/ui/screens/FatalDbErrorScreen";
import { LoadingScreen } from "../src/ui/screens/LoadingScreen";
import { UnlockScreen } from "../src/ui/screens/UnlockScreen";

function AppNavigator() {
  const { db, locked, error, unlock } = useVault();

  if (error) return <FatalDbErrorScreen error={error} />;
  if (!db) return <LoadingScreen />;
  if (locked) return <UnlockScreen onUnlock={unlock} />;

  return (
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
  );
}

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <VaultProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </VaultProvider>
    </AppErrorBoundary>
  );
}
