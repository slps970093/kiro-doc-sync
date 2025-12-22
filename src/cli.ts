#!/usr/bin/env node

import { Command } from 'commander';
import { loadConfig } from './config';
import { DocSync } from './sync';
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

      console.log(`Project root: ${projectRoot}`);
      console.log(`Config file: ${configPath}`);
      if (interactive) {
        console.log('Mode: Interactive');
      }
      console.log();

      // Load configuration
      console.log('Loading configuration...');
      const config = loadConfig(projectRoot, configPath);
      console.log(`Found ${config.docs.length} doc source(s)\n`);

      // Perform sync
      const docSync = new DocSync(projectRoot, interactive);
      const result = await docSync.sync(config);

      // Output results
      console.log('\n' + '='.repeat(50));
      console.log(result.message);

      if (result.synced && result.synced.length > 0) {
        console.log('\nSynced files:');
        result.synced.forEach((file) => console.log(`  • ${file}`));
      }

      if (result.errors && result.errors.length > 0) {
        console.log('\nErrors:');
        result.errors.forEach((error) => console.log(`  ✗ ${error}`));
      }

      console.log('='.repeat(50));

      process.exit(result.success ? 0 : 1);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`Fatal error: ${errorMsg}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
