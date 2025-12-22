import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import simpleGit, { SimpleGit } from 'simple-git';
import { Prompt } from './prompt';

export class GitSync {
  private tempDir: string;
  private git: SimpleGit;
  private prompt: Prompt;
  private interactive: boolean;

  constructor(interactive: boolean = false) {
    this.tempDir = path.join(os.tmpdir(), `kiro-sync-${Date.now()}`);
    this.git = simpleGit();
    this.prompt = new Prompt();
    this.interactive = interactive;
  }

  async syncFiles(
    gitUrl: string,
    patterns: string[],
    targetDir: string,
    syncOverride: boolean = true
  ): Promise<{ synced: string[]; errors: string[] }> {
    const synced: string[] = [];
    const errors: string[] = [];

    try {
      // Create temp directory
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }

      const repoDir = path.join(this.tempDir, 'repo');

      // Initialize repo with sparse-checkout
      console.log(`Cloning ${gitUrl} with sparse-checkout...`);
      const git = simpleGit();
      
      // Clone with no-checkout
      await git.clone(gitUrl, repoDir, ['--depth', '1', '--no-checkout']);
      
      // Configure sparse-checkout
      const repoGit = simpleGit(repoDir);
      await repoGit.raw(['config', 'core.sparseCheckout', 'true']);
      
      // Write sparse-checkout patterns
      const sparseCheckoutPath = path.join(repoDir, '.git', 'info', 'sparse-checkout');
      fs.mkdirSync(path.dirname(sparseCheckoutPath), { recursive: true });
      fs.writeFileSync(sparseCheckoutPath, patterns.join('\n'), 'utf-8');
      
      // Checkout with sparse-checkout
      await repoGit.checkout();

      // Process each pattern
      for (const pattern of patterns) {
        try {
          const filePath = path.join(repoDir, pattern);
          const fileName = path.basename(pattern);
          const targetPath = path.join(targetDir, fileName);

          if (fs.existsSync(filePath)) {
            // Check if file exists and sync_override is false
            if (fs.existsSync(targetPath) && !syncOverride) {
              if (this.interactive) {
                const shouldOverride = await this.prompt.confirm(
                  `File already exists: ${fileName}. Overwrite?`
                );
                if (!shouldOverride) {
                  console.log(`⊘ Skipped (exists): ${pattern}`);
                  continue;
                }
              } else {
                console.log(`⊘ Skipped (exists): ${pattern}`);
                continue;
              }
            }

            const content = fs.readFileSync(filePath, 'utf-8');
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.writeFileSync(targetPath, content, 'utf-8');

            synced.push(pattern);
            console.log(`✓ Synced: ${pattern}`);
          } else {
            errors.push(`File not found in repo: ${pattern}`);
            console.warn(`✗ Not found: ${pattern}`);
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          errors.push(`Error syncing ${pattern}: ${errorMsg}`);
          console.error(`✗ Error syncing ${pattern}: ${errorMsg}`);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Git sync failed: ${errorMsg}`);
    }

    return { synced, errors };
  }

  async cleanup(): Promise<void> {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
    this.prompt.close();
  }
}
