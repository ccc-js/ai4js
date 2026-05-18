#!/bin/bash
set -x
npm test
node src/nn/chargpt_main.js