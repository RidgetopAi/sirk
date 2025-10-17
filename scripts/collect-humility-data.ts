#!/usr/bin/env tsx
/**
 * Collect epistemic humility data for instances 0-32
 * Uses AIDIS context_search to retrieve completion/reflections contexts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface HumilityData {
  instance: number;
  blind_spot_predicted: boolean;
  confidence_stated: boolean;
  limitations_acknowledged: boolean;
  humility_score: number;
  truth_score?: number;
  gold_standard?: boolean;
  evidence: {
    blind_spot_text?: string;
    confidence_text?: string;
    limitations_text?: string;
  };
  notes: string;
}

// Truth scores and gold standard flags from reviews
// These are from the historical AIDIS contexts and reviews
const TRUTH_SCORES: Record<number, { truth: number; gold: boolean }> = {
  0: { truth: 10, gold: false },  // Brian's bootstrap
  1: { truth: 7, gold: false },
  2: { truth: 7, gold: false },
  3: { truth: 6, gold: false },
  4: { truth: 6, gold: false },
  5: { truth: 6, gold: false },
  6: { truth: 6, gold: false },
  7: { truth: 5, gold: false },
  8: { truth: 5, gold: false },
  9: { truth: 5, gold: false },
  10: { truth: 10, gold: true },   // Gold standard
  11: { truth: 7, gold: false },
  12: { truth: 10, gold: true },   // Gold standard
  13: { truth: 10, gold: true },   // Gold standard
  14: { truth: 7, gold: false },
  15: { truth: 9, gold: false },   // Near gold, missed git push
  16: { truth: 8, gold: false },
  17: { truth: 10, gold: true },   // Gold standard
  18: { truth: 8, gold: false },   // Good work, missed git push
  19: { truth: 8, gold: false },
  20: { truth: 10, gold: true },   // Gold standard
  21: { truth: 9, gold: false },
  22: { truth: 9, gold: false },
  23: { truth: 7, gold: false },
  24: { truth: 10, gold: true },   // Gold standard
  25: { truth: 0, gold: false },   // Catastrophic failure
  26: { truth: 9, gold: true },    // Gold standard
  27: { truth: 8, gold: false },
  28: { truth: 9, gold: false },
  29: { truth: 7, gold: false },
  30: { truth: 8, gold: false },
  31: { truth: 9, gold: false },
  32: { truth: 8, gold: false },
};

async function main() {
  console.log('🔍 Collecting epistemic humility data for instances 0-32...\n');
  
  const results: HumilityData[] = [];
  
  for (let i = 0; i <= 32; i++) {
    console.log(`\n📊 Instance ${i}:`);
    console.log(`   Truth score: ${TRUTH_SCORES[i]?.truth ?? 'unknown'}`);
    console.log(`   Gold standard: ${TRUTH_SCORES[i]?.gold ? 'YES' : 'NO'}`);
    console.log(`   Search AIDIS for Instance ${i} completion contexts...`);
    console.log(`   → Use: context_search("Instance ${i} completion blind spot confidence limitations")`);
    console.log(`   → Manual scoring required - will be done in next step`);
    
    // Create placeholder entry
    const entry: HumilityData = {
      instance: i,
      blind_spot_predicted: false,
      confidence_stated: false,
      limitations_acknowledged: false,
      humility_score: 0,
      truth_score: TRUTH_SCORES[i]?.truth,
      gold_standard: TRUTH_SCORES[i]?.gold,
      evidence: {},
      notes: 'To be scored manually using AIDIS context_search'
    };
    
    results.push(entry);
  }
  
  // Save placeholder file
  const outputPath = path.join(__dirname, '../data/meta/epistemic_humility_scores.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log(`\n✅ Created placeholder file: ${outputPath}`);
  console.log('\n📝 Next step: Manually score each instance using AIDIS context_search');
  console.log('   For each instance, search for completion/handoff/reflections contexts');
  console.log('   Apply rubric from data/meta/rubric.md');
  console.log('   Update JSON file with scores and evidence');
}

main().catch(console.error);
