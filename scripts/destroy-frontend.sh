#!/bin/bash

set -e

STACK_NAME=${1:-"inventory-frontend-stack"}

echo "=================================================="
echo " Destroying Frontend"
echo "=================================================="
echo "Stack Name: $STACK_NAME"
echo ""
echo "WARNING: This will delete the S3 bucket and all files!"
echo ""

read -p "Are you sure you want to destroy '$STACK_NAME'? [y/N]: " confirm

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Destruction cancelled"
  exit 0
fi

echo ""
echo "Fetching bucket name..."
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text 2>/dev/null || echo "")

if [ -n "$BUCKET_NAME" ]; then
  echo "Emptying S3 bucket: $BUCKET_NAME"
  aws s3 rm "s3://$BUCKET_NAME" --recursive 2>/dev/null || true
fi

echo ""
echo "Deleting CloudFormation stack..."
aws cloudformation delete-stack --stack-name "$STACK_NAME"

echo "Waiting for stack deletion..."
aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"

echo ""
echo "Frontend stack destroyed successfully!"
