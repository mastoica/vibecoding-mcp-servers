#!/usr/bin/env node

import { ProcessManagerServer } from './server.js';

async function main() {
  const server = new ProcessManagerServer();
  await server.run();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
