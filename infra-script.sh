#!/bin/bash

set -e

ACTION=$1
TARGET=$2

LAMBDA_STACK="inventory-lambda-stack"
ECS_STACK="inventory-ecs-stack"

print_help() {
  echo "=================================================="
  echo " Infrastructure Management Script"
  echo "=================================================="
  echo ""
  echo "Usage:"
  echo "  ./infra-script.sh deploy <target>"
  echo "  ./infra-script.sh destroy <target>"
  echo "  ./infra-script.sh test <target>"
  echo "  ./infra-script.sh --help"
  echo ""
  echo "Targets:"
  echo "  lambda    - Lambda architecture only"
  echo "  ecs       - ECS architecture only"
  echo "  all       - Both architectures"
  echo ""
  echo "Examples:"
  echo "  ./infra-script.sh deploy lambda"
  echo "  ./infra-script.sh deploy ecs"
  echo "  ./infra-script.sh deploy all"
  echo "  ./infra-script.sh test lambda"
  echo "  ./infra-script.sh destroy all"
  echo ""
}

if [ "$ACTION" == "--help" ] || [ -z "$ACTION" ]; then
  print_help
  exit 0
fi

if [ -z "$TARGET" ]; then
  echo "Error: Missing target"
  echo ""
  print_help
  exit 1
fi

make_executable() {
  chmod +x scripts/deploy-lambda.sh 2>/dev/null || true
  chmod +x scripts/deploy-ecs.sh 2>/dev/null || true
  chmod +x scripts/test-lambda.sh 2>/dev/null || true
  chmod +x scripts/test-ecs.sh 2>/dev/null || true
  chmod +x scripts/destroy-lambda.sh 2>/dev/null || true
  chmod +x scripts/destroy-ecs.sh 2>/dev/null || true
  chmod +x test_api.sh 2>/dev/null || true
}

make_executable

case "$ACTION" in
  deploy)
    case "$TARGET" in
      lambda)
        ./scripts/deploy-lambda.sh "$LAMBDA_STACK"
        ;;
      ecs)
        ./scripts/deploy-ecs.sh "$ECS_STACK"
        ;;
      all)
        echo "Deploying both architectures..."
        echo ""
        ./scripts/deploy-lambda.sh "$LAMBDA_STACK"
        echo ""
        echo "=================================================="
        echo ""
        ./scripts/deploy-ecs.sh "$ECS_STACK"
        echo ""
        echo "All deployments complete!"
        ;;
      *)
        echo "Invalid target: $TARGET"
        print_help
        exit 1
        ;;
    esac
    ;;

  test)
    case "$TARGET" in
      lambda)
        ./scripts/test-lambda.sh "$LAMBDA_STACK"
        ;;
      ecs)
        ./scripts/test-ecs.sh "$ECS_STACK"
        ;;
      all)
        echo "Testing both architectures..."
        echo ""
        ./scripts/test-lambda.sh "$LAMBDA_STACK"
        echo ""
        echo "=================================================="
        echo ""
        ./scripts/test-ecs.sh "$ECS_STACK"
        echo ""
        echo "All tests complete!"
        ;;
      *)
        echo "Invalid target: $TARGET"
        print_help
        exit 1
        ;;
    esac
    ;;

  destroy)
    case "$TARGET" in
      lambda)
        ./scripts/destroy-lambda.sh "$LAMBDA_STACK"
        ;;
      ecs)
        ./scripts/destroy-ecs.sh "$ECS_STACK"
        ;;
      all)
        echo "Destroying both architectures..."
        echo ""
        echo "Destroying in reverse order (ECS first, then Lambda)..."
        echo ""
        ./scripts/destroy-ecs.sh "$ECS_STACK"
        echo ""
        echo "=================================================="
        echo ""
        ./scripts/destroy-lambda.sh "$LAMBDA_STACK"
        echo ""
        echo "All resources destroyed!"
        ;;
      *)
        echo "Invalid target: $TARGET"
        print_help
        exit 1
        ;;
    esac
    ;;

  *)
    echo "Invalid action: $ACTION"
    echo ""
    print_help
    exit 1
    ;;
esac
