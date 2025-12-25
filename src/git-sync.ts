import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import simpleGit, { SimpleGit } from 'simple-git';
import { Prompt } from './prompt';
import { Logger } from './logger';

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
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }

      const repoDir = path.join(this.tempDir, 'repo');
      const ref = tag || branch || 'HEAD';
      Logger.info(`Cloning ${gitUrl} (${ref})...`);

      const cloneOptions = ['--depth', '1'];
      if (branch) cloneOptions.push('--branch', branch);
      if (tag) cloneOptions.push('--branch', tag);

      await simpleGit().clone(gitUrl, repoDir, cloneOptions);

      // Process each pattern
      for (const pattern of patterns) {
        try {
          const filePath = path.join(repoDir, pattern);
          await this.processPattern(pattern, filePath, targetDir, syncOverride, synced, errors);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          errors.push(`Error syncing ${pattern}: ${errorMsg}`);
          Logger.error(`Error syncing ${pattern}: ${errorMsg}`);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Git sync failed: ${errorMsg}`);
    }

    return { synced, errors };
  }

  private async processPattern(
    pattern: string,
    filePath: string,
    targetDir: string,
    syncOverride: boolean,
    synced: string[],
    errors: string[]
  ): Promise<void> {
    if (pattern.includes('*')) {
      await this.processGlobPattern(pattern, filePath, targetDir, syncOverride, synced, errors);
    } else if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        await this.processDirectory(pattern, filePath, targetDir, syncOverride, synced, errors);
      } else {
        await this.processFile(pattern, filePath, targetDir, syncOverride, synced, errors);
      }
    } else {
      errors.push(`File or directory not found in repo: ${pattern}`);
      Logger.warn(`Not found: ${pattern}`);
    }
  }

  private async processGlobPattern(
    pattern: string,
    filePath: string,
    targetDir: string,
    syncOverride: boolean,
    synced: string[],
    errors: string[]
  ): Promise<void> {
    const files = this.globSync(filePath);

    Logger.info(`Glob pattern: ${pattern}`);
    Logger.info(`  Found ${files.length} file(s)`);

    if (files.length === 0) {
      errors.push(`No files matching pattern: ${pattern}`);
      Logger.warn(`No files matching: ${pattern}`);
      return;
    }

    for (const file of files) {
      await this.copyFile(file, targetDir, pattern, syncOverride);
    }
    synced.push(pattern);
  }

  private async processDirectory(
    pattern: string,
    filePath: string,
    targetDir: string,
    syncOverride: boolean,
    synced: string[],
    errors: string[]
  ): Promise<void> {
    const files = this.getAllFiles(filePath);

    if (files.length === 0) {
      Logger.skip(`Empty directory: ${pattern}`);
      return;
    }

    for (const file of files) {
      await this.copyFile(file, targetDir, pattern, syncOverride);
    }
    synced.push(pattern);
  }

  private async processFile(
    pattern: string,
    filePath: string,
    targetDir: string,
    syncOverride: boolean,
    synced: string[],
    errors: string[]
  ): Promise<void> {
    await this.copyFile(filePath, targetDir, pattern, syncOverride);
    synced.push(pattern);
  }

  private async copyFile(
    filePath: string,
    targetDir: string,
    pattern: string,
    syncOverride: boolean
  ): Promise<void> {
    const fileName = path.basename(filePath);
    const targetPath = path.join(targetDir, fileName);

    if (fs.existsSync(targetPath) && !syncOverride) {
      if (this.interactive) {
        const shouldOverride = await this.prompt.confirm(
          `File already exists: ${fileName}. Overwrite?`
        );
        if (!shouldOverride) {
          Logger.skip(`Skipped (exists): ${pattern}`);
          return;
        }
      } else {
        Logger.skip(`Skipped (exists): ${pattern}`);
        return;
      }
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content, 'utf-8');

    Logger.success(`Synced: ${pattern}`);
  }

  private globSync(pattern: string): string[] {
    try {
      const glob = require('glob');
      const normalizedPattern = pattern.replace(/\\/g, '/');
      const results = glob.sync(normalizedPattern);
      return results.map((r: string) => path.resolve(r));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
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
          files.push(...this.getAllFiles(fullPath));
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (err) {
      Logger.warn(`Could not read directory ${dirPath}`);
    }

    return files;
  }

  async cleanup(): Promise<void> {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
    this.prompt.close();
  }
}
