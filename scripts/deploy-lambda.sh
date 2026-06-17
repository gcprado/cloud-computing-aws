#!/bin/bash

set -e

STACK_NAME=${1:-"inventory-lambda-stack"}
BACKEND_DIR="./backend/lambda-sam"

echo "=================================================="
echo " Deploying Lambda Architecture"
echo "=================================================="
echo "Stack Name: $STACK_NAME"
echo ""

if [ ! -d "$BACKEND_DIR" ]; then
  echo "Error: Backend directory not found: $BACKEND_DIR"
  exit 1
fi

cd "$BACKEND_DIR"

echo "Installing dependencies..."
npm install --omit=dev

echo ""
echo "Building SAM application..."
sam build

echo ""
echo "Deploying to AWS..."
sam deploy \
  --stack-name "$STACK_NAME" \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset

echo ""
echo "Lambda deployment complete!"
echo ""
echo "Fetching outputs..."
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output table

API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)

echo ""
echo "API URL: $API_URL"
echo ""

# Update frontend config if deployed
chmod +x ../../scripts/update-frontend-config.sh 2>/dev/null || true
bash ../../scripts/update-frontend-config.sh 2>/dev/null || true

echo "Test with:"
echo "  curl $API_URL/health"
