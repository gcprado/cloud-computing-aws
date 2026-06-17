#!/bin/bash

set -e

STACK_NAME=${1:-"inventory-ecs-stack"}

echo "=================================================="
echo " Destroying ECS Architecture"
echo "=================================================="
echo "Stack Name: $STACK_NAME"
echo ""
echo "WARNING: This will delete all resources related to the stack!"
echo ""

read -p "Are you sure you want to destroy '$STACK_NAME'? [y/N]: " confirm

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Destruction cancelled"
  exit 0
fi

echo ""
echo "Deleting CloudFormation stack..."
echo "   (This may take 10-15 minutes)"
echo ""

aws cloudformation delete-stack --stack-name "$STACK_NAME"

echo "Waiting for stack deletion..."
aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"

echo ""
echo "ECS stack destroyed successfully!"
echo ""
echo "Note: ECR repository and images are not deleted automatically."
echo "To clean up ECR:"
echo "  aws ecr delete-repository --repository-name inventory-api --force --region us-east-1"
