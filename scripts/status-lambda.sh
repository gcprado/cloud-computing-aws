#!/bin/bash

STACK_NAME=${1:-"inventory-lambda-stack"}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$SCRIPT_DIR/get-stack-status.sh" "$STACK_NAME" "lambda"
