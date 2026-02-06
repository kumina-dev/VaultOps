import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { createDbClient } from "../../src/core/data/db/DbClient";
import { ItemRepo } from "../../src/core/data/repos/ItemRepo";
import { ReminderRepo } from "../../src/core/data/repos/ReminderRepo";
import { useVault } from "../../src/core/services/security/VaultProvider";
import { Card } from "../../src/ui/primitives/Card";
import { NeonButton } from "../../src/ui/primitives/NeonButton";
import { NeonInput } from "../../src/ui/primitives/NeonInput";
import { theme } from "../../src/ui/theme/theme";

import type { ItemType } from "../../src/core/domain/item";

type QuickAddType = ItemType | "reminder";

const TYPE_OPTIONS: Array<{ value: QuickAddType; label: string }> = [
  { value: "note", label: "Note" },
  { value: "task", label: "Task" },
  { value: "event", label: "Event" },
  { value: "reminder", label: "Reminder" },
];

const createId = (prefix: string) => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export default function QuickAddModal() {
  const router = useRouter();
  const { db } = useVault();
  const client = useMemo(() => (db ? createDbClient(db) : null), [db]);
  const [type, setType] = useState<QuickAddType>("note");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [eventStartAt, setEventStartAt] = useState("");
  const [eventEndAt, setEventEndAt] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [reminderFireAt, setReminderFireAt] = useState("");
  const [reminderRepeatRule, setReminderRepeatRule] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!client) return;
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const id = createId(type);
      const now = new Date().toISOString();

      if (type === "reminder") {
        const reminderRepo = new ReminderRepo(client);
        await reminderRepo.createReminder({
          id,
          title: title.trim(),
          fireAt: reminderFireAt.trim() || now,
          repeatRule: reminderRepeatRule.trim() || null,
          status: "scheduled",
        });
        router.replace(`/(modals)/reminder-edit?id=${id}`);
        return;
      }

      const itemRepo = new ItemRepo(client);

      if (type === "note") {
        await itemRepo.createItem({
          id,
          type,
          title: title.trim(),
          body: body.trim() || null,
        });
        router.replace(`/(tabs)/notes/${id}`);
        return;
      }

      if (type === "task") {
        await itemRepo.createItem({
          id,
          type,
          title: title.trim(),
          body: body.trim() || null,
          taskStatus: "todo",
          taskPriority: "med",
          taskDueAt: taskDueAt.trim() || null,
        });
        router.replace(`/(tabs)/tasks/${id}`);
        return;
      }

      await itemRepo.createItem({
        id,
        type,
        title: title.trim(),
        body: body.trim() || null,
        eventStartAt: eventStartAt.trim() || now,
        eventEndAt: eventEndAt.trim() || now,
        eventLocation: eventLocation.trim() || null,
      });
      router.replace(`/(tabs)/calendar/${(eventStartAt || now).slice(0, 10)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Create failed.";
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
        Quick Add
      </Text>

      <ScrollView
        style={{ marginTop: theme.spacing(2) }}
        contentContainerStyle={{ paddingBottom: theme.spacing(3) }}
      >
        <Card>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {TYPE_OPTIONS.map((option) => {
              const selected = option.value === type;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setType(option.value)}
                  style={[
                    {
                      borderRadius: theme.radius.md,
                      borderWidth: 1,
                      borderColor: selected
                        ? theme.colors.neon
                        : theme.colors.border,
                      paddingVertical: theme.spacing(0.75),
                      paddingHorizontal: theme.spacing(1.5),
                      backgroundColor: selected
                        ? "rgba(155, 92, 255, 0.2)"
                        : "transparent",
                    },
                  ]}
                >
                  <Text style={{ color: theme.colors.text, fontWeight: "600" }}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ height: theme.spacing(2) }} />

          <NeonInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title..."
          />

          {(type === "note" || type === "task" || type === "event") && (
            <>
              <View style={{ height: theme.spacing(1.5) }} />
              <NeonInput
                value={body}
                onChangeText={setBody}
                placeholder="Details..."
                multiline
                style={{ minHeight: 90, textAlignVertical: "top" }}
              />
            </>
          )}

          {type === "task" && (
            <>
              <View style={{ height: theme.spacing(1.5) }} />
              <NeonInput
                value={taskDueAt}
                onChangeText={setTaskDueAt}
                placeholder="Due date (YYYY-MM-DD or ISO)"
              />
            </>
          )}

          {type === "event" && (
            <>
              <View style={{ height: theme.spacing(1.5) }} />
              <NeonInput
                value={eventStartAt}
                onChangeText={setEventStartAt}
                placeholder="Start (ISO date/time)"
              />
              <View style={{ height: theme.spacing(1.5) }} />
              <NeonInput
                value={eventEndAt}
                onChangeText={setEventEndAt}
                placeholder="End (ISO date/time)"
              />
              <View style={{ height: theme.spacing(1.5) }} />
              <NeonInput
                value={eventLocation}
                onChangeText={setEventLocation}
                placeholder="Location"
              />
            </>
          )}

          {type === "reminder" && (
            <>
              <View style={{ height: theme.spacing(1.5) }} />
              <NeonInput
                value={reminderFireAt}
                onChangeText={setReminderFireAt}
                placeholder="Fire at (ISO date/time)"
              />
              <View style={{ height: theme.spacing(1.5) }} />
              <NeonInput
                value={reminderRepeatRule}
                onChangeText={setReminderRepeatRule}
                placeholder="Repeat rule (optional)"
              />
            </>
          )}

          {error && (
            <>
              <View style={{ height: theme.spacing(1.5) }} />
              <Text style={{ color: theme.colors.danger }}>{error}</Text>
            </>
          )}

          <View style={{ height: theme.spacing(2) }} />
          <NeonButton
            label={saving ? "Creating..." : "Create"}
            onPress={handleCreate}
          />
          <View style={{ height: theme.spacing(1) }} />
          <NeonButton label="Close" onPress={() => router.back()} />
        </Card>
      </ScrollView>
    </View>
  );
}
