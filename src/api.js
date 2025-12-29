import fetch from 'node-fetch';
import chalk from 'chalk';

const API_URL = process.env.SILOWORKER_API_URL || 'https://api.siloworker.dev';

function log(message, level = 'info') {
  if (process.env.SILOWORKER_VERBOSE === 'true' || process.env.SILOWORKER_DEBUG === 'true') {
    const timestamp = new Date().toISOString();
    const colors = { info: chalk.blue, warn: chalk.yellow, error: chalk.red, debug: chalk.gray };
    console.error(`${colors[level](`[${level.toUpperCase()}]`)} ${timestamp} ${message}`);
  }
}

function debug(message) {
  if (process.env.SILOWORKER_DEBUG === 'true') {
    log(message, 'debug');
  }
}

export class SiloWorkerAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    debug(`Initialized API client with URL: ${API_URL}`);
  }

  async request(method, path, body = null) {
    const url = `${API_URL}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'siloworker-cli/1.0.0',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    debug(`${method} ${url}`);
    if (body && process.env.SILOWORKER_DEBUG === 'true') {
      debug(`Request body: ${JSON.stringify(body, null, 2)}`);
    }

    try {
      const startTime = Date.now();
      const response = await fetch(url, options);
      const duration = Date.now() - startTime;
      
      log(`${method} ${path} - ${response.status} (${duration}ms)`);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        if (isJson) {
          const data = await response.json();
          debug(`Error response: ${JSON.stringify(data, null, 2)}`);
          throw new Error(data.error || data.message || `HTTP ${response.status}`);
        } else {
          const text = await response.text();
          debug(`Error response (HTML): ${text.substring(0, 200)}...`);
          // Extract meaningful error from HTML if possible
          const match = text.match(/<title>(.*?)<\/title>/i);
          const errorMsg = match ? match[1] : `HTTP ${response.status}`;
          throw new Error(`Server error: ${errorMsg}`);
        }
      }
      
      if (isJson) {
        const data = await response.json();
        debug(`Response: ${JSON.stringify(data, null, 2)}`);
        return data;
      } else {
        throw new Error('Server returned non-JSON response');
      }
    } catch (error) {
      log(`API request failed: ${error.message}`, 'error');
      console.error(chalk.red(`API Error: ${error.message}`));
      process.exit(1);
    }
  }

  async get(path) { return this.request('GET', path); }
  async post(path, body) { return this.request('POST', path, body); }
  async put(path, body) { return this.request('PUT', path, body); }
  async delete(path) { return this.request('DELETE', path); }
}
