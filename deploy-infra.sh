#!/bin/bash

STACK_NAME=$1
ACTION=$2

BACKEND_DIR="./backend/lambda-sam"
TEMPLATE_FILE="$BACKEND_DIR/template.yaml"

print_help() {
  echo "Usage:"
  echo "  ./infra-script.sh <stack-name> --deploy"
  echo "  ./infra-script.sh <stack-name> --destroy"
  echo "  ./infra-script.sh <stack-name> --test"
  echo "  ./infra-script.sh --help"
  echo ""
  echo "Options:"
  echo "  --deploy    Deploy the SAM stack"
  echo "  --destroy   Delete the SAM stack"
  echo "  --test      Run API tests for the stack"
  echo "  --help      Show this help message"
}

# Global help
if [ "$STACK_NAME" == "--help" ] || [ "$1" == "--help" ]; then
  print_help
  exit 0
fi

# Validate input
if [ -z "$STACK_NAME" ] || [ -z "$ACTION" ]; then
  echo "Error: Missing arguments"
  echo ""
  print_help
  exit 1
fi

confirm_action() {
  echo "You are about to $1 stack: $STACK_NAME"
  read -p "Are you sure? [y/N]: " confirm

  case "$confirm" in
    y|Y|yes|YES)
      return 0
      ;;
    *)
      echo "Operation cancelled"
      exit 0
      ;;
  esac
}

deploy_stack() {
  echo "Deploying stack: $STACK_NAME"

  cd "$BACKEND_DIR" || {
    echo "Backend directory not found: $BACKEND_DIR"
    exit 1
  }

  sam build --template-file "$TEMPLATE_FILE"

  sam deploy \
    --template-file "$TEMPLATE_FILE" \
    --stack-name "$STACK_NAME" \
    --capabilities CAPABILITY_IAM \
    --no-confirm-changeset \
    --no-fail-on-empty-changeset

  echo "Deployment finished"
}

destroy_stack() {
  echo "Destroying stack: $STACK_NAME"

  sam delete \
    --stack-name "$STACK_NAME"

  echo "Stack deleted"
}

run_tests() {
  echo "Running tests for stack: $STACK_NAME"

  if [ ! -f "./test_api.sh" ]; then
    echo "Error: test_api.sh not found"
    exit 1
  fi

  chmod +x ./test_api.sh
  ./test_api.sh "$STACK_NAME"
}

case "$ACTION" in
  --deploy)
    confirm_action "deploy"
    deploy_stack
    ;;

  --destroy)
    confirm_action "destroy"
    destroy_stack
    ;;

  --test)
    run_tests
    ;;

  *)
    echo "Invalid option: $ACTION"
    echo ""
    print_help
    exit 1
    ;;
esac
