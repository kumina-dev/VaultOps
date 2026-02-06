export interface EncryptionStatus {
  enabled: boolean;
  lastUnlockedAt?: string;
}

export interface EncryptionService {
  status(): Promise<EncryptionService>;
}
