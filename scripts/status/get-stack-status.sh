#!/bin/bash

STACK_NAME=$1
STACK_TYPE=$2

if [ -z "$STACK_NAME" ]; then
  echo "Error: Stack name required"
  exit 1
fi

check_stack_exists() {
  aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].StackStatus" \
    --output text 2>/dev/null
}

get_stack_outputs() {
  aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs" \
    --output json 2>/dev/null
}

STACK_STATUS=$(check_stack_exists)

if [ -z "$STACK_STATUS" ]; then
  echo "=================================================="
  echo " ❌ Stack: $STACK_NAME"
  echo "=================================================="
  echo "Status: NOT DEPLOYED"
  echo ""
  exit 0
fi

echo "=================================================="
echo " ✅ Stack: $STACK_NAME"
echo "=================================================="
echo "Status: $STACK_STATUS"
echo ""

OUTPUTS=$(get_stack_outputs)

if [ -n "$OUTPUTS" ] && [ "$OUTPUTS" != "null" ]; then
  echo "Outputs:"
  
  API_URL=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="ApiUrl") | .OutputValue' 2>/dev/null)
  WEBSITE_URL=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="WebsiteURL") | .OutputValue' 2>/dev/null)
  BUCKET_NAME=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="BucketName") | .OutputValue' 2>/dev/null)
  TABLE_NAME=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="TableName") | .OutputValue' 2>/dev/null)
  CLUSTER_NAME=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="ClusterName") | .OutputValue' 2>/dev/null)
  
  [ -n "$API_URL" ] && [ "$API_URL" != "null" ] && echo "  API URL: $API_URL"
  [ -n "$WEBSITE_URL" ] && [ "$WEBSITE_URL" != "null" ] && echo "  Website URL: $WEBSITE_URL"
  [ -n "$BUCKET_NAME" ] && [ "$BUCKET_NAME" != "null" ] && echo "  S3 Bucket: $BUCKET_NAME"
  [ -n "$TABLE_NAME" ] && [ "$TABLE_NAME" != "null" ] && echo "  DynamoDB Table: $TABLE_NAME"
  [ -n "$CLUSTER_NAME" ] && [ "$CLUSTER_NAME" != "null" ] && echo "  ECS Cluster: $CLUSTER_NAME"
  
  echo ""
else
  echo "No outputs available"
  echo ""
fi
