import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { createDbClient } from "../../src/core/data/db/DbClient";
import { ReminderRepo } from "../../src/core/data/repos/ReminderRepo";
import { useVault } from "../../src/core/services/security/VaultProvider";
import { Card } from "../../src/ui/primitives/Card";
import { NeonButton } from "../../src/ui/primitives/NeonButton";
import { NeonInput } from "../../src/ui/primitives/NeonInput";
import { theme } from "../../src/ui/theme/theme";

import type { ReminderStatus } from "../../src/core/domain/reminder";

const STATUS_OPTIONS: ReminderStatus[] = [
  "scheduled",
  "fired",
  "snoozed",
  "cancelled",
];

export default function ReminderEditModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { db } = useVault();
  const client = useMemo(() => (db ? createDbClient(db) : null), [db]);
  const [title, setTitle] = useState("");
  const [fireAt, setFireAt] = useState("");
  const [repeatRule, setRepeatRule] = useState("");
  const [status, setStatus] = useState<ReminderStatus>("scheduled");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!client || !id) return;
    let mounted = true;

    const load = async () => {
      try {
        const repo = new ReminderRepo(client);
        const reminder = await repo.getReminder(id);
        if (!mounted) return;
        if (!reminder) {
          setError("Reminder not found.");
          return;
        }
        setTitle(reminder.title);
        setFireAt(reminder.fireAt);
        setRepeatRule(reminder.repeatRule ?? "");
        setStatus(reminder.status);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Load failed.";
        setError(message);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [client, id]);

  const handleSave = async () => {
    if (!client || !id) return;
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const repo = new ReminderRepo(client);
      await repo.updateReminder(id, {
        title: title.trim(),
        fireAt: fireAt.trim() || new Date().toISOString(),
        repeatRule: repeatRule.trim() || null,
        status,
      });
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

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
        Edit Reminder
      </Text>

      <ScrollView
        style={{ marginTop: theme.spacing(2) }}
        contentContainerStyle={{ paddingBottom: theme.spacing(3) }}
      >
        <Card>
          {!id && (
            <Text style={{ color: theme.colors.danger }}>
              Missing reminder id.
            </Text>
          )}

          <NeonInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title..."
          />
          <View style={{ height: theme.spacing(1.5) }} />
          <NeonInput
            value={fireAt}
            onChangeText={setFireAt}
            placeholder="Fire at (ISO date/time)"
          />
          <View style={{ height: theme.spacing(1.5) }} />
          <NeonInput
            value={repeatRule}
            onChangeText={setRepeatRule}
            placeholder="Repeat rule (optional)"
          />
          <View style={{ height: theme.spacing(1.5) }} />
          <Text
            style={{
              color: theme.colors.muted,
              marginBottom: theme.spacing(1),
            }}
          >
            Status
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {STATUS_OPTIONS.map((option) => {
              const selected = option === status;
              return (
                <Pressable
                  key={option}
                  onPress={() => setStatus(option)}
                  style={{
                    borderRadius: theme.radius.md,
                    borderWidth: 1,
                    borderColor: selected
                      ? theme.colors.neon
                      : theme.colors.border,
                    paddingVertical: theme.spacing(0.6),
                    paddingHorizontal: theme.spacing(1.25),
                    backgroundColor: selected
                      ? "rgba(155, 92, 255, 0.2)"
                      : "transparent",
                  }}
                >
                  <Text style={{ color: theme.colors.text }}>{option}</Text>
                </Pressable>
              );
            })}
          </View>

          {error && (
            <>
              <View style={{ height: theme.spacing(1.5) }} />
              <Text style={{ color: theme.colors.danger }}>{error}</Text>
            </>
          )}

          <View style={{ height: theme.spacing(2) }} />
          <NeonButton
            label={saving ? "Saving..." : "Save"}
            onPress={handleSave}
          />
          <View style={{ height: theme.spacing(1) }} />
          <NeonButton label="Close" onPress={() => router.back()} />
        </Card>
      </ScrollView>
    </View>
  );
}
