import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.siloworker');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function saveConfig(config) {
  ensureConfigDir();
  const existing = loadConfig();
  const merged = { ...existing, ...config };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));
}

export function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (error) {
    console.warn(`Warning: Invalid config file, creating new one`);
    return {};
  }
}

export function getApiKey() {
  const config = loadConfig();
  return config.apiKey;
}

export function getConfig(key) {
  const config = loadConfig();
  return key ? config[key] : config;
}

export function setConfig(key, value) {
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);
}

export function clearConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }
}
