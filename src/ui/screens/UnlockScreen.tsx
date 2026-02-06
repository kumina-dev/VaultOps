import React, { useState } from "react";
import { Text, View } from "react-native";

import { NeonButton } from "../primitives/NeonButton";
import { theme } from "../theme/theme";

type UnlockScreenProps = {
  onUnlock: () => Promise<boolean>;
};

export function UnlockScreen({ onUnlock }: UnlockScreenProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUnlock = async () => {
    setIsUnlocking(true);
    setErrorMessage(null);
    const success = await onUnlock();
    if (!success) setErrorMessage("Unlock failed. Please try again.");
    setIsUnlocking(false);
  };

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
        Vault Locked
      </Text>
      <Text
        style={{
          color: theme.colors.muted,
          textAlign: "center",
          marginBottom: theme.spacing(3),
        }}
      >
        Unlock to continue.
      </Text>
      {errorMessage ? (
        <Text
          style={{ color: theme.colors.neon, marginBottom: theme.spacing(2) }}
        >
          {errorMessage}
        </Text>
      ) : null}
      <NeonButton
        label={isUnlocking ? "Unlocking..." : "Unlock"}
        onPress={handleUnlock}
        disabled={isUnlocking}
      />
    </View>
  );
}
