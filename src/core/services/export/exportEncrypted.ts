import type { VaultExport } from "./exportJson";

export interface ExportEncryptedService {
  writeEncryptedExport(
    exportData: VaultExport,
    password: string,
  ): Promise<string>;
}
