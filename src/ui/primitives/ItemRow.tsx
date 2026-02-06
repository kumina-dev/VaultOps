import React from "react";
import {
  Pressable,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
} from "react-native";

import { Chip } from "./Chip";
import { theme } from "../theme/theme";

type ItemRowProps = {
  title: string;
  typeLabel?: string;
  tags?: string[];
  area?: string;
  time?: string;
  style?: ViewStyle;
} & Pick<PressableProps, "onPress">;

export function ItemRow({
  title,
  typeLabel,
  tags,
  area,
  time,
  style,
  onPress,
}: ItemRowProps) {
  const chips = [area, ...(tags ?? [])].filter(Boolean) as string[];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing(1.5),
          padding: theme.spacing(1.5),
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.panel,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: "rgba(155, 92, 255, 0.16)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: theme.colors.text, fontSize: 12 }}>
          {typeLabel ?? ""}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          {title}
        </Text>
        {chips.length ? (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginTop: theme.spacing(0.75),
              gap: theme.spacing(0.75),
            }}
          >
            {chips.map((chip) => (
              <Chip key={chip} label={chip} />
            ))}
          </View>
        ) : null}
      </View>

      {time ? (
        <View
          style={{
            paddingHorizontal: theme.spacing(1),
            paddingVertical: theme.spacing(0.5),
            borderRadius: 999,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: "rgba(77, 225, 255, 0.12)",
          }}
        >
          <Text style={{ color: theme.colors.muted, fontSize: 12 }}>
            {time}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
