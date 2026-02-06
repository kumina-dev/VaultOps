import { useRouter } from "expo-router";
import React, { useState } from "react";
import { View, Text } from "react-native";

import { Card } from "../../src/ui/primitives/Card";
import { NeonButton } from "../../src/ui/primitives/NeonButton";
import { NeonInput } from "../../src/ui/primitives/NeonInput";
import { theme } from "../../src/ui/theme/theme";

export default function QuickAddModal() {
  const router = useRouter();
  const [title, setTitle] = useState("");

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bg,
        padding: theme.spacing(2),
      }}
    >
      <Text
        style={{ color: theme.colors.text, fontSize: 18, fontWeight: "700" }}
      >
        Quick Add
      </Text>

      <Card style={{ marginTop: theme.spacing(2) }}>
        <NeonInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title..."
        />
        <View style={{ height: theme.spacing(1.5) }} />
        <NeonButton label="Close" onPress={() => router.back()} />
      </Card>
    </View>
  );
}
