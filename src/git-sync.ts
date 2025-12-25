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
    syncOverride: boolean = true,
    branch?: string,
    tag?: string
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
      const ref = tag || branch || 'HEAD';
      console.log(`Cloning ${gitUrl} (${ref}) with sparse-checkout...`);
      const git = simpleGit();
      
      // Build clone options
      const cloneOptions = ['--depth', '1', '--no-checkout'];
      if (branch) {
        cloneOptions.push('--branch', branch);
      } else if (tag) {
        cloneOptions.push('--branch', tag);
      }
      
      // Clone with no-checkout
      await git.clone(gitUrl, repoDir, cloneOptions);
      
      // Configure sparse-checkout
      const repoGit = simpleGit(repoDir);
      await repoGit.raw(['config', 'core.sparseCheckout', 'true']);
      
      // Build sparse-checkout patterns
      // Include parent directories for glob patterns
      const sparsePatterns = new Set<string>();
      for (const pattern of patterns) {
        sparsePatterns.add(pattern);
        // Add parent directories to ensure they're checked out
        const parts = pattern.split('/');
        for (let i = 1; i < parts.length; i++) {
          sparsePatterns.add(parts.slice(0, i).join('/'));
        }
      }
      
      // Write sparse-checkout patterns
      const sparseCheckoutPath = path.join(repoDir, '.git', 'info', 'sparse-checkout');
      fs.mkdirSync(path.dirname(sparseCheckoutPath), { recursive: true });
      fs.writeFileSync(sparseCheckoutPath, Array.from(sparsePatterns).join('\n'), 'utf-8');
      
      // Checkout with sparse-checkout
      await repoGit.checkout();

      // Process each pattern - handle glob patterns
      for (const pattern of patterns) {
        try {
          const filePath = path.join(repoDir, pattern);
          
          // Check if it's a glob pattern
          if (pattern.includes('*')) {
            // Handle glob pattern
            const globPattern = filePath;
            const files = this.globSync(globPattern);
            
            if (files.length === 0) {
              errors.push(`No files matching pattern: ${pattern}`);
              console.warn(`✗ No files matching: ${pattern}`);
              continue;
            }
            
            for (const file of files) {
              await this.copyFile(file, targetDir, pattern, syncOverride);
              synced.push(pattern);
            }
          } else {
            // Handle exact file path
            if (fs.existsSync(filePath)) {
              await this.copyFile(filePath, targetDir, pattern, syncOverride);
              synced.push(pattern);
            } else {
              errors.push(`File not found in repo: ${pattern}`);
              console.warn(`✗ Not found: ${pattern}`);
            }
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

  private globSync(pattern: string): string[] {
    const glob = require('glob');
    try {
      return glob.sync(pattern);
    } catch {
      return [];
    }
  }

  private async copyFile(
    filePath: string,
    targetDir: string,
    pattern: string,
    syncOverride: boolean
  ): Promise<void> {
    const fileName = path.basename(filePath);
    const targetPath = path.join(targetDir, fileName);

    // Check if file exists and sync_override is false
    if (fs.existsSync(targetPath) && !syncOverride) {
      if (this.interactive) {
        const shouldOverride = await this.prompt.confirm(
          `File already exists: ${fileName}. Overwrite?`
        );
        if (!shouldOverride) {
          console.log(`⊘ Skipped (exists): ${pattern}`);
          return;
        }
      } else {
        console.log(`⊘ Skipped (exists): ${pattern}`);
        return;
      }
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content, 'utf-8');

    console.log(`✓ Synced: ${pattern}`);
  }

  async cleanup(): Promise<void> {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
    this.prompt.close();
  }
}
