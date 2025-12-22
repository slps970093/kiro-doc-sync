export interface SyncConfig {
  general: {
    files: {
      sync_override: boolean;
    };
  };
  docs: DocSource[];
}

export interface DocSource {
  git: string;
  steering: string[];
}

export interface SyncResult {
  success: boolean;
  message: string;
  synced?: string[];
  errors?: string[];
}
