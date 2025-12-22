import * as fs from 'fs';
import * as path from 'path';
import { SyncConfig } from './types';

const DEFAULT_CONFIG_FILE = 'kiro-doc-sync.cfg.json';

export function loadConfig(projectRoot: string, configFile?: string): SyncConfig {
  const fileName = configFile || DEFAULT_CONFIG_FILE;
  const configPath = path.isAbsolute(fileName)
    ? fileName
    : path.join(projectRoot, fileName);

  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  const config: SyncConfig = JSON.parse(content);

  validateConfig(config);
  return config;
}

function validateConfig(config: SyncConfig): void {
  if (!config.general?.files?.sync_override) {
    throw new Error('Invalid config: missing general.files.sync_override');
  }

  if (!Array.isArray(config.docs) || config.docs.length === 0) {
    throw new Error('Invalid config: docs must be a non-empty array');
  }

  config.docs.forEach((doc, index) => {
    if (!doc.git) {
      throw new Error(`Invalid config: docs[${index}] missing git URL`);
    }
    if (!Array.isArray(doc.steering) || doc.steering.length === 0) {
      throw new Error(`Invalid config: docs[${index}] steering must be a non-empty array`);
    }
  });
}
