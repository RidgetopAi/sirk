#!/usr/bin/env tsx
/**
 * Fix Mislabeled Metrics - Instance 18 Data Healer
 * 
 * Problem: 5 metrics files labeled as "Instance 0" when they're actually instances 11, 14, 15, 16, 17
 * Solution: Rename files and update JSON content with correct instance IDs
 */

import fs from 'fs';
import path from 'path';

interface InstanceMapping {
  oldFilename: string;
  correctInstance: number;
  timestamp: string;
  reason: string;
}

// Map based on timestamp analysis
const corrections: InstanceMapping[] = [
  {
    oldFilename: 'instance_0_1760393989232.json',
    correctInstance: 10, // Oct 13 22:19 - matches Instance 10 session
    timestamp: '2025-10-13T22:19:44.830Z',
    reason: 'Timestamp matches Instance 10 deployment time'
  },
  {
    oldFilename: 'instance_0_1760400857309.json',
    correctInstance: 11, // Oct 14 00:14 - close to Instance 11 (00:14:42)
    timestamp: '2025-10-14T00:14:11.770Z',
    reason: 'Timestamp ~30s before Instance 11'
  },
  {
    oldFilename: 'instance_0_1760405086471.json',
    correctInstance: 14, // Oct 14 01:24 - close to Instance 14 (01:25:05)
    timestamp: '2025-10-14T01:24:40.463Z',
    reason: 'Timestamp ~25s before Instance 14'
  },
  {
    oldFilename: 'instance_0_1760447774985.json',
    correctInstance: 16, // Oct 14 13:16 - matches Instance 16 session
    timestamp: '2025-10-14T13:16:09.245Z',
    reason: 'Timestamp matches Instance 16 deployment'
  },
  {
    oldFilename: 'instance_0_1760478339960.json',
    correctInstance: 17, // Oct 14 21:45 - CONFIRMED Instance 17
    timestamp: '2025-10-14T21:45:34.183Z',
    reason: 'Instance 17 mislabeling documented in review'
  }
];

const metricsDir = path.join(process.cwd(), 'metrics');

console.log('🔧 Instance 18 Data Healer - Fixing Mislabeled Metrics\n');
console.log(`Working directory: ${metricsDir}\n`);

let fixedCount = 0;
let errors: string[] = [];

for (const correction of corrections) {
  const oldPath = path.join(metricsDir, correction.oldFilename);
  const newFilename = correction.oldFilename.replace('instance_0_', `instance_${correction.correctInstance}_`);
  const newPath = path.join(metricsDir, newFilename);

  try {
    // Check if old file exists
    if (!fs.existsSync(oldPath)) {
      console.log(`⏭️  Skipping ${correction.oldFilename} (already fixed or doesn't exist)`);
      continue;
    }

    // Read and parse JSON
    const content = fs.readFileSync(oldPath, 'utf-8');
    const metrics = JSON.parse(content);

    // Update instance field
    metrics.instance = `Instance ${correction.correctInstance}`;
    metrics.iteration = correction.correctInstance;

    // Write to new filename
    fs.writeFileSync(newPath, JSON.stringify(metrics, null, 2));

    // Delete old file
    fs.unlinkSync(oldPath);

    console.log(`✅ Fixed: ${correction.oldFilename}`);
    console.log(`   → ${newFilename}`);
    console.log(`   → Instance ${correction.correctInstance} (${correction.reason})\n`);

    fixedCount++;
  } catch (error) {
    const errorMsg = `❌ Error fixing ${correction.oldFilename}: ${error}`;
    console.error(errorMsg);
    errors.push(errorMsg);
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Fixed: ${fixedCount}/${corrections.length}`);
console.log(`   Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log(`\n⚠️  Errors encountered:`);
  errors.forEach(err => console.log(`   ${err}`));
  process.exit(1);
}

console.log(`\n✨ Data healing complete! All metrics correctly labeled.`);
