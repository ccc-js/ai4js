#!/bin/bash
set -x
npm test

./server.sh
npm run test:e2e