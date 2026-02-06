import type { UUID } from "./item";

export type ParsedLink =
  | { kind: "note-id"; id: UUID; raw: string }
  | { kind: "title"; title: string; raw: string };

export type ResolvedLink = {
  link: ParsedLink;
  candidates: UUID[];
};

export type NoteLinkEdge = {
  fromNoteId: UUID;
  toNoteId: UUID;
};

const NOTE_ID_PREFIX = "note-id:";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LINK_PATTERN = /\[\[([^[\]]+?)\]\]/g;

const canonicalizeTitle = (title: string): string =>
  title.trim().toLowerCase().replace(/\s+/g, " ");

export const linkParser = (text: string): ParsedLink[] => {
  const links: ParsedLink[] = [];

  for (const match of text.matchAll(LINK_PATTERN)) {
    const raw = match[0];
    const content = match[1].trim();

    if (content.startsWith(NOTE_ID_PREFIX)) {
      const id = content.slice(NOTE_ID_PREFIX.length).trim();
      if (UUID_PATTERN.test(id)) {
        links.push({ kind: "note-id", id, raw });
        continue;
      }
    }

    if (content.length > 0) {
      links.push({ kind: "title", title: content, raw });
    }
  }

  return links;
};

export const linkResolver = (
  links: ParsedLink[],
  notes: Array<{ id: UUID; title: string }>,
): ResolvedLink[] => {
  const notesById = new Set(notes.map((note) => note.id));
  const notesByTitle = new Map<string, UUID[]>();

  for (const note of notes) {
    const canonicalTitle = canonicalizeTitle(note.title);
    const existing = notesByTitle.get(canonicalTitle);
    if (existing) {
      existing.push(note.id);
    } else {
      notesByTitle.set(canonicalTitle, [note.id]);
    }
  }

  return links.map((link) => {
    if (link.kind === "note-id") {
      return {
        link,
        candidates: notesById.has(link.id) ? [link.id] : [],
      };
    }

    const canonicalTitle = canonicalizeTitle(link.title);
    return {
      link,
      candidates: notesByTitle.get(canonicalTitle) ?? [],
    };
  });
};
