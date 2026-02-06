import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { createDbClient } from "../../../src/core/data/db/DbClient";
import { ItemRepo } from "../../../src/core/data/repos/ItemRepo";
import { LinkIndexRepo } from "../../../src/core/data/repos/LinkIndexRepo";
import { linkParser, linkResolver } from "../../../src/core/domain/links";
import { useVault } from "../../../src/core/services/security/VaultProvider";
import { Card } from "../../../src/ui/primitives/Card";
import { ItemRow } from "../../../src/ui/primitives/ItemRow";
import { theme } from "../../../src/ui/theme/theme";

import type { NoteItem } from "../../../src/core/domain/item";
import type { ResolvedLink } from "../../../src/core/domain/links";

const LINK_PATTERN = /\[\[([^[]+?)\]\]/g;

const canonicalizeTitle = (title: string): string =>
  title.trim().toLowerCase().replace(/\s+/g, " ");

const renderInlineLinks = (
  text: string,
  resolvedByRaw: Map<string, ResolvedLink>,
  onPressLink: (link: ResolvedLink) => void,
) => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(LINK_PATTERN)) {
    if (match.index === undefined) continue;
    const raw = match[0];
    const content = match[1];
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const resolved = resolvedByRaw.get(raw);
    parts.push(
      <Text
        key={`${raw}-${match.index}`}
        style={{ color: theme.colors.neon, fontWeight: "600" }}
        onPress={() => resolved && onPressLink(resolved)}
      >
        {content}
      </Text>,
    );

    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

export default function NoteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { db } = useVault();
  const client = useMemo(() => (db ? createDbClient(db) : null), [db]);
  const [note, setNote] = useState<NoteItem | null>(null);
  const [allNotes, setAllNotes] = useState<NoteItem[]>([]);
  const [backlinks, setBacklinks] = useState<NoteItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client || !id) return;
    let mounted = true;

    const load = async () => {
      try {
        const itemRepo = new ItemRepo(client);
        const linkRepo = new LinkIndexRepo(client);
        const fetched = await itemRepo.getItem(id);
        if (!mounted) return;
        if (!fetched || fetched.type !== "note") {
          setError("Note not found.");
          return;
        }
        const notes = await itemRepo.listNotes();
        if (!mounted) return;
        const inbound = await linkRepo.getBacklinks(fetched.id);
        if (!mounted) return;
        setNote(fetched);
        setAllNotes(notes);
        setBacklinks(inbound);
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

  const resolvedLinks = useMemo(() => {
    if (!note) return [];
    const noteText = [note.title, note.body ?? ""].filter(Boolean).join("\n");
    const parsed = linkParser(noteText);
    const noteRefs = allNotes.map((item) => ({
      id: item.id,
      title: item.title,
    }));
    return linkResolver(parsed, noteRefs);
  }, [note, allNotes]);

  const notesById = useMemo(
    () => new Map(allNotes.map((item) => [item.id, item])),
    [allNotes],
  );

  const resolvedByRaw = useMemo(() => {
    const map = new Map<string, ResolvedLink>();
    for (const resolved of resolvedLinks) {
      map.set(resolved.link.raw, resolved);
    }
    return map;
  }, [resolvedLinks]);

  const outgoingLinks = useMemo(() => {
    const seen = new Set<string>();
    return resolvedLinks
      .map((resolved) => {
        if (resolved.candidates.length === 1) {
          const targetId = resolved.candidates[0];
          if (seen.has(targetId)) return null;
          seen.add(targetId);
          return {
            key: targetId,
            label: notesById.get(targetId)?.title ?? "Untitled note",
            onPress: () => router.push(`/(tabs)/notes/${targetId}`),
          };
        }
        if (resolved.candidates.length > 1 && resolved.link.kind === "title") {
          const canonical = canonicalizeTitle(resolved.link.title);
          if (seen.has(canonical)) return null;
          seen.add(canonical);
          return {
            key: canonical,
            label: `${resolved.link.title} (choose)`,
            onPress: () =>
              router.push({
                pathname: "/(modals)/note-link-picker",
                params: {
                  noteId: note?.id,
                  title: resolved.link.title,
                  raw: resolved.link.raw,
                },
              }),
          };
        }
        return null;
      })
      .filter(
        (
          link,
        ): link is {
          key: string;
          label: string;
          onPress: () => void;
        } => Boolean(link),
      );
  }, [notesById, resolvedLinks, router, note?.id]);

  const handleLinkPress = (resolved: ResolvedLink) => {
    if (resolved.candidates.length === 1) {
      router.push(`/(tabs)/notes/${resolved.candidates[0]}`);
      return;
    }
    if (resolved.link.kind === "title" && resolved.candidates.length > 1) {
      router.push({
        pathname: "/(modals)/note-link-picker",
        params: {
          noteId: note?.id,
          title: resolved.link.title,
          raw: resolved.link.raw,
        },
      });
    }
  };

  const renderMarkdownLite = (body: string) => {
    const lines = body.split(/\r?\n/);
    return lines.map((line, index) => {
      const trimmed = line.trim();
      const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
      const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);

      let textStyle = {
        color: theme.colors.text,
        fontSize: 14,
        lineHeight: 20,
      };

      if (headingMatch) {
        const level = headingMatch[1].length;
        textStyle = {
          ...textStyle,
          fontSize: level === 1 ? 20 : level === 2 ? 18 : 16,
          fontWeight: "700",
        };
      }

      const content = headingMatch
        ? headingMatch[2]
        : bulletMatch
          ? bulletMatch[1]
          : line;

      return (
        <View
          key={`${line}-${index}`}
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            marginBottom: theme.spacing(1),
          }}
        >
          {bulletMatch ? (
            <Text style={{ color: theme.colors.muted, marginRight: 8 }}>•</Text>
          ) : null}
          <Text style={textStyle}>
            {renderInlineLinks(content, resolvedByRaw, handleLinkPress)}
          </Text>
        </View>
      );
    });
  };

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
        Note Detail
      </Text>

      <Card style={{ marginTop: theme.spacing(2) }}>
        {!id && (
          <Text style={{ color: theme.colors.danger }}>Missing note id.</Text>
        )}
        {id && !note && !error && (
          <Text style={{ color: theme.colors.muted }}>Loading note…</Text>
        )}
        {error && <Text style={{ color: theme.colors.danger }}>{error}</Text>}
        {note && (
          <>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: 20,
                fontWeight: "700",
                marginBottom: theme.spacing(1),
              }}
            >
              {note.title}
            </Text>
            {note.body ? (
              <View>{renderMarkdownLite(note.body)}</View>
            ) : (
              <Text style={{ color: theme.colors.muted }}>
                No body content yet.
              </Text>
            )}
            <View style={{ height: theme.spacing(1.5) }} />
            <Pressable
              onPress={() => router.push(`/(modals)/edit-item?id=${note.id}`)}
              style={({ pressed }) => [
                {
                  paddingVertical: theme.spacing(0.75),
                  paddingHorizontal: theme.spacing(1.5),
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.neon,
                  alignSelf: "flex-start",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={{ color: theme.colors.neon, fontWeight: "600" }}>
                Edit note
              </Text>
            </Pressable>
          </>
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
          Outgoing Links
        </Text>
        {note && outgoingLinks.length === 0 ? (
          <Text style={{ color: theme.colors.muted }}>
            No outgoing links found.
          </Text>
        ) : null}
        {outgoingLinks.map((link) => (
          <ItemRow
            key={link.key}
            title={link.label}
            typeLabel="Note"
            onPress={link.onPress}
            style={{ marginBottom: theme.spacing(1) }}
          />
        ))}
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
          Backlinks
        </Text>
        {note && backlinks.length === 0 ? (
          <Text style={{ color: theme.colors.muted }}>No backlinks yet.</Text>
        ) : null}
        {backlinks.map((link) => (
          <ItemRow
            key={link.id}
            title={link.title}
            typeLabel="Note"
            onPress={() => router.push(`/(tabs)/notes/${link.id}`)}
            style={{ marginBottom: theme.spacing(1) }}
          />
        ))}
      </Card>
    </ScrollView>
  );
}
