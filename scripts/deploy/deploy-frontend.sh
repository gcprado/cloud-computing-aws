#!/bin/bash

set -e

STACK_NAME=${1:-"inventory-frontend-stack"}
FRONTEND_DIR="./frontend"
LAMBDA_STACK="inventory-lambda-stack"
ECS_STACK="inventory-ecs-stack"

echo "=================================================="
echo " Deploying Frontend to S3"
echo "=================================================="
echo "Stack Name: $STACK_NAME"
echo ""

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "Error: Frontend directory not found: $FRONTEND_DIR"
  exit 1
fi

echo "Deploying S3 bucket via CloudFormation..."
cd "$FRONTEND_DIR"

aws cloudformation deploy \
  --template-file deploy.yaml \
  --stack-name "$STACK_NAME" \
  --no-fail-on-empty-changeset

echo ""
echo "Fetching bucket name..."
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text)

echo "Bucket: $BUCKET_NAME"
echo ""

# Generate config.json with current API URLs
echo "Generating config.json..."

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

# Create config.json
cat > config.json << EOF
{
  "api": {
    "lambda": "${LAMBDA_API}",
    "ecs": "${ECS_API}"
  }
}
EOF

echo "config.json content:"
cat config.json
echo ""

echo "Uploading frontend files to S3..."

# Upload HTML, CSS, JS
aws s3 cp index.html "s3://$BUCKET_NAME/" --content-type "text/html"
aws s3 cp styles.css "s3://$BUCKET_NAME/" --content-type "text/css"
aws s3 cp app.js "s3://$BUCKET_NAME/" --content-type "application/javascript"
aws s3 cp config.json "s3://$BUCKET_NAME/" --content-type "application/json"

echo ""
echo "Frontend deployment complete!"
echo ""

cd ..
chmod +x scripts/status/get-stack-status.sh 2>/dev/null || true
bash scripts/status/get-stack-status.sh "$STACK_NAME"

WEBSITE_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='WebsiteURL'].OutputValue" \
  --output text 2>/dev/null || echo "")

echo "Available Backend APIs:"
[ -n "$LAMBDA_API" ] && echo "  Lambda: $LAMBDA_API" || echo "  Lambda: NOT DEPLOYED"
[ -n "$ECS_API" ] && echo "  ECS: $ECS_API" || echo "  ECS: NOT DEPLOYED"
echo ""
if [ -n "$WEBSITE_URL" ]; then
  echo "Frontend URL: $WEBSITE_URL"
  echo ""
  echo "Open the URL in your browser to access the frontend."
fi
