import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { getDbHealthSnapshot } from "../../../src/core/data/db/dbHealthRepo";
import { useVault } from "../../../src/core/services/security/VaultProvider";
import { Card } from "../../../src/ui/primitives/Card";
import { theme } from "../../../src/ui/theme/theme";

const formatMetaValue = (value: string | null) =>
  value && value.trim().length > 0 ? value : "Not recorded";

export default function SecurityScreen() {
  const { db } = useVault();
  const [status, setStatus] = useState<Awaited<
    ReturnType<typeof getDbHealthSnapshot>
  > | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    let mounted = true;

    const load = async () => {
      try {
        const snapshot = await getDbHealthSnapshot(db);
        if (!mounted) return;
        setStatus(snapshot);
      } catch (error) {
        if (!mounted) return;
        const message =
          error instanceof Error ? error.message : "Unable to load DB health.";
        setErrorMessage(message);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [db]);

  const tableRows = useMemo(() => {
    if (!status) return [];
    return status.tables.map((table) => ({
      label: table.table,
      value: table.exists ? "OK" : "Missing",
      statusColor: table.exists ? theme.colors.neon : theme.colors.danger,
    }));
  }, [status]);

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
        Security
      </Text>

      <Card style={{ marginTop: theme.spacing(2) }}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: 16,
            fontWeight: "600",
            marginBottom: theme.spacing(1),
          }}
        >
          DB status
        </Text>

        {errorMessage ? (
          <Text style={{ color: theme.colors.danger }}>{errorMessage}</Text>
        ) : null}

        <View style={{ marginBottom: theme.spacing(2) }}>
          <Text style={{ color: theme.colors.muted }}>
            PRAGMA user_version: {status?.userVersion ?? "—"}
          </Text>
          <Text style={{ color: theme.colors.muted, marginTop: 4 }}>
            Last migrated:{" "}
            {formatMetaValue(status?.meta.lastMigratedAt ?? null)}
          </Text>
          <Text style={{ color: theme.colors.muted, marginTop: 4 }}>
            Links rebuilt:{" "}
            {formatMetaValue(status?.meta.linksLastRebuildAt ?? null)}
          </Text>
          <Text style={{ color: theme.colors.muted, marginTop: 4 }}>
            Reminders reconciled:{" "}
            {formatMetaValue(status?.meta.remindersLastReconcileAt ?? null)}
          </Text>
        </View>

        <View>
          <Text
            style={{
              color: theme.colors.text,
              fontWeight: "600",
              marginBottom: theme.spacing(1),
            }}
          >
            Core tables
          </Text>
          {tableRows.length === 0 ? (
            <Text style={{ color: theme.colors.muted }}>Loading checks…</Text>
          ) : (
            tableRows.map((row) => (
              <View
                key={row.label}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: theme.spacing(0.5),
                }}
              >
                <Text style={{ color: theme.colors.muted }}>{row.label}</Text>
                <Text style={{ color: row.statusColor }}>{row.value}</Text>
              </View>
            ))
          )}
        </View>
      </Card>
    </ScrollView>
  );
}
