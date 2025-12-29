import fetch from 'node-fetch';
import chalk from 'chalk';

const API_URL = 'https://api.siloworker.dev';

export class SiloWorkerAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async request(method, path, body = null) {
    const url = `${API_URL}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(chalk.red(`API Error: ${error.message}`));
      process.exit(1);
    }
  }

  async get(path) { return this.request('GET', path); }
  async post(path, body) { return this.request('POST', path, body); }
  async put(path, body) { return this.request('PUT', path, body); }
  async delete(path) { return this.request('DELETE', path); }
}
