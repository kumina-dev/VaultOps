import { linkParser, linkResolver } from "../../domain/links";
import { META_KEYS } from "../db/dbHealthRepo";

import type { UUID, NoteItem } from "../../domain/item";
import type { DbClient } from "../db/DbClient";

type NoteRow = {
  id: string;
  title: string;
  body: string | null;
  area_id: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  note_pinned: number | null;
  note_favorite: number | null;
};

type NoteReferenceRow = {
  id: string;
  title: string;
  body: string | null;
};

type NoteLinkEdge = {
  fromNoteId: UUID;
  toNoteId: UUID;
  rawText: string;
};

function fromDbBoolean(value: number | null): boolean {
  return value === 1;
}

function mapRowToNote(row: NoteRow): NoteItem {
  return {
    id: row.id,
    type: "note",
    title: row.title,
    body: row.body,
    areaId: row.area_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    pinned: fromDbBoolean(row.note_pinned),
    favorite: fromDbBoolean(row.note_favorite),
  };
}

function buildNoteText(note: NoteReferenceRow): string {
  return [note.title, note.body ?? ""].filter(Boolean).join("\n");
}

export class LinkIndexRepo {
  constructor(private readonly client: DbClient) {}

  private async listNotes(): Promise<NoteReferenceRow[]> {
    return this.client.getAll<NoteReferenceRow>(
      `
        SELECT id, title, body
        FROM items
        WHERE type = 'note'
      `,
      [],
      "linkIndex.listNotes",
    );
  }

  private async getNote(noteId: UUID): Promise<NoteReferenceRow | null> {
    return this.client.getFirst<NoteReferenceRow>(
      `
        SELECT id, title, body
        FROM items
        WHERE id = ?
          AND type = 'note'
      `,
      [noteId],
      "linkIndex.getNote",
    );
  }

  private buildEdges(
    note: NoteReferenceRow,
    allNotes: Array<{ id: UUID; title: string }>,
  ): NoteLinkEdge[] {
    const links = linkParser(buildNoteText(note));
    const resolved = linkResolver(links, allNotes);
    const edges: NoteLinkEdge[] = [];

    for (const resolvedLink of resolved) {
      if (resolvedLink.candidates.length === 0) {
        continue;
      }
      for (const candidate of resolvedLink.candidates) {
        edges.push({
          fromNoteId: note.id,
          toNoteId: candidate,
          rawText: resolvedLink.link.raw,
        });
      }
    }

    return edges;
  }

  private async insertEdges(edges: NoteLinkEdge[]): Promise<void> {
    for (const edge of edges) {
      await this.client.run(
        `
          INSERT OR REPLACE INTO note_links (
            from_note_id,
            to_note_id,
            created_at,
            raw_text
          ) VALUES (?, ?, ?, ?)
        `,
        [
          edge.fromNoteId,
          edge.toNoteId,
          new Date().toISOString(),
          edge.rawText,
        ],
        "linkIndex.insertEdge",
      );
    }
  }

  async rebuildAll(): Promise<void> {
    await this.client.transaction(async (tx) => {
      await tx.run("DELETE FROM note_links", [], "linkIndex.rebuild.clear");

      const notes = await new LinkIndexRepo(tx).listNotes();
      const noteRefs = notes.map((note) => ({
        id: note.id,
        title: note.title,
      }));

      for (const note of notes) {
        const edges = new LinkIndexRepo(tx).buildEdges(note, noteRefs);
        await new LinkIndexRepo(tx).insertEdges(edges);
      }

      await tx.run(
        "UPDATE meta SET value = ? WHERE key = ?",
        [new Date().toISOString(), META_KEYS.linksLastRebuildAt],
        "linkIndex.rebuild.meta",
      );
    }, "linkIndex.rebuild");
  }

  async updateForNote(noteId: UUID): Promise<void> {
    await this.client.transaction(async (tx) => {
      await tx.run(
        "DELETE FROM note_links WHERE from_note_id = ?",
        [noteId],
        "linkIndex.update.clear",
      );

      const repo = new LinkIndexRepo(tx);
      const note = await repo.getNote(noteId);
      if (!note) {
        return;
      }

      const notes = await repo.listNotes();
      const noteRefs = notes.map((item) => ({
        id: item.id,
        title: item.title,
      }));
      const edges = repo.buildEdges(note, noteRefs);
      await repo.insertEdges(edges);
    }, "linkIndex.update");
  }

  async getBacklinks(noteId: UUID): Promise<NoteItem[]> {
    const rows = await this.client.getAll<NoteRow>(
      `
        SELECT
          items.id,
          items.title,
          items.body,
          items.area_id,
          items.created_at,
          items.updated_at,
          items.archived_at,
          items.note_pinned,
          items.note_favorite
        FROM note_links
        JOIN items ON note_links.from_note_id = items.id
        WHERE note_links.to_note_id = ?
          AND items.type = 'note'
        ORDER BY items.updated_at DESC
      `,
      [noteId],
      "linkIndex.getBacklinks",
    );
    return rows.map(mapRowToNote);
  }
}
