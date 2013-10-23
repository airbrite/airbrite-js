#!/bin/bash
echo "### THIS IS TEMPORARY - REPLACE WITH A REAL BUILD TOOL"

UTILS_DIR="$(cd "$(dirname $0)" && pwd)"

# Go to repository root
cd ${UTILS_DIR}/..

# Concatenate
cat src/nested-extensions.js > airbrite.js
cat src/core.js >> airbrite.js
cat src/product.js >> airbrite.js
cat src/order.js >> airbrite.js
