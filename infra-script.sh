#!/bin/bash

set -e

ACTION=$1
TARGET=$2

LAMBDA_STACK="inventory-lambda-stack"
ECS_STACK="inventory-ecs-stack"
FRONTEND_STACK="inventory-frontend-stack"

print_help() {
  echo "=================================================="
  echo " Infrastructure Management Script"
  echo "=================================================="
  echo ""
  echo "Usage:"
  echo "  ./infra-script.sh deploy <target>"
  echo "  ./infra-script.sh destroy <target>"
  echo "  ./infra-script.sh test <target>"
  echo "  ./infra-script.sh status <target>"
  echo "  ./infra-script.sh --help"
  echo ""
  echo "Targets:"
  echo "  lambda    - Lambda architecture only"
  echo "  ecs       - ECS architecture only"
  echo "  frontend  - Frontend static website"
  echo "  all       - Both architectures (backend only)"
  echo ""
  echo "Examples:"
  echo "  ./infra-script.sh deploy lambda"
  echo "  ./infra-script.sh deploy ecs"
  echo "  ./infra-script.sh deploy frontend"
  echo "  ./infra-script.sh deploy all"
  echo "  ./infra-script.sh destroy frontend"
  echo "  ./infra-script.sh destroy all"
  echo "  ./infra-script.sh test lambda"
  echo "  ./infra-script.sh test frontend"
  echo "  ./infra-script.sh status all"
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
  chmod +x scripts/deploy/deploy-lambda.sh 2>/dev/null || true
  chmod +x scripts/deploy/deploy-ecs.sh 2>/dev/null || true
  chmod +x scripts/deploy/deploy-frontend.sh 2>/dev/null || true
  chmod +x scripts/test/test-lambda.sh 2>/dev/null || true
  chmod +x scripts/test/test-ecs.sh 2>/dev/null || true
  chmod +x scripts/test/test-frontend.sh 2>/dev/null || true
  chmod +x scripts/test/test-api.sh 2>/dev/null || true
  chmod +x scripts/destroy/destroy-lambda.sh 2>/dev/null || true
  chmod +x scripts/destroy/destroy-ecs.sh 2>/dev/null || true
  chmod +x scripts/destroy/destroy-frontend.sh 2>/dev/null || true
  chmod +x scripts/update-frontend-config.sh 2>/dev/null || true
  chmod +x scripts/status/status-lambda.sh 2>/dev/null || true
  chmod +x scripts/status/status-ecs.sh 2>/dev/null || true
  chmod +x scripts/status/status-frontend.sh 2>/dev/null || true
  chmod +x scripts/status/get-stack-status.sh 2>/dev/null || true
}

make_executable

case "$ACTION" in
  deploy)
    case "$TARGET" in
      lambda)
        ./scripts/deploy/deploy-lambda.sh "$LAMBDA_STACK"
        ;;
      ecs)
        ./scripts/deploy/deploy-ecs.sh "$ECS_STACK"
        ;;
      frontend)
        ./scripts/deploy/deploy-frontend.sh "$FRONTEND_STACK"
        ;;
      all)
        echo "Deploying both architectures + frontend..."
        echo ""
        echo "Deploying in order (Frontend -> Lambda -> ECS)..."
        echo ""
        ./scripts/deploy/deploy-frontend.sh "$FRONTEND_STACK"
        echo ""
        echo "=================================================="
        echo ""
        ./scripts/deploy/deploy-lambda.sh "$LAMBDA_STACK"
        echo ""
        echo "=================================================="
        echo ""
        ./scripts/deploy/deploy-ecs.sh "$ECS_STACK"
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

  destroy)
    case "$TARGET" in
      lambda)
        ./scripts/destroy/destroy-lambda.sh "$LAMBDA_STACK"
        ;;
      ecs)
        ./scripts/destroy/destroy-ecs.sh "$ECS_STACK"
        ;;
      frontend)
        ./scripts/destroy/destroy-frontend.sh "$FRONTEND_STACK"
        ;;
      all)
        echo "Destroying both architectures + frontend..."
        echo ""
        echo "Destroying in reverse order (ECS -> Lambda -> Frontend)..."
        echo ""
        ./scripts/destroy/destroy-ecs.sh "$ECS_STACK"
        echo ""
        echo "=================================================="
        echo ""
        ./scripts/destroy/destroy-lambda.sh "$LAMBDA_STACK"
        echo ""
        echo "=================================================="
        echo ""
        ./scripts/destroy/destroy-frontend.sh "$FRONTEND_STACK"
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

  test)
    case "$TARGET" in
      lambda)
        ./scripts/test/test-lambda.sh "$LAMBDA_STACK"
        ;;
      ecs)
        ./scripts/test/test-ecs.sh "$ECS_STACK"
        ;;
      frontend)
        ./scripts/test/test-frontend.sh "$FRONTEND_STACK"
        ;;
      all)
        echo "Testing both architectures + frontend..."
        echo ""
        ./scripts/test/test-lambda.sh "$LAMBDA_STACK"
        echo ""
        echo "=================================================="
        echo ""
        ./scripts/test/test-ecs.sh "$ECS_STACK"
        echo ""
        echo "=================================================="
        echo ""
        ./scripts/test/test-frontend.sh "$FRONTEND_STACK"
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

  status)
    case "$TARGET" in
      lambda)
        ./scripts/status/status-lambda.sh "$LAMBDA_STACK"
        ;;
      ecs)
        ./scripts/status/status-ecs.sh "$ECS_STACK"
        ;;
      frontend)
        ./scripts/status/status-frontend.sh "$FRONTEND_STACK"
        ;;
      all)
        echo "Checking all stacks status..."
        echo ""
        ./scripts/status/status-lambda.sh "$LAMBDA_STACK"
        ./scripts/status/status-ecs.sh "$ECS_STACK"
        ./scripts/status/status-frontend.sh "$FRONTEND_STACK"
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
