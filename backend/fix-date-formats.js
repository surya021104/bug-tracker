// Database Migration: Fix Invalid Date Formats - ENHANCED VERSION
// Uses raw MongoDB to bypass Mongoose validation

import mongoose from 'mongoose';

console.log('🔧 Starting ENHANCED date format migration...\n');

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/bug-tracker');

// Get the raw collection to bypass Mongoose validation
const db = mongoose.connection.db;
const issuesCollection = db.collection('issues');

// Get ALL issues using raw MongoDB (bypasses validation)
const issues = await issuesCollection.find({}).toArray();

console.log(`Found ${issues.length} total issues in database\n`);

let fixedCount = 0;
let totalUpdates = 0;

for (const issue of issues) {
    const updates = {};
    let hasUpdates = false;

    // Check and fix ALL date fields
    const dateFields = ['createdAt', 'openedAt', 'fixedAt', 'closedAt', 'resolvedAt'];

    for (const field of dateFields) {
        const value = issue[field];

        // Check if it's a string that looks like a locale date
        if (value && typeof value === 'string' && (value.includes('/') || value.includes('am') || value.includes('pm') || value.includes('AM') || value.includes('PM'))) {
            try {
                // Parse and convert to ISO
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    updates[field] = date.toISOString();
                    hasUpdates = true;
                    totalUpdates++;
                    console.log(`  [${issue.id || 'NO-ID'}] Fixing ${field}: "${value}" → "${updates[field]}"`);
                }
            } catch (err) {
                console.error(`  ❌ Failed to parse ${field}: ${value}`);
            }
        }
    }

    // Update using raw collection (bypasses Mongoose validation)
    if (hasUpdates) {
        await issuesCollection.updateOne(
            { _id: issue._id },
            { $set: updates }
        );
        fixedCount++;
        console.log(` Fixed issue: ${issue.id || issue._id}\n`);
    }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(` Migration Complete!`);
console.log(`   Fixed ${fixedCount} issues`);
console.log(`   Total date fields updated: ${totalUpdates}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

mongoose.connection.close();
