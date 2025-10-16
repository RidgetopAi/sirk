/**
 * SIRK Metrics Collection Script
 *
 * Purpose: Collect objective, measurable data about the codebase
 * Run after every iteration to track progress
 *
 * Usage: npx tsx scripts/collect-metrics.ts
 * Output: metrics/instance_[N]_[timestamp].json
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as readline from 'readline';

interface Metrics {
  iteration: number;
  instance: string;
  timestamp: string;
  date: string;

  // Code Quality
  loc: {
    total: number;
    src: number;
    scripts: number;
    tests: number;
  };

  files: {
    total: number;
    typescript: number;
    javascript: number;
    markdown: number;
  };

  // Build & Type Safety
  typescript_errors: number;
  build_success: boolean;
  build_time_ms: number | null;

  // Testing
  tests: {
    total: number;
    passing: number;
    failing: number;
    coverage_percent: number | null;
  };

  // Git Statistics
  git: {
    commits: number;
    files_changed_this_iteration: number;
    lines_added_this_iteration: number;
    lines_deleted_this_iteration: number;
  };

  // Deployment
  deployment_url: string | null;

  // Performance (if applicable)
  bundle_size_kb: number | null;
  lighthouse_score: number | null;

  // Instance 22: Outcome-Oriented Metrics (Minimal Validation Set)
  // Testing Instance 21's hypothesis: Do these distinguish gold standards?
  exploration_time_minutes?: number;
  verification_completeness?: {
    tests_ran: boolean;
    typecheck_ran: boolean;
    build_ran: boolean;
    browser_verified: boolean;
    deployment_verified: boolean;
    edge_cases_tested: boolean;
    git_push_verified: boolean;
  };
  fix_type?: 'symptom_fix' | 'root_cause_fix' | 'systemic_fix' | 'defense_in_depth' | 'none';
  blind_spot_prediction?: string;
}

/**
 * Count lines of code in a directory
 */
