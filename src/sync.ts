import * as fs from 'fs';
import * as path from 'path';
import { SyncConfig, SyncResult } from './types';
import { GitSync } from './git-sync';

export class DocSync {
  private projectRoot: string;
  private steeringDir: string;
  private interactive: boolean;

  constructor(projectRoot: string, interactive: boolean = false) {
    this.projectRoot = projectRoot;
    this.steeringDir = path.join(projectRoot, '.kiro', 'steering');
    this.interactive = interactive;
  }

  async sync(config: SyncConfig): Promise<SyncResult> {
    const allSynced: string[] = [];
    const allErrors: string[] = [];
    const syncOverride = config.general.files.sync_override;

    try {
      // Create steering directory
      this.ensureSteeringDir();

      // Process each doc source
      for (const docSource of config.docs) {
        const gitSync = new GitSync(this.interactive);

        try {
          const { synced, errors } = await gitSync.syncFiles(
            docSource.git,
            docSource.steering,
            this.steeringDir,
            syncOverride,
            docSource.branch,
            docSource.tag
          );

          allSynced.push(...synced);
          allErrors.push(...errors);
        } finally {
          await gitSync.cleanup();
        }
      }

      return {
        success: allErrors.length === 0,
        message: `Sync completed. ${allSynced.length} files synced${
          allErrors.length > 0 ? `, ${allErrors.length} errors` : ''
        }`,
        synced: allSynced,
        errors: allErrors.length > 0 ? allErrors : undefined,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Sync failed: ${errorMsg}`,
        errors: [errorMsg],
      };
    }
  }

  private ensureSteeringDir(): void {
    if (!fs.existsSync(this.steeringDir)) {
      fs.mkdirSync(this.steeringDir, { recursive: true });
      console.log(`Created directory: ${this.steeringDir}`);
    }
  }
}
