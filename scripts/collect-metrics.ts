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
}

/**
 * Count lines of code in a directory
 */
function countLOC(dir: string, extensions: string[]): number {
  try {
    const find = extensions.map(ext => `-name "*.${ext}"`).join(' -o ');
    const cmd = `find ${dir} \\( ${find} \\) -exec wc -l {} + | tail -1 | awk '{print $1}'`;
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
    const cmd = `find ${dir} -name "*.${extension}" | wc -l`;
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
 * Check build success
 */
function checkBuild(): boolean {
  try {
    // Instance 1 will implement actual build command
    // For now, check if build script exists
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

  // Build check
  console.log('Checking build...');
  const build_success = checkBuild();

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
    build_success,
    tests: {
      total: 0, // Instance will implement test collection
      passing: 0,
      failing: 0,
      coverage_percent: null,
    },
    git: {
      commits: gitStats.commits,
      files_changed_this_iteration: gitStats.files,
      lines_added_this_iteration: gitStats.added,
      lines_deleted_this_iteration: gitStats.deleted,
    },
    deployment_url: null, // Instance will add Netlify URL
    bundle_size_kb: null, // Instance will implement bundle size check
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
  const instanceNumber = parseInt(args[0]) || 0;
  const instanceName = args[1] || `Instance ${instanceNumber}`;

  console.log('🔬 SIRK Metrics Collection\n');
  console.log(`Instance: ${instanceName}`);
  console.log(`Iteration: ${instanceNumber}\n`);

  try {
    const metrics = await collectMetrics(instanceNumber, instanceName);
    const filepath = saveMetrics(metrics);
    displaySummary(metrics);

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