function countLOC(dir: string, extensions: string[]): number {
  try {
    const find = extensions.map(ext => `-name "*.${ext}"`).join(' -o ');
    // Exclude node_modules, dist, and .git directories
    const cmd = `find ${dir} \\( ${find} \\) ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.git/*" -exec wc -l {} + | tail -1 | awk '{print $1}'`;
    const result = execSync(cmd, { encoding: 'utf-8' }).trim();
    return parseInt(result) || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Count files by type
 */
function countFiles(dir: string, extension: string): number {
  try {
    // Exclude node_modules, dist, and .git directories
    const cmd = `find ${dir} -name "*.${extension}" ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.git/*" | wc -l`;
    const result = execSync(cmd, { encoding: 'utf-8' }).trim();
    return parseInt(result) || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Check TypeScript compilation
 */
function checkTypeScript(): number {
  try {
    // Try to run tsc if tsconfig exists
    if (fs.existsSync('tsconfig.json')) {
      execSync('npx tsc --noEmit', { encoding: 'utf-8' });
      return 0; // No errors
    }
    return -1; // No TypeScript project
  } catch (error: any) {
    // Parse error count from tsc output
    const output = error.stdout || error.stderr || '';
    const match = output.match(/Found (\d+) error/);
    return match ? parseInt(match[1]) : -1;
  }
}

/**
 * Run build and capture metrics
 * Returns bundle size in KB and build time in milliseconds
 */
function runBuildAndCapture(): { success: boolean; bundleSizeKb: number | null; buildTimeMs: number | null } {
  try {
    console.log('Running production build...');
    const output = execSync('npm run build', { encoding: 'utf-8', stdio: 'pipe' });

    // Parse bundle size - find the main index-*.js bundle (largest file)
    let bundleSizeKb: number | null = null;
    const bundleRegex = /dist\/assets\/index-[\w-]+\.js\s+([\d.]+)\s+kB/g;
    let match;
    let maxSize = 0;

    while ((match = bundleRegex.exec(output)) !== null) {
      const size = parseFloat(match[1]);
      if (size > maxSize) {
        maxSize = size;
        bundleSizeKb = size;
      }
    }

    // Parse build time - format: "✓ built in X.XXs"
    let buildTimeMs: number | null = null;
    const timeRegex = /✓ built in ([\d.]+)s/;
    const timeMatch = output.match(timeRegex);
    if (timeMatch) {
      const timeInSeconds = parseFloat(timeMatch[1]);
      buildTimeMs = Math.round(timeInSeconds * 1000); // Convert to milliseconds
    }

    return { success: true, bundleSizeKb, buildTimeMs };
  } catch (error: any) {
    console.error('Build failed:', error.message);
    return { success: false, bundleSizeKb: null, buildTimeMs: null };
  }
}

/**
 * Run tests and capture metrics
 * Returns test counts from vitest output
 */
function runTestsAndCapture(): { total: number; passing: number; failing: number } {
  try {
    console.log('Running tests...');
    const output = execSync('npm test', { encoding: 'utf-8', stdio: 'pipe' });

    // Parse test counts from vitest output
    // Format: "Test Files  X passed (Y)" and "Tests  X passed (Y)"
    let total = 0;
    let passing = 0;

    // Parse total tests: "Tests  19 passed (19)" or "Tests  18 passed, 1 failed (19)"
    const testMatch = output.match(/Tests\s+(\d+)\s+passed(?:,\s+(\d+)\s+failed)?\s+\((\d+)\)/);
    if (testMatch) {
      passing = parseInt(testMatch[1]);
      const failed = testMatch[2] ? parseInt(testMatch[2]) : 0;
      total = parseInt(testMatch[3]);
      const failing = failed;
      
      return { total, passing, failing };
    }

    // Fallback if no tests or unexpected format
    return { total: 0, passing: 0, failing: 0 };
  } catch (error: any) {
    // Tests failed - try to parse from error output
    const output = error.stdout || error.stderr || '';
    const testMatch = output.match(/Tests\s+(\d+)\s+passed(?:,\s+(\d+)\s+failed)?\s+\((\d+)\)/);
    
    if (testMatch) {
      const passing = parseInt(testMatch[1]);
      const failing = testMatch[2] ? parseInt(testMatch[2]) : 0;
      const total = parseInt(testMatch[3]);
      
      return { total, passing, failing };
    }
    
    // If we can't parse, return zeros
    console.warn('Could not parse test output');
    return { total: 0, passing: 0, failing: 0 };
  }
}

/**
 * Check build success (legacy function for backward compatibility)
 */
function checkBuild(): boolean {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    return packageJson.scripts?.build !== undefined;
  } catch (error) {
    return false;
  }
}

/**
 * Get git statistics
 */
function getGitStats(): { commits: number; files: number; added: number; deleted: number } {
  try {
    const commits = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();

    // Get stats for last commit (this iteration)
    const diffStat = execSync('git diff HEAD~1 HEAD --stat', { encoding: 'utf-8' });
    const filesMatch = diffStat.match(/(\d+) files? changed/);
    const addedMatch = diffStat.match(/(\d+) insertions?/);
    const deletedMatch = diffStat.match(/(\d+) deletions?/);

    return {
      commits: parseInt(commits) || 0,
      files: filesMatch ? parseInt(filesMatch[1]) : 0,
      added: addedMatch ? parseInt(addedMatch[1]) : 0,
      deleted: deletedMatch ? parseInt(deletedMatch[1]) : 0,
    };
  } catch (error) {
    return { commits: 0, files: 0, added: 0, deleted: 0 };
  }
}

/**
 * Collect all metrics
 */
async function collectMetrics(instanceNumber: number, instanceName: string): Promise<Metrics> {
  const timestamp = new Date().toISOString();
  const date = new Date().toISOString().split('T')[0];

  console.log('📊 Collecting SIRK metrics...\n');

  // LOC counts
  console.log('Counting lines of code...');
  const loc = {
    total: countLOC('.', ['ts', 'tsx', 'js', 'jsx']),
    src: countLOC('src', ['ts', 'tsx', 'js', 'jsx']),
    scripts: countLOC('scripts', ['ts', 'js']),
    tests: countLOC('.', ['test.ts', 'test.js', 'spec.ts', 'spec.js']),
  };

  // File counts
  console.log('Counting files...');
  const files = {
    total: countFiles('.', '*'),
    typescript: countFiles('.', 'ts') + countFiles('.', 'tsx'),
    javascript: countFiles('.', 'js') + countFiles('.', 'jsx'),
    markdown: countFiles('.', 'md'),
  };

  // TypeScript errors
  console.log('Checking TypeScript...');
  const typescript_errors = checkTypeScript();

  // Build and capture metrics
  console.log('Building and capturing metrics...');
  const buildResult = runBuildAndCapture();

  // Run tests and capture metrics
  console.log('Running tests and capturing metrics...');
  const testResult = runTestsAndCapture();

  // Git stats
  console.log('Getting git statistics...');
  const gitStats = getGitStats();

  const metrics: Metrics = {
    iteration: instanceNumber,
    instance: instanceName,
    timestamp,
    date,
    loc,
    files,
    typescript_errors,
    build_success: buildResult.success,
    build_time_ms: buildResult.buildTimeMs,
    tests: {
      total: testResult.total,
      passing: testResult.passing,
      failing: testResult.failing,
      coverage_percent: null,
    },
    git: {
      commits: gitStats.commits,
      files_changed_this_iteration: gitStats.files,
      lines_added_this_iteration: gitStats.added,
      lines_deleted_this_iteration: gitStats.deleted,
    },
    deployment_url: null, // Instance will add Netlify URL
    bundle_size_kb: buildResult.bundleSizeKb,
    lighthouse_score: null, // Instance will implement Lighthouse check
  };

  return metrics;
}

/**
 * Save metrics to file
 */
function saveMetrics(metrics: Metrics): string {
  const filename = `instance_${metrics.iteration}_${Date.now()}.json`;
  const filepath = path.join('metrics', filename);

  // Ensure metrics directory exists
  if (!fs.existsSync('metrics')) {
    fs.mkdirSync('metrics', { recursive: true });
  }

  fs.writeFileSync(filepath, JSON.stringify(metrics, null, 2));
  console.log(`\n✅ Metrics saved to: ${filepath}`);

  return filepath;
}

/**
 * Prompt for outcome-oriented metrics (Instance 23: Objective measurement)
 *
 * Instance 23 Change: Use automated verification data instead of self-reported prompts
 * Prevents measurement bias and Heisenberg effects
 */
async function promptOutcomeMetrics(
  testResult: { total: number; passing: number; failing: number },
  typescript_errors: number,
  buildResult: { success: boolean; bundleSizeKb: number | null; buildTimeMs: number | null }
): Promise<{
  exploration_time_minutes: number;
  verification_completeness: {
    tests_ran: boolean;
    typecheck_ran: boolean;
    build_ran: boolean;
    browser_verified: boolean;
    deployment_verified: boolean;
    edge_cases_tested: boolean;
    git_push_verified: boolean;
  };
  fix_type: 'symptom_fix' | 'root_cause_fix' | 'systemic_fix' | 'defense_in_depth' | 'none';
  blind_spot_prediction: string;
}> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
  };

  console.log('\n📋 OUTCOME-ORIENTED METRICS (Instance 23: Objective Measurement)\n');
  console.log('Instance 23 Change: Automated verification replaces self-reported prompts\n');

  // Exploration time (still self-reported for now - Phase 2 will objectify this)
  const explorationAnswer = await question('How many minutes did you spend in EXPLORATION/DISCOVERY phase? (e.g., 90): ');
  const exploration_time_minutes = parseInt(explorationAnswer) || 0;

  // Verification completeness - OBJECTIVE DATA (Instance 23 improvement)
  console.log('\n✅ VERIFICATION COMPLETENESS (Automated detection):');

  // Use automated results instead of prompts (prevents bias!)
  const tests_ran = testResult.total > 0;  // If tests ran, total > 0
  const typecheck_ran = typescript_errors !== -1;  // If tsc ran, errors != -1 (-1 = not run)
  const build_ran = buildResult.success !== undefined;  // If build attempted, success is defined

  console.log(`  ✓ Tests ran: ${tests_ran ? 'YES' : 'NO'} (${testResult.passing}/${testResult.total} passing)`);
  console.log(`  ✓ TypeScript checked: ${typecheck_ran ? 'YES' : 'NO'} (${typescript_errors >= 0 ? typescript_errors + ' errors' : 'not run'})`);
  console.log(`  ✓ Build ran: ${build_ran ? 'YES' : 'NO'} (${buildResult.success ? 'success' : 'failed'})`);

  // Manual verification steps (cannot automate in terminal environment)
  console.log('\nManual verification (answer yes/no):');
  const browser_verified = (await question('  Did you open and verify in browser? (yes/no): ')).toLowerCase().startsWith('y');
  const deployment_verified = (await question('  Did you verify deployed site? (yes/no): ')).toLowerCase().startsWith('y');
  const edge_cases_tested = (await question('  Did you test edge cases/error scenarios? (yes/no): ')).toLowerCase().startsWith('y');
  const git_push_verified = (await question('  Did you verify git push succeeded? (yes/no): ')).toLowerCase().startsWith('y');

  // Fix type
  console.log('\n🔧 FIX TYPE (What kind of work did you do?):');
  console.log('  1. symptom_fix - Addressed visible problem only');
  console.log('  2. root_cause_fix - Eliminated source of problem');
  console.log('  3. systemic_fix - Prevented entire class of problems');
  console.log('  4. defense_in_depth - Multiple protective layers');
  console.log('  5. none - No fixes, pure analysis/documentation');
  const fixTypeAnswer = await question('  Enter number (1-5): ');
  const fixTypeMap: Record<string, 'symptom_fix' | 'root_cause_fix' | 'systemic_fix' | 'defense_in_depth' | 'none'> = {
    '1': 'symptom_fix',
    '2': 'root_cause_fix',
    '3': 'systemic_fix',
    '4': 'defense_in_depth',
    '5': 'none'
  };
  const fix_type = fixTypeMap[fixTypeAnswer.trim()] || 'none';

  // Blind spot prediction
  console.log('\n🔮 BLIND SPOT PREDICTION (Epistemic humility):');
  const blind_spot_prediction = await question('  What might Instance 23 see that you can\'t? (1-2 sentences): ');

  rl.close();

  return {
    exploration_time_minutes,
    verification_completeness: {
      tests_ran,
      typecheck_ran,
      build_ran,
      browser_verified,
      deployment_verified,
      edge_cases_tested,
      git_push_verified
    },
    fix_type,
    blind_spot_prediction: blind_spot_prediction.trim()
  };
}

/**
 * Display metrics summary
 */
function displaySummary(metrics: Metrics): void {
  console.log('\n📈 SIRK Metrics Summary\n');
  console.log('═══════════════════════════════════════');
  console.log(`Instance:          ${metrics.instance}`);
  console.log(`Iteration:         ${metrics.iteration}`);
  console.log(`Date:              ${metrics.date}`);
  console.log('═══════════════════════════════════════');
  console.log('\n📝 Code Quality:');
  console.log(`  Total LOC:       ${metrics.loc.total}`);
  console.log(`  Source LOC:      ${metrics.loc.src}`);
  console.log(`  Script LOC:      ${metrics.loc.scripts}`);
  console.log(`  Test LOC:        ${metrics.loc.tests}`);
  console.log('\n📁 Files:');
  console.log(`  TypeScript:      ${metrics.files.typescript}`);
  console.log(`  JavaScript:      ${metrics.files.javascript}`);
  console.log(`  Markdown:        ${metrics.files.markdown}`);
  console.log('\n🔧 Build:');
  console.log(`  TS Errors:       ${metrics.typescript_errors >= 0 ? metrics.typescript_errors : 'N/A'}`);
  console.log(`  Build Success:   ${metrics.build_success ? '✅' : '⏳'}`);
  console.log('\n📊 Git:');
  console.log(`  Total Commits:   ${metrics.git.commits}`);
  console.log(`  Files Changed:   ${metrics.git.files_changed_this_iteration}`);
  console.log(`  Lines Added:     ${metrics.git.lines_added_this_iteration}`);
  console.log(`  Lines Deleted:   ${metrics.git.lines_deleted_this_iteration}`);
  console.log('═══════════════════════════════════════\n');
}

/**
 * Main execution
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  // Require instance number argument (root cause fix - don't default to 0)
  if (!args[0]) {
    console.error('\n❌ ERROR: Instance number required.\n');
    console.error('Usage:');
    console.error('  npx tsx scripts/collect-metrics.ts <instance_number> <instance_name>');
    console.error('\nExample:');
    console.error('  npx tsx scripts/collect-metrics.ts 20 "Instance 20"\n');
    process.exit(1);
  }

  const instanceNumber = parseInt(args[0]);
  const instanceName = args[1] || `Instance ${instanceNumber}`;

  // Validate instanceNumber (prevent Instance 0 creation except baseline)
  if (instanceNumber === 0 || isNaN(instanceNumber)) {
    console.error('\n❌ ERROR: Instance 0 is reserved for baseline metrics only.\n');
    console.error('Usage:');
    console.error('  npx tsx scripts/collect-metrics.ts <instance_number> <instance_name>');
    console.error('\nExample:');
    console.error('  npx tsx scripts/collect-metrics.ts 20 "Instance 20"\n');
    process.exit(1);
  }

  console.log('🔬 SIRK Metrics Collection\n');
  console.log(`Instance: ${instanceName}`);
  console.log(`Iteration: ${instanceNumber}\n`);

  try {
    const metrics = await collectMetrics(instanceNumber, instanceName);

    // Instance 23: Pass automated data to prevent self-reported bias
    const testResult = {
      total: metrics.tests.total,
      passing: metrics.tests.passing,
      failing: metrics.tests.failing
    };
    const buildResult = {
      success: metrics.build_success,
      bundleSizeKb: metrics.bundle_size_kb,
      buildTimeMs: metrics.build_time_ms
    };

    const outcomeMetrics = await promptOutcomeMetrics(testResult, metrics.typescript_errors, buildResult);
    const metricsWithOutcome = {
      ...metrics,
      ...outcomeMetrics
    };

    const filepath = saveMetrics(metricsWithOutcome);
    displaySummary(metricsWithOutcome);

    console.log('✨ Metrics collection complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error collecting metrics:', error);
    process.exit(1);
  }
}

export { collectMetrics, Metrics };

// Run if executed directly (ES module compatible check)
main();
