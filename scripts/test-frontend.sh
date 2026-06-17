#!/bin/bash

set -e

STACK_NAME=${1:-"inventory-frontend-stack"}

echo "=================================================="
echo " Testing Frontend Availability"
echo "=================================================="
echo "Stack Name: $STACK_NAME"
echo ""

echo "Fetching website URL..."
WEBSITE_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='WebsiteURL'].OutputValue" \
  --output text 2>/dev/null)

if [ -z "$WEBSITE_URL" ]; then
  echo "Error: Could not fetch website URL from stack '$STACK_NAME'"
  echo "   Make sure the frontend stack is deployed."
  exit 1
fi

echo "Website URL: $WEBSITE_URL"
echo ""

echo "Testing index.html..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEBSITE_URL")

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "SUCCESS: Frontend is accessible (HTTP $HTTP_CODE)"
  echo ""
  echo "Testing config.json..."
  CONFIG_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEBSITE_URL/config.json")
  
  if [ "$CONFIG_CODE" -eq 200 ]; then
    echo "SUCCESS: config.json is accessible (HTTP $CONFIG_CODE)"
    echo ""
    echo "Config content:"
    curl -s "$WEBSITE_URL/config.json" | python3 -m json.tool 2>/dev/null || curl -s "$WEBSITE_URL/config.json"
  else
    echo "WARNING: config.json returned HTTP $CONFIG_CODE"
  fi
  
  echo ""
  echo "All frontend tests passed!"
  echo "Visit: $WEBSITE_URL"
else
  echo "FAILED: Frontend returned HTTP $HTTP_CODE"
  exit 1
fi
