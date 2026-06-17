#!/bin/bash

# Helper script to update frontend config.json after backend deployments

FRONTEND_STACK="inventory-frontend-stack"
LAMBDA_STACK="inventory-lambda-stack"
ECS_STACK="inventory-ecs-stack"

echo "Checking if frontend is deployed..."
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$FRONTEND_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text 2>/dev/null || echo "")

if [ -z "$BUCKET_NAME" ]; then
  echo "Frontend not deployed, skipping config update"
  exit 0
fi

echo "Frontend bucket found: $BUCKET_NAME"
echo "Updating config.json..."

LAMBDA_API=""
ECS_API=""

# Try to get Lambda API URL
LAMBDA_API=$(aws cloudformation describe-stacks \
  --stack-name "$LAMBDA_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text 2>/dev/null || echo "")

# Try to get ECS API URL
ECS_API=$(aws cloudformation describe-stacks \
  --stack-name "$ECS_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text 2>/dev/null || echo "")

# Create temporary config.json
cat > /tmp/config.json << EOF
{
  "api": {
    "lambda": "${LAMBDA_API}",
    "ecs": "${ECS_API}"
  }
}
EOF

echo "New config.json:"
cat /tmp/config.json

# Upload to S3
aws s3 cp /tmp/config.json "s3://$BUCKET_NAME/config.json" --content-type "application/json"

echo "config.json updated successfully!"

# Cleanup
rm -f /tmp/config.json
