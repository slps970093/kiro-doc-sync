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
      // For glob patterns, we need to include the directory
      const sparsePatterns = new Set<string>();
      for (const pattern of patterns) {
        if (pattern.includes('*')) {
          // For glob patterns, add the directory containing the pattern
          const dir = pattern.substring(0, pattern.lastIndexOf('/'));
          sparsePatterns.add(dir);
        } else {
          // For exact files, add the file itself
          sparsePatterns.add(pattern);
        }
        
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
            const files = this.globSync(filePath);
            
            if (files.length === 0) {
              errors.push(`No files matching pattern: ${pattern}`);
              console.warn(`✗ No files matching: ${pattern}`);
              continue;
            }
            
            for (const file of files) {
              await this.copyFile(file, targetDir, pattern, syncOverride);
            }
            synced.push(pattern);
          } else if (fs.existsSync(filePath)) {
            // Check if it's a directory
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
              // Handle directory - sync all files in it
              const files = this.getAllFiles(filePath);
              if (files.length === 0) {
                console.log(`⊘ Empty directory: ${pattern}`);
                continue;
              }
              
              for (const file of files) {
                await this.copyFile(file, targetDir, pattern, syncOverride);
              }
              synced.push(pattern);
            } else {
              // Handle exact file path
              await this.copyFile(filePath, targetDir, pattern, syncOverride);
              synced.push(pattern);
            }
          } else {
            errors.push(`File or directory not found in repo: ${pattern}`);
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

  private globSync(pattern: string): string[] {
    try {
      const glob = require('glob');
      return glob.sync(pattern);
    } catch (err) {
      console.warn(`Warning: glob pattern failed for ${pattern}`);
      return [];
    }
  }

  private getAllFiles(dirPath: string): string[] {
    const files: string[] = [];
    
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively get files from subdirectories
          files.push(...this.getAllFiles(fullPath));
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (err) {
      console.warn(`Warning: could not read directory ${dirPath}`);
    }
    
    return files;
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
