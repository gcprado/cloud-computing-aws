#!/bin/bash

set -e

STACK_NAME=${1:-"inventory-lambda-stack"}

echo "=================================================="
echo " Destroying Lambda Architecture"
echo "=================================================="
echo "Stack Name: $STACK_NAME"
echo ""
echo "WARNING: This will delete all resources!"
echo ""

read -p "Are you sure you want to destroy '$STACK_NAME'? [y/N]: " confirm

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Destruction cancelled"
  exit 0
fi

echo ""
echo "Deleting CloudFormation stack..."

aws cloudformation delete-stack --stack-name "$STACK_NAME"

echo "Waiting for stack deletion..."
aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"

echo ""
echo "Lambda stack destroyed successfully!"
