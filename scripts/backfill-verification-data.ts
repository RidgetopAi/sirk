#!/usr/bin/env tsx
/**
 * Backfill verification data and truth scores for Instance 16
 * Based on Instance 15's pattern validation and review findings
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const metricsDir = path.join(__dirname, '..', 'metrics')

// Truth scores from reviews (Instance 15's validated data)
// Perfect separation: verified instances 8-10/10, unverified 5/10
const truthScores: Record<number, number> = {
  7: 9,   // Instance 7: verified, good execution
  8: 5,   // Instance 8: unverified (didn't run tests)
  9: 5,   // Instance 9: unverified (repeated Instance 8's mistake)
  10: 10, // Instance 10: gold standard (broke systemic cycle)
  11: 8,  // Instance 11: strategic but missed own metrics
  12: 10, // Instance 12: hybrid perfection
  13: 10, // Instance 13: epistemic validator
  14: 9,  // Instance 14: synthesizer (missed visual QA)
  15: 10, // Instance 15: pattern validator
}

// Exploration times (approximate from reviews and handoffs)
const explorationTimes: Record<number, number> = {
  8: 5,   // 7 min session, minimal exploration
  9: 5,   // 9 min session, minimal exploration
  10: 30, // 30 min discovery phase (Instance 10's breakthrough)
  11: 25, // Strategic exploration
  12: 40, // Comprehensive discovery (60 min total, ~40 exploration)
  13: 60, // Deep epistemic exploration
  14: 30, // Synthesis thinking
  15: 60, // Pattern validation research
}

// Verification status (from reviews)
const verificationStatus: Record<number, {
  tests_run: boolean
  typecheck_run: boolean
  build_run: boolean
  browser_verified: boolean
  metrics_collected: boolean
}> = {
  7: { tests_run: true, typecheck_run: true, build_run: true, browser_verified: false, metrics_collected: true },
  8: { tests_run: false, typecheck_run: true, build_run: true, browser_verified: false, metrics_collected: false },
  9: { tests_run: false, typecheck_run: true, build_run: true, browser_verified: false, metrics_collected: true },
  10: { tests_run: true, typecheck_run: true, build_run: true, browser_verified: true, metrics_collected: true },
  11: { tests_run: true, typecheck_run: true, build_run: true, browser_verified: false, metrics_collected: false },
  12: { tests_run: true, typecheck_run: true, build_run: true, browser_verified: false, metrics_collected: true },
  13: { tests_run: true, typecheck_run: true, build_run: true, browser_verified: true, metrics_collected: true },
  14: { tests_run: true, typecheck_run: true, build_run: true, browser_verified: false, metrics_collected: false },
  15: { tests_run: true, typecheck_run: true, build_run: true, browser_verified: false, metrics_collected: true },
}

async function main() {
  console.log('🔧 Backfilling verification data for Instances 7-15...\n')

  const files = await fs.readdir(metricsDir)
  const metricsFiles = files.filter(f => f.startsWith('instance_') && f.endsWith('.json'))

  let updated = 0

  for (const file of metricsFiles) {
    const filePath = path.join(metricsDir, file)
    const content = await fs.readFile(filePath, 'utf-8')
    const metrics = JSON.parse(content)

    const iteration = metrics.iteration

    // Only backfill Instances 7-15
    if (iteration < 7 || iteration > 15) {
      continue
    }

    // Add truth score if available
    if (truthScores[iteration]) {
      metrics.truth_score = truthScores[iteration]
    }

    // Add exploration time if available
    if (explorationTimes[iteration]) {
      metrics.exploration_time_min = explorationTimes[iteration]
    }

    // Add verification status if available
    if (verificationStatus[iteration]) {
      metrics.verification = verificationStatus[iteration]
    }

    // Write back with pretty formatting
    await fs.writeFile(filePath, JSON.stringify(metrics, null, 2) + '\n')
    
    console.log(`✅ Instance ${iteration}: truth_score=${metrics.truth_score ?? 'N/A'}, exploration=${metrics.exploration_time_min ?? 'N/A'}min, verification=${metrics.verification ? 'YES' : 'NO'}`)
    updated++
  }

  console.log(`\n🎉 Updated ${updated} metrics files`)
  console.log('\nInstance 15\'s validated pattern is now VISIBLE in the dashboard!')
  console.log('- Truth Score: Perfect separation verified (8-10) vs unverified (5)')
  console.log('- Verification Discipline: THE strongest success predictor')
  console.log('- Exploration Time: 30+ min correlates with breakthroughs\n')
}

main().catch(console.error)
