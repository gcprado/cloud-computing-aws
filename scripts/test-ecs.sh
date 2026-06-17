#!/bin/bash

set -e

STACK_NAME=${1:-"inventory-ecs-stack"}

echo "=================================================="
echo " Testing ECS Architecture"
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

if [ ! -f "./test_api.sh" ]; then
  echo "Error: test_api.sh not found in current directory"
  exit 1
fi

chmod +x ./test_api.sh

echo "Running API tests..."
echo ""

./test_api.sh "$STACK_NAME"
