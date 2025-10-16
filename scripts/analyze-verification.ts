/**
 * SIRK Verification Pattern Analysis
 * 
 * Purpose: Analyze verification completeness patterns across all instances
 * Output: Descriptive statistics, pattern identification, simple risk heuristic
 * 
 * Instance 27: Lightweight analysis with N=26 (descriptive, not predictive)
 * Oracle guidance: Timebox analysis, focus on top 3 patterns, simple heuristics
 * 
 * Usage: npx tsx scripts/analyze-verification.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface VerificationData {
  instance: number;
  exploration_time?: number;
  tests_total: number;
  typescript_errors: number;
  build_success: boolean;
  verification_score: number;
  verification_completeness?: {
    tests_ran: boolean;
    typecheck_ran: boolean;
    build_ran: boolean;
    browser_verified: boolean;
    deployment_verified: boolean;
    edge_cases_tested: boolean;
    git_push_verified: boolean;
  };
  fix_type?: string;
  files_changed: number;
  risk_score: number;
  likely_cause: string[];
}

/**
 * Load all metrics files and extract verification data
 */
function loadVerificationData(): VerificationData[] {
  const metricsDir = 'metrics';
  const files = fs.readdirSync(metricsDir)
    .filter(f => f.startsWith('instance_') && f.endsWith('.json'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/instance_(\d+)_/)?.[1] || '0');
      const numB = parseInt(b.match(/instance_(\d+)_/)?.[1] || '0');
      return numA - numB;
    });

  const data: VerificationData[] = [];

  for (const file of files) {
    try {
      const filepath = path.join(metricsDir, file);
      const content = fs.readFileSync(filepath, 'utf-8');
      const metrics = JSON.parse(content);

      const instanceNum = metrics.iteration || parseInt(file.match(/instance_(\d+)_/)?.[1] || '0');
      
      // Calculate verification completeness score (0-7)
      let score = 0;
      const vc = metrics.verification_completeness;
      if (vc) {
        score = [
          vc.tests_ran,
          vc.typecheck_ran,
          vc.build_ran,
          vc.browser_verified,
          vc.deployment_verified,
          vc.edge_cases_tested,
          vc.git_push_verified
        ].filter(Boolean).length;
      }

      // Calculate risk score (0-5 heuristic)
      let risk = 0;
      const tests_total = metrics.tests?.total || 0;
      const build_success = metrics.build_success;
      const files_changed = metrics.git?.files_changed_this_iteration || 0;
      const exploration_time = metrics.exploration_time_minutes || 0;
      
      if (tests_total === 0) risk += 1;
      if (!build_success) risk += 1;
      if (!vc) risk += 1; // No verification data at all
      if (exploration_time <= 15 && tests_total === 0) risk += 1;
      if (files_changed > 10 && tests_total === 0) risk += 1;

      // Determine likely causes for verification gaps
      const likely_cause: string[] = [];
      if (score <= 3) {
        if (!build_success && vc && !vc.browser_verified) {
          likely_cause.push('Build-blocked');
        }
        if (tests_total === 0 && metrics.typescript_errors === -1 && build_success) {
          likely_cause.push('No-tests infra');
        }
        if (exploration_time <= 15 && score <= 3) {
          likely_cause.push('Rushed');
        }
        if (!vc && exploration_time > 0) {
          likely_cause.push('Pre-metrics-framework');
        }
        if (vc && !vc.tests_ran && !vc.typecheck_ran && !vc.build_ran) {
          likely_cause.push('Automation-mode gap');
        }
      }
      if (likely_cause.length === 0 && score <= 3) {
        likely_cause.push('Unknown');
      }

      data.push({
        instance: instanceNum,
        exploration_time: exploration_time || undefined,
        tests_total,
        typescript_errors: metrics.typescript_errors ?? -1,
        build_success: build_success ?? false,
        verification_score: score,
        verification_completeness: vc,
        fix_type: metrics.fix_type,
        files_changed,
        risk_score: risk,
        likely_cause
      });
    } catch (error) {
      console.warn(`⚠️  Could not parse ${file}: ${error}`);
    }
  }

  return data;
}

/**
 * Analyze patterns in verification data
 */
