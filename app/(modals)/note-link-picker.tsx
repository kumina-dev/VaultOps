import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { createDbClient } from "../../src/core/data/db/DbClient";
import { ItemRepo } from "../../src/core/data/repos/ItemRepo";
import { scheduleLinkIndexUpdate } from "../../src/core/services/links/linkIndexScheduler";
import { useVault } from "../../src/core/services/security/VaultProvider";
import { Card } from "../../src/ui/primitives/Card";
import { ItemRow } from "../../src/ui/primitives/ItemRow";
import { NeonButton } from "../../src/ui/primitives/NeonButton";
import { theme } from "../../src/ui/theme/theme";

import type { NoteItem } from "../../src/core/domain/item";

const canonicalizeTitle = (title: string): string =>
  title.trim().toLowerCase().replace(/\s+/g, " ");

export default function NoteLinkPickerModal() {
  const router = useRouter();
  const { noteId, title, raw } = useLocalSearchParams<{
    noteId?: string;
    title?: string;
    raw?: string;
  }>();
  const { db } = useVault();
  const client = useMemo(() => (db ? createDbClient(db) : null), [db]);
  const [candidates, setCandidates] = useState<NoteItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!client || !title) return;
    let mounted = true;

    const load = async () => {
      try {
        const repo = new ItemRepo(client);
        const notes = await repo.listNotes();
        if (!mounted) return;
        const canonical = canonicalizeTitle(title);
        setCandidates(
          notes.filter((note) => canonicalizeTitle(note.title) === canonical),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Load failed.";
        setError(message);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [client, title]);

  const handleSelect = async (targetId: string) => {
    if (!client || !noteId || !raw) return;
    setSaving(true);
    setError(null);

    try {
      const repo = new ItemRepo(client);
      const note = await repo.getItem(noteId);
      if (!note || note.type !== "note") {
        setError("Source note not found.");
        return;
      }

      const replacement = `[[note-id:${targetId}]]`;
      let updatedTitle = note.title;
      let updatedBody = note.body ?? "";
      let updated = false;

      if (updatedBody.includes(raw)) {
        updatedBody = updatedBody.replace(raw, replacement);
        updated = true;
      } else if (updatedTitle.includes(raw)) {
        updatedTitle = updatedTitle.replace(raw, replacement);
        updated = true;
      }

      if (!updated) {
        setError("Link text not found in note.");
        return;
      }

      await repo.updateItem(noteId, {
        title: updatedTitle.trim(),
        body: updatedBody.trim() || null,
      });
      scheduleLinkIndexUpdate(client, noteId);
      router.replace(`/(tabs)/notes/${targetId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed.";
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
        Choose a note
      </Text>

      <ScrollView
        style={{ marginTop: theme.spacing(2) }}
        contentContainerStyle={{ paddingBottom: theme.spacing(3) }}
      >
        <Card>
          {!title ? (
            <Text style={{ color: theme.colors.danger }}>
              Missing link title.
            </Text>
          ) : null}

          {title ? (
            <Text style={{ color: theme.colors.muted, marginBottom: 8 }}>
              Multiple notes match “{title}”. Pick the right target.
            </Text>
          ) : null}

          {error ? (
            <Text style={{ color: theme.colors.danger, marginBottom: 8 }}>
              {error}
            </Text>
          ) : null}

          {candidates.length === 0 && title ? (
            <Text style={{ color: theme.colors.muted, marginBottom: 8 }}>
              No matching notes available.
            </Text>
          ) : null}

          {candidates.map((note) => (
            <ItemRow
              key={note.id}
              title={note.title}
              typeLabel="Note"
              onPress={() => handleSelect(note.id)}
              style={{ marginBottom: theme.spacing(1) }}
            />
          ))}

          {saving ? (
            <Text style={{ color: theme.colors.muted, marginBottom: 8 }}>
              Saving link selection…
            </Text>
          ) : null}

          <View style={{ height: theme.spacing(1) }} />
          <NeonButton label="Close" onPress={() => router.back()} />
        </Card>
      </ScrollView>
    </View>
  );
}
