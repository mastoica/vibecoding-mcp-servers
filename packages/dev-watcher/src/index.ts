#!/usr/bin/env node

import { DevWatcherServer } from './server.js';

async function main() {
  const server = new DevWatcherServer();
  await server.run();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
