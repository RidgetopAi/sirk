/**
 * SIRK Metrics Validator - External Validation Gate
 *
 * Purpose: Verify metrics file exists for given instance
 * Exit codes: 0 = valid, 1 = invalid/missing
 * 
 * Instance 26: External validation layer to harden enforcement
 * Solves: Instance 25 ignored internal enforcement errors
 * Solution: External validator exit code = single source of truth for CI/orchestrator
 *
 * Usage:
 *   npx tsx scripts/validate-metrics.ts <instance_number>
 *   echo $?  # Check exit code: 0 = success, 1 = failure
 */

import * as fs from 'fs';
import * as path from 'path';

function validateMetrics(instanceNumber: number): boolean {
  try {
    // Check if metrics directory exists
    if (!fs.existsSync('metrics')) {
      console.error('❌ VALIDATION FAILED: metrics/ directory not found');
      return false;
    }

    // Look for metrics file matching pattern: instance_N_*.json
    const metricsFiles = fs.readdirSync('metrics').filter(file =>
      file.match(new RegExp(`^instance_${instanceNumber}_\\d+\\.json$`))
    );

    if (metricsFiles.length === 0) {
      console.error(`\n❌ VALIDATION FAILED: No metrics file found for Instance ${instanceNumber}`);
      console.error(`   Expected pattern: metrics/instance_${instanceNumber}_*.json`);
      console.error(`   This indicates metrics collection did not complete successfully.`);
      console.error(`\n   Possible causes:`);
      console.error(`   - Metrics collection script did not run`);
      console.error(`   - Collection script exited with error before saving`);
      console.error(`   - Infrastructure Builder's Blind Spot (built but didn't use)`);
      console.error(`\n   Fix: Run metrics collection for Instance ${instanceNumber}:`);
      console.error(`   npx tsx scripts/collect-metrics.ts ${instanceNumber} "Instance ${instanceNumber}"\n`);
      return false;
    }

    // Success: metrics file(s) found
    const metricsFile = metricsFiles[0];
    const filepath = path.join('metrics', metricsFile);
    const stats = fs.statSync(filepath);
    const fileSize = stats.size;

    console.log(`\n✅ VALIDATION PASSED: Instance ${instanceNumber} metrics verified`);
    console.log(`   File: ${metricsFile}`);
    console.log(`   Size: ${fileSize} bytes`);
    console.log(`   Date: ${stats.mtime.toISOString()}`);
    
    // Multiple files warning (shouldn't happen but worth noting)
    if (metricsFiles.length > 1) {
      console.warn(`\n⚠️  WARNING: Multiple metrics files found for Instance ${instanceNumber}:`);
      metricsFiles.forEach(file => console.warn(`   - ${file}`));
      console.warn(`   Using: ${metricsFile} (first match)\n`);
    }

    return true;
  } catch (error) {
    console.error(`\n❌ VALIDATION ERROR: ${error}`);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);

  // Validate arguments
  if (!args[0]) {
    console.error('\n❌ ERROR: Instance number required.\n');
    console.error('Usage:');
    console.error('  npx tsx scripts/validate-metrics.ts <instance_number>');
    console.error('\nExample:');
    console.error('  npx tsx scripts/validate-metrics.ts 26');
    console.error('  echo $?  # Check exit code: 0 = valid, 1 = invalid\n');
    process.exit(1);
  }

  const instanceNumber = parseInt(args[0]);
  
  if (isNaN(instanceNumber) || instanceNumber < 0) {
    console.error(`\n❌ ERROR: Invalid instance number: ${args[0]}\n`);
    console.error('Instance number must be a non-negative integer.\n');
    process.exit(1);
  }

  // Run validation
  const isValid = validateMetrics(instanceNumber);
  
  // Exit with appropriate code (0 = success, 1 = failure)
  process.exit(isValid ? 0 : 1);
}

// Run if executed directly
main();
