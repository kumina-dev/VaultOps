import { Link, useRouter } from "expo-router";
import React from "react";
import { View, Text } from "react-native";

import { Card } from "../../../src/ui/primitives/Card";
import { NeonButton } from "../../../src/ui/primitives/NeonButton";
import { theme } from "../../../src/ui/theme/theme";

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bg,
        padding: theme.spacing(2),
      }}
    >
      <Text
        style={{ color: theme.colors.text, fontSize: 22, fontWeight: "700" }}
      >
        Profile
      </Text>

      <Card style={{ marginTop: theme.spacing(2) }}>
        <Text
          style={{ color: theme.colors.muted, marginBottom: theme.spacing(1) }}
        >
          Foundation is live. Next: wire DB + repositories + real list.
        </Text>

        <NeonButton
          label="Quick Add"
          onPress={() => router.push("/(modals)/quick-add")}
        />
        <View style={{ height: theme.spacing(1) }} />
        <Link
          href="/(tabs)/profile/security"
          style={{ color: theme.colors.neon, marginBottom: theme.spacing(1) }}
        >
          DB Status
        </Link>
        <Link
          href="/(tabs)/profile/reminders"
          style={{ color: theme.colors.neon, marginBottom: theme.spacing(1) }}
        >
          Reminders
        </Link>
        <Link
          href="/(tabs)/profile/exports"
          style={{ color: theme.colors.neon }}
        >
          Go to Exports
        </Link>
      </Card>
    </View>
  );
}
