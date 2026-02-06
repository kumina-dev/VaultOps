import React from "react";
import { Text, View } from "react-native";

import { Card } from "../primitives/Card";
import { NeonButton } from "../primitives/NeonButton";
import { theme } from "../theme/theme";

type FatalDbErrorScreenProps = {
  error: Error;
  onRetry?: () => void;
};

export function FatalDbErrorScreen({
  error,
  onRetry,
}: FatalDbErrorScreenProps) {
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
      <Text
        style={{
          color: theme.colors.text,
          fontSize: 24,
          fontWeight: "700",
          marginBottom: theme.spacing(2),
        }}
      >
        Unable to Open Vault
      </Text>
      <Text
        style={{
          color: theme.colors.muted,
          textAlign: "center",
          marginBottom: theme.spacing(3),
        }}
      >
        VaultOps couldn’t start the secure database. Please try again or restart
        the app.
      </Text>
      <Card style={{ width: "100%", marginBottom: theme.spacing(3) }}>
        <Text style={{ color: theme.colors.text, fontWeight: "600" }}>
          Error details
        </Text>
        <Text
          style={{ color: theme.colors.muted, marginTop: theme.spacing(1) }}
        >
          {error.message}
        </Text>
      </Card>
      {onRetry ? <NeonButton label="Try Again" onPress={onRetry} /> : null}
    </View>
  );
}
