#!/usr/bin/env node

import { DockerManagerServer } from './server.js';

async function main() {
  const server = new DockerManagerServer();
  await server.run();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
