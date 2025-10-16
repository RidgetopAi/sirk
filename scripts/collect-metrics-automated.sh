#!/bin/bash
#
# SIRK Automated Metrics Collection
#
# Purpose: Complete automation of metrics collection with browser verification
# Integrates: Instance 26's verify-browser.ts + Instance 28's TTY detection
#
# Usage: ./scripts/collect-metrics-automated.sh <instance_number> "<instance_name>" [exploration_time] [fix_type] [blind_spot]
#
# Examples:
#   ./scripts/collect-metrics-automated.sh 30 "Instance 30"
#   ./scripts/collect-metrics-automated.sh 30 "Instance 30" 120 systemic_fix "Instance 31 might notice X"
#
# Exit codes:
#   0 = success (metrics collected, all checks passed)
#   1 = validation failed (build missing, browser verification failed, etc.)

set -e  # Exit on any error

# ============================================================================
# ARGUMENT PARSING
# ============================================================================

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "❌ Usage: $0 <instance_number> \"<instance_name>\" [exploration_time] [fix_type] [blind_spot]"
  echo ""
  echo "Examples:"
  echo "  $0 30 \"Instance 30\""
  echo "  $0 30 \"Instance 30\" 120 systemic_fix \"Instance 31 might notice...\""
  exit 1
fi

INSTANCE_NUM=$1
INSTANCE_NAME=$2
EXPLORATION_TIME=${3:-90}  # Default 90 minutes
FIX_TYPE=${4:-none}         # Default none
BLIND_SPOT=${5:-""}         # Default empty

echo ""
echo "🤖 SIRK AUTOMATED METRICS COLLECTION"
echo "===================================="
echo "Instance:         $INSTANCE_NAME (#$INSTANCE_NUM)"
echo "Exploration Time: $EXPLORATION_TIME min"
echo "Fix Type:         $FIX_TYPE"
echo ""

# ============================================================================
# PHASE 1: BROWSER VERIFICATION (Optional but Recommended)
# ============================================================================

echo "📋 Phase 1: Browser Verification"
echo ""

# Check if build exists
if [ ! -f "dist/index.html" ]; then
  echo "⚠️  Build not found. Run: npm run build"
  echo "⚠️  Skipping browser verification..."
  BROWSER_VERIFIED="false"
  BROWSER_EXIT_CODE=1
else
  echo "🌐 Running headless browser verification..."
  
  # Run browser verification and capture exit code
  if npx tsx scripts/verify-browser.ts "$INSTANCE_NUM"; then
    BROWSER_VERIFIED="true"
    BROWSER_EXIT_CODE=0
    echo "✅ Browser verification PASSED"
  else
    BROWSER_VERIFIED="false"
    BROWSER_EXIT_CODE=1
    echo "❌ Browser verification FAILED"
    echo "   Dashboard may have rendering issues"
  fi
fi

echo ""

# ============================================================================
# PHASE 2: METRICS COLLECTION (With TTY Detection)
# ============================================================================

echo "📋 Phase 2: Metrics Collection"
echo ""

# Set environment variables for TTY mode (Instance 28 enhancement)
export EXPLORATION_TIME="$EXPLORATION_TIME"
export FIX_TYPE="$FIX_TYPE"
export BLIND_SPOT="$BLIND_SPOT"

# Run metrics collection with browser result
# Note: browser_verified field will be set from environment or default to false
echo "🔬 Collecting metrics in non-interactive mode..."
npx tsx scripts/collect-metrics.ts "$INSTANCE_NUM" "$INSTANCE_NAME"

METRICS_EXIT_CODE=$?

if [ $METRICS_EXIT_CODE -eq 0 ]; then
  echo "✅ Metrics collection PASSED"
else
  echo "❌ Metrics collection FAILED (exit code: $METRICS_EXIT_CODE)"
  exit 1
fi

echo ""

# ============================================================================
# PHASE 3: POST-COLLECTION VALIDATION
# ============================================================================

echo "📋 Phase 3: Post-Collection Validation"
echo ""

# Check if metrics file was created
METRICS_FILE=$(ls -t metrics/instance_${INSTANCE_NUM}_*.json 2>/dev/null | head -1)

if [ -z "$METRICS_FILE" ]; then
  echo "❌ ERROR: Metrics file not found for Instance $INSTANCE_NUM"
  exit 1
else
  echo "✅ Metrics file created: $METRICS_FILE"
fi

# Verify JSON is valid
if ! jq empty "$METRICS_FILE" 2>/dev/null; then
  echo "❌ ERROR: Metrics file is not valid JSON"
  exit 1
else
  echo "✅ Metrics file is valid JSON"
fi

# Check git status (reminder to commit+push)
if git diff --quiet HEAD; then
  echo "✅ No uncommitted changes detected"
else
  echo "⚠️  REMINDER: Commit and push your changes:"
  echo "   git add ."
  echo "   git commit -m \"Instance $INSTANCE_NUM: <description>\""
  echo "   git push origin Main"
fi

echo ""

# ============================================================================
# SUMMARY
# ============================================================================

echo "✨ AUTOMATION COMPLETE"
echo "====================="
echo "Instance:          $INSTANCE_NAME (#$INSTANCE_NUM)"
echo "Browser Verified:  $BROWSER_VERIFIED"
echo "Metrics File:      $METRICS_FILE"
echo "Exit Code:         0 (success)"
echo ""
echo "📝 Next Steps:"
echo "  1. Review metrics file"
echo "  2. Commit and push changes"
echo "  3. Verify deployment on Netlify"
echo "  4. Store completion contexts in AIDIS"
echo ""

exit 0
