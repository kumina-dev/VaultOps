import { Link, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { createDbClient } from "../../../src/core/data/db/DbClient";
import { ReminderRepo } from "../../../src/core/data/repos/ReminderRepo";
import { useVault } from "../../../src/core/services/security/VaultProvider";
import { Card } from "../../../src/ui/primitives/Card";
import { NeonButton } from "../../../src/ui/primitives/NeonButton";
import { theme } from "../../../src/ui/theme/theme";

import type { Reminder } from "../../../src/core/domain/reminder";

const formatMetaValue = (value: string | null) =>
  value && value.trim().length > 0 ? value : "—";

const getReminderTime = (reminder: Reminder) =>
  reminder.status === "snoozed"
    ? (reminder.snoozeUntil ?? reminder.fireAt)
    : reminder.fireAt;

export default function RemindersScreen() {
  const router = useRouter();
  const { db } = useVault();
  const client = useMemo(() => (db ? createDbClient(db) : null), [db]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;
    let mounted = true;
    setLoading(true);
    setErrorMessage(null);

    const load = async () => {
      try {
        const repo = new ReminderRepo(client);
        const upcoming = await repo.listUpcoming(50);
        if (!mounted) return;
        setReminders(upcoming);
      } catch (error) {
        if (!mounted) return;
        const message =
          error instanceof Error ? error.message : "Unable to load reminders.";
        setErrorMessage(message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [client]);

  const { upcomingReminders, snoozedReminders } = useMemo(() => {
    const upcomingList = reminders.filter(
      (reminder) => reminder.status === "scheduled",
    );
    const snoozedList = reminders.filter(
      (reminder) => reminder.status === "snoozed",
    );
    return { upcomingReminders: upcomingList, snoozedReminders: snoozedList };
  }, [reminders]);

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: theme.colors.bg,
        padding: theme.spacing(2),
      }}
    >
      <Text
        style={{ color: theme.colors.text, fontSize: 22, fontWeight: "700" }}
      >
        Reminders
      </Text>

      <Card style={{ marginTop: theme.spacing(2) }}>
        <Text
          style={{
            color: theme.colors.muted,
            marginBottom: theme.spacing(1),
          }}
        >
          Track upcoming reminders and snoozed follow-ups.
        </Text>
        <NeonButton
          label="Quick Add Reminder"
          onPress={() => router.push("/(modals)/quick-add?type=reminder")}
        />
      </Card>

      <Card style={{ marginTop: theme.spacing(2) }}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: 16,
            fontWeight: "600",
            marginBottom: theme.spacing(1),
          }}
        >
          Upcoming
        </Text>
        {errorMessage ? (
          <Text style={{ color: theme.colors.danger }}>{errorMessage}</Text>
        ) : null}
        {loading ? (
          <Text style={{ color: theme.colors.muted }}>Loading reminders…</Text>
        ) : upcomingReminders.length === 0 ? (
          <Text style={{ color: theme.colors.muted }}>
            No upcoming reminders.
          </Text>
        ) : (
          upcomingReminders.map((reminder) => (
            <View key={reminder.id} style={{ marginBottom: theme.spacing(1) }}>
              <Link
                href={`/(modals)/reminder-edit?id=${reminder.id}`}
                style={{ color: theme.colors.neon, fontWeight: "600" }}
              >
                {reminder.title}
              </Link>
              <Text style={{ color: theme.colors.muted, marginTop: 2 }}>
                Fire at: {formatMetaValue(getReminderTime(reminder))}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Card style={{ marginTop: theme.spacing(2) }}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: 16,
            fontWeight: "600",
            marginBottom: theme.spacing(1),
          }}
        >
          Snoozed
        </Text>
        {loading ? (
          <Text style={{ color: theme.colors.muted }}>Loading reminders…</Text>
        ) : snoozedReminders.length === 0 ? (
          <Text style={{ color: theme.colors.muted }}>
            No snoozed reminders.
          </Text>
        ) : (
          snoozedReminders.map((reminder) => (
            <View key={reminder.id} style={{ marginBottom: theme.spacing(1) }}>
              <Link
                href={`/(modals)/reminder-edit?id=${reminder.id}`}
                style={{ color: theme.colors.neon, fontWeight: "600" }}
              >
                {reminder.title}
              </Link>
              <Text style={{ color: theme.colors.muted, marginTop: 2 }}>
                Snoozed until: {formatMetaValue(getReminderTime(reminder))}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Card style={{ marginTop: theme.spacing(2) }}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: 16,
            fontWeight: "600",
            marginBottom: theme.spacing(1),
          }}
        >
          History
        </Text>
        <Text style={{ color: theme.colors.muted }}>
          History view is coming soon.
        </Text>
      </Card>
    </ScrollView>
  );
}
