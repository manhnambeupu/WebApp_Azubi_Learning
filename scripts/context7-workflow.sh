#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Context7 workflow helper

Usage:
  ./scripts/context7-workflow.sh setup
  ./scripts/context7-workflow.sh library <library-name> <query...>
  ./scripts/context7-workflow.sh docs <library-id> <query...>
  ./scripts/context7-workflow.sh audit <library-id> <current-version> <target-version>

Examples:
  ./scripts/context7-workflow.sh library next.js "middleware auth for Next.js 14"
  ./scripts/context7-workflow.sh docs /vercel/next.js "cookies API in route handlers"
  ./scripts/context7-workflow.sh audit /vercel/next.js 14 15
EOF
}

run_ctx7() {
  npx --yes ctx7 "$@"
}

command="${1:-help}"
shift || true

case "$command" in
  setup)
    run_ctx7 setup --claude
    ;;
  library)
    if [ "$#" -lt 2 ]; then
      usage
      exit 1
    fi
    library_name="$1"
    shift
    run_ctx7 library "$library_name" "$*"
    ;;
  docs)
    if [ "$#" -lt 2 ]; then
      usage
      exit 1
    fi
    library_id="$1"
    shift
    run_ctx7 docs "$library_id" "$*"
    ;;
  audit)
    if [ "$#" -ne 3 ]; then
      usage
      exit 1
    fi
    library_id="$1"
    current_version="$2"
    target_version="$3"
    run_ctx7 docs "$library_id" "Upgrade review from ${current_version} to ${target_version}. Return: (1) breaking changes, (2) peer dependencies and version ranges, (3) runtime/engine constraints, (4) migration steps, (5) compatibility risks with common ecosystem packages."
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac
