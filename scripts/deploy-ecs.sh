#!/bin/bash

set -e

STACK_NAME=${1:-"inventory-ecs-stack"}
BACKEND_DIR="./backend/ecs"
AWS_ACCOUNT_ID="186019336293"
AWS_REGION="us-east-1"
IMAGE_NAME="inventory-api"
ECR_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_NAME"

echo "=================================================="
echo " Deploying ECS Architecture"
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
echo "Creating ECR repository (if not exists)..."
make create-repo

echo ""
echo "Building Docker image..."
make build

echo ""
echo "Pushing image to ECR..."
make push

echo ""
echo "Deploying CloudFormation stack..."
echo "   (This may take 15-20 minutes due to VPC Link creation)"
echo ""

aws cloudformation deploy \
  --template-file deploy.yaml \
  --stack-name "$STACK_NAME" \
  --parameter-overrides ImageUri="$ECR_REPO:latest" \
  --capabilities CAPABILITY_IAM \
  --no-fail-on-empty-changeset

echo ""
echo "ECS deployment complete!"
echo ""

cd ../..
chmod +x scripts/get-stack-status.sh 2>/dev/null || true
bash scripts/get-stack-status.sh "$STACK_NAME"

API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text 2>/dev/null || echo "")

# Update frontend config if deployed
chmod +x scripts/update-frontend-config.sh 2>/dev/null || true
bash scripts/update-frontend-config.sh 2>/dev/null || true

echo "Note: ECS tasks may take 2-3 minutes to become healthy"
echo ""
if [ -n "$API_URL" ]; then
  echo "Test with:"
  echo "  curl $API_URL/health"
fi
