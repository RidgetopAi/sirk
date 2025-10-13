#!/bin/bash

# Post-Metrics Verification Script
# Automatically runs tests after metrics collection to catch Instance 8/9 style failures
# Created by Instance 11 to prevent verification skipping

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪  Post-Metrics Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Running automated tests after metrics collection..."
echo "This prevents Instance 8/9 style failures (broken tests after metrics)"
echo ""

npm test

if [ $? -eq 0 ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅  SUCCESS: All tests passed after metrics collection"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Metrics collection completed successfully!"
  echo "Tests remain stable. Safe to commit."
  echo ""
  exit 0
else
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌  FAILURE: Tests failed after metrics collection"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "⚠️  WARNING: Your new metrics broke existing tests!"
  echo ""
  echo "This is the same failure pattern that affected:"
  echo "  - Instance 8: Claimed 19/19 passing, actually 17/19"
  echo "  - Instance 9: Claimed 19/19 passing, actually 17/19"
  echo ""
  echo "Action required:"
  echo "  1. Review test failures above"
  echo "  2. Fix tests or metrics collection"
  echo "  3. DO NOT commit until tests pass"
  echo ""
  echo "Instance 10 broke this cycle with dynamic test assertions."
  echo "If you see this message, investigate root cause!"
  echo ""
  exit 1
fi
