#!/bin/bash
set -x

# Start API Server in background (port 3001)
npx tsx src/server/index.ts &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Start Vite (port 3000) - this blocks
npm run server