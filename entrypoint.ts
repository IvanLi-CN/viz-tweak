#!/bin/bun

import { dirname } from "node:path";
import { $ } from "bun";

// create db directory

const dir = dirname(process.env.DB_PATH || "/home/bun/.viz-tweak/db.sqlite");
await $`mkdir -p "${dir}"`;
await $`chown -R bun:bun "${dir}"`;

// run server

await $`su bun -c "bun run ./src/index.ts"`.catch(() => {
  console.error("Failed to start server");
});