function analyzePatterns(data: VerificationData[]) {
  console.log('\n═══════════════════════════════════════');
  console.log('📊 SIRK VERIFICATION PATTERN ANALYSIS');
  console.log('═══════════════════════════════════════\n');

  console.log(`📈 Sample Size: N=${data.length} instances\n`);

  // Filter instances with verification framework (Instance 22+)
  const withFramework = data.filter(d => d.verification_completeness);
  const preFramework = data.filter(d => !d.verification_completeness);

  console.log(`   Pre-framework: ${preFramework.length} instances (no verification_completeness data)`);
  console.log(`   With framework: ${withFramework.length} instances (Instance 22+)\n`);

  if (withFramework.length === 0) {
    console.log('⚠️  No instances with verification framework data found.');
    console.log('   Verification framework added in Instance 22.\n');
    return;
  }

  // === TOP 3 PATTERNS ===
  console.log('═══════════════════════════════════════');
  console.log('🔍 TOP 3 VERIFICATION PATTERNS');
  console.log('═══════════════════════════════════════\n');

  // Pattern 1: Which verification steps are most frequently skipped?
  console.log('Pattern 1: Most Frequently Skipped Verification Steps\n');
  const stepStats = {
    tests_ran: { skipped: 0, total: 0 },
    typecheck_ran: { skipped: 0, total: 0 },
    build_ran: { skipped: 0, total: 0 },
    browser_verified: { skipped: 0, total: 0 },
    deployment_verified: { skipped: 0, total: 0 },
    edge_cases_tested: { skipped: 0, total: 0 },
    git_push_verified: { skipped: 0, total: 0 }
  };

  for (const d of withFramework) {
    if (d.verification_completeness) {
      for (const [key, value] of Object.entries(d.verification_completeness)) {
        if (key in stepStats) {
          const step = key as keyof typeof stepStats;
          stepStats[step].total++;
          if (!value) stepStats[step].skipped++;
        }
      }
    }
  }

  const skippedRates = Object.entries(stepStats)
    .map(([step, stats]) => ({
      step,
      rate: stats.total > 0 ? (stats.skipped / stats.total * 100) : 0,
      skipped: stats.skipped,
      total: stats.total
    }))
    .sort((a, b) => b.rate - a.rate);

  for (const { step, rate, skipped, total } of skippedRates) {
    const label = step.replace(/_/g, ' ');
    console.log(`   ${label.padEnd(25)} ${skipped}/${total} skipped (${rate.toFixed(1)}%)`);
  }

  // Pattern 2: Exploration time vs verification completeness
  console.log('\n\nPattern 2: Exploration Time vs Verification Completeness\n');
  const timeVsScore = withFramework
    .filter(d => d.exploration_time && d.exploration_time > 0)
    .map(d => ({ time: d.exploration_time!, score: d.verification_score, instance: d.instance }));

  const shortSessions = timeVsScore.filter(d => d.time <= 15);
  const mediumSessions = timeVsScore.filter(d => d.time > 15 && d.time <= 60);
  const longSessions = timeVsScore.filter(d => d.time > 60);

  const avgScore = (arr: typeof timeVsScore) =>
    arr.length > 0 ? (arr.reduce((sum, d) => sum + d.score, 0) / arr.length).toFixed(1) : 'N/A';

  console.log(`   ≤15 min sessions:  ${shortSessions.length} instances, avg score: ${avgScore(shortSessions)}/7`);
  console.log(`   16-60 min sessions: ${mediumSessions.length} instances, avg score: ${avgScore(mediumSessions)}/7`);
  console.log(`   >60 min sessions:   ${longSessions.length} instances, avg score: ${avgScore(longSessions)}/7`);

  // Pattern 3: Likely causes for verification gaps
  console.log('\n\nPattern 3: Likely Causes for Verification Gaps (score ≤3)\n');
  const lowScoreInstances = withFramework.filter(d => d.verification_score <= 3);
  const causeFrequency: Record<string, number> = {};
  
  for (const d of lowScoreInstances) {
    for (const cause of d.likely_cause) {
      causeFrequency[cause] = (causeFrequency[cause] || 0) + 1;
    }
  }

  const sortedCauses = Object.entries(causeFrequency)
    .sort(([,a], [,b]) => b - a);

  for (const [cause, count] of sortedCauses) {
    const pct = lowScoreInstances.length > 0 ? (count / lowScoreInstances.length * 100).toFixed(1) : '0.0';
    console.log(`   ${cause.padEnd(25)} ${count} instances (${pct}%)`);
  }

  // === SIMPLE RISK HEURISTIC ===
  console.log('\n\n═══════════════════════════════════════');
  console.log('⚠️  SIMPLE RISK HEURISTIC (0-5 scale)');
  console.log('═══════════════════════════════════════\n');

  console.log('Risk factors:');
  console.log('   +1 if tests.total === 0');
  console.log('   +1 if !build_success');
  console.log('   +1 if no verification_completeness data');
  console.log('   +1 if exploration ≤15 min AND no tests');
  console.log('   +1 if files_changed >10 AND no tests\n');

  const riskDistribution = withFramework.reduce((acc, d) => {
    acc[d.risk_score] = (acc[d.risk_score] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  console.log('Risk score distribution (with framework):');
  for (let i = 0; i <= 5; i++) {
    const count = riskDistribution[i] || 0;
    const pct = withFramework.length > 0 ? (count / withFramework.length * 100).toFixed(1) : '0.0';
    const bar = '█'.repeat(Math.round(count / 2));
    console.log(`   Risk ${i}: ${count.toString().padStart(2)} instances (${pct.padStart(5)}%) ${bar}`);
  }

  // === HIGH RISK INSTANCES ===
  const highRisk = withFramework.filter(d => d.risk_score >= 3);
  if (highRisk.length > 0) {
    console.log(`\n\n⚠️  High Risk Instances (risk ≥3): ${highRisk.length} instances\n`);
    for (const d of highRisk) {
      console.log(`   Instance ${d.instance}: risk=${d.risk_score}, score=${d.verification_score}/7, causes: ${d.likely_cause.join(', ')}`);
    }
  }

  // === GOLD STANDARDS ===
  console.log('\n\n═══════════════════════════════════════');
  console.log('✨ GOLD STANDARD INSTANCES');
  console.log('═══════════════════════════════════════\n');

  const goldStandards = withFramework.filter(d => d.verification_score >= 5);
  console.log(`Instances with verification score ≥5: ${goldStandards.length}\n`);
  
  for (const d of goldStandards) {
    const time = d.exploration_time ? `${d.exploration_time}min` : 'N/A';
    console.log(`   Instance ${d.instance}: score=${d.verification_score}/7, exploration=${time}, risk=${d.risk_score}`);
  }

  // === RECOMMENDATIONS ===
  console.log('\n\n═══════════════════════════════════════');
  console.log('💡 RECOMMENDATIONS FOR INSTANCE 28');
  console.log('═══════════════════════════════════════\n');

  const topCause = sortedCauses[0];
  if (topCause) {
    console.log(`1. Top verification gap cause: "${topCause[0]}" (${topCause[1]} instances)`);
    console.log(`   → Target interventions at this failure mode\n`);
  }

  const browserSkipRate = stepStats.browser_verified.skipped / stepStats.browser_verified.total * 100;
  console.log(`2. Browser verification skip rate: ${browserSkipRate.toFixed(1)}%`);
  console.log(`   → Use --verify-browser flag for objective capture\n`);

  const avgTimeForHigh = withFramework
    .filter(d => d.verification_score >= 5 && d.exploration_time)
    .reduce((sum, d) => sum + (d.exploration_time || 0), 0) / goldStandards.length;
  
  console.log(`3. Average exploration time for high scorers: ${avgTimeForHigh.toFixed(0)} minutes`);
  console.log(`   → Adequate exploration correlates with verification completeness\n`);

  console.log('═══════════════════════════════════════\n');
}

/**
 * Main execution
 */
function main() {
  try {
    const data = loadVerificationData();
    analyzePatterns(data);
    
    console.log('✅ Analysis complete!\n');
    console.log('For detailed writeup, see: docs/VERIFICATION_PATTERNS.md\n');
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

main();
