export type VaultExport = {
  version: number;
  exportedAt: string;
  areas: Array<{ id: string; name: string }>;
  tags: string[];
  items: unknown[];
  reminders: unknown[];
  actionEvents?: unknown[];
};

export interface ExportJsonService {
  buildExport(): Promise<VaultExport>;
  writePlainJsonFile(exportData: VaultExport): Promise<string>;
}
