#!/bin/bash

set -e

STACK_NAME=${1:-"inventory-lambda-stack"}

echo "=================================================="
echo " Testing Lambda Architecture"
echo "=================================================="
echo "Stack Name: $STACK_NAME"
echo ""

echo "Fetching API URL..."
API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text 2>/dev/null)

if [ -z "$API_URL" ]; then
  echo "Error: Could not fetch API URL from stack '$STACK_NAME'"
  echo "   Make sure the stack is deployed."
  exit 1
fi

echo "API URL: $API_URL"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_API="$SCRIPT_DIR/test-api.sh"

if [ ! -f "$TEST_API" ]; then
  echo "Error: test-api.sh not found"
  exit 1
fi

chmod +x "$TEST_API"

echo "Running API tests..."
echo ""

"$TEST_API" "$STACK_NAME"
