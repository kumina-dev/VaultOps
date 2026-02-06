import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { createDbClient } from "../../src/core/data/db/DbClient";
import { ItemRepo } from "../../src/core/data/repos/ItemRepo";
import { useVault } from "../../src/core/services/security/VaultProvider";
import { Card } from "../../src/ui/primitives/Card";
import { NeonButton } from "../../src/ui/primitives/NeonButton";
import { NeonInput } from "../../src/ui/primitives/NeonInput";
import { theme } from "../../src/ui/theme/theme";

import type {
  Item,
  TaskPriority,
  TaskStatus,
} from "../../src/core/domain/item";

const STATUS_OPTIONS: TaskStatus[] = ["todo", "doing", "done", "blocked"];
const PRIORITY_OPTIONS: TaskPriority[] = ["low", "med", "high"];

export default function EditItemModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { db } = useVault();
  const client = useMemo(() => (db ? createDbClient(db) : null), [db]);
  const [item, setItem] = useState<Item | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("todo");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("med");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [eventStartAt, setEventStartAt] = useState("");
  const [eventEndAt, setEventEndAt] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!client || !id) return;
    let mounted = true;

    const load = async () => {
      try {
        const repo = new ItemRepo(client);
        const fetched = await repo.getItem(id);
        if (!mounted) return;
        if (!fetched) {
          setError("Item not found.");
          return;
        }
        setItem(fetched);
        setTitle(fetched.title);
        setBody(fetched.body ?? "");
        if (fetched.type === "task") {
          setTaskStatus(fetched.status);
          setTaskPriority(fetched.priority);
          setTaskDueAt(fetched.dueAt ?? "");
        }
        if (fetched.type === "event") {
          setEventStartAt(fetched.startAt ?? "");
          setEventEndAt(fetched.endAt ?? "");
          setEventLocation(fetched.location ?? "");
        }
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
    if (!client || !id || !item) return;
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const repo = new ItemRepo(client);
      if (item.type === "note") {
        await repo.updateItem(id, {
          title: title.trim(),
          body: body.trim() || null,
        });
      }
      if (item.type === "task") {
        await repo.updateItem(id, {
          title: title.trim(),
          body: body.trim() || null,
          taskStatus,
          taskPriority,
          taskDueAt: taskDueAt.trim() || null,
        });
      }
      if (item.type === "event") {
        await repo.updateItem(id, {
          title: title.trim(),
          body: body.trim() || null,
          eventStartAt: eventStartAt.trim() || null,
          eventEndAt: eventEndAt.trim() || null,
          eventLocation: eventLocation.trim() || null,
        });
      }
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
        Edit Item
      </Text>

      <ScrollView
        style={{ marginTop: theme.spacing(2) }}
        contentContainerStyle={{ paddingBottom: theme.spacing(3) }}
      >
        <Card>
          {!id && (
            <Text style={{ color: theme.colors.danger }}>Missing item id.</Text>
          )}

          {id && !item && !error && (
            <Text style={{ color: theme.colors.muted }}>Loading...</Text>
          )}

          {item && (
            <>
              <NeonInput
                value={title}
                onChangeText={setTitle}
                placeholder="Title..."
              />
              <View style={{ height: theme.spacing(1.5) }} />
              <NeonInput
                value={body}
                onChangeText={setBody}
                placeholder="Details..."
                multiline
                style={{ minHeight: 90, textAlignVertical: "top" }}
              />

              {item.type === "task" && (
                <>
                  <View style={{ height: theme.spacing(1.5) }} />
                  <Text
                    style={{
                      color: theme.colors.muted,
                      marginBottom: theme.spacing(1),
                    }}
                  >
                    Status
                  </Text>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    {STATUS_OPTIONS.map((option) => {
                      const selected = option === taskStatus;
                      return (
                        <Pressable
                          key={option}
                          onPress={() => setTaskStatus(option)}
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
                          <Text style={{ color: theme.colors.text }}>
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={{ height: theme.spacing(1.5) }} />
                  <Text
                    style={{
                      color: theme.colors.muted,
                      marginBottom: theme.spacing(1),
                    }}
                  >
                    Priority
                  </Text>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    {PRIORITY_OPTIONS.map((option) => {
                      const selected = option === taskPriority;
                      return (
                        <Pressable
                          key={option}
                          onPress={() => setTaskPriority(option)}
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
                          <Text style={{ color: theme.colors.text }}>
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={{ height: theme.spacing(1.5) }} />
                  <NeonInput
                    value={taskDueAt}
                    onChangeText={setTaskDueAt}
                    placeholder="Due date (YYYY-MM-DD or ISO)"
                  />
                </>
              )}

              {item.type === "event" && (
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
