#!/usr/bin/env node
import { startServer } from "./server.js";

// Ensure stdout is clean (no banner). All logs go to stderr via server.ts
await startServer();
