#!/usr/bin/env node

import { Command } from 'commander';
import { loadConfig } from './config';
import { DocSync } from './sync';
import { Logger } from './logger';
import * as fs from 'fs';
import * as path from 'path';

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program
  .name('kiro-doc-sync')
  .description('Synchronize documentation files from remote Git repositories')
  .version(pkg.version)
  .option('-c, --config <path>', 'Path to config file', 'kiro-doc-sync.cfg.json')
  .option('-p, --project <path>', 'Project root directory', process.cwd())
  .option('-i, --interactive', 'Ask for confirmation when files already exist', false)
  .action(async (options) => {
    try {
      const { config: configPath, project: projectRoot, interactive } = options;

      Logger.section('Kiro Doc Sync');
      Logger.info(`Project root: ${projectRoot}`);
      Logger.info(`Config file: ${configPath}`);
      if (interactive) {
        Logger.info('Mode: Interactive');
      }

      // Load configuration
      Logger.info('Loading configuration...');
      const config = loadConfig(projectRoot, configPath);
      Logger.success(`Found ${config.docs.length} doc source(s)`);

      // Perform sync
      const docSync = new DocSync(projectRoot, interactive);
      const result = await docSync.sync(config);

      // Output results
      Logger.section(result.success ? 'Sync Completed' : 'Sync Failed');
      Logger.result(result.success, result.message);

      if (result.synced && result.synced.length > 0) {
        Logger.summary('Synced files', result.synced.map(f => `• ${f}`));
      }

      if (result.errors && result.errors.length > 0) {
        Logger.summary('Errors', result.errors.map(e => `✗ ${e}`));
      }

      process.exit(result.success ? 0 : 1);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      Logger.error(`Fatal error: ${errorMsg}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
