/**
 * Migration Script: Rename Playwright to BugBuddy
 * Run this once to update all existing Playwright test issues to BugBuddy
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Issue from './models/Issue.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bug-tracker';

async function migratePlaywrightToBugBuddy() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all issues with createdBy: "Playwright"
        const playwrightIssues = await Issue.find({ createdBy: 'Playwright' });

        console.log(`📊 Found ${playwrightIssues.length} Playwright issues to migrate\n`);

        if (playwrightIssues.length === 0) {
            console.log('✨ No issues to migrate. All done!');
            process.exit(0);
        }

        // Update all Playwright issues to BugBuddy
        const result = await Issue.updateMany(
            { createdBy: 'Playwright' },
            {
                $set: {
                    createdBy: 'BugBuddy',
                    module: 'BugBuddy Tests',
                    appId: 'bugbuddy-tests',
                    appName: 'BugBuddy Test Suite'
                }
            }
        );

        console.log(`✅ Successfully updated ${result.modifiedCount} issues`);
        console.log('\n📋 Summary:');
        console.log(`   - createdBy: "Playwright" → "BugBuddy"`);
        console.log(`   - module: → "BugBuddy Tests"`);
        console.log(`   - appId: → "bugbuddy-tests"`);
        console.log(`   - appName: → "BugBuddy Test Suite"`);

        console.log('\n✨ Migration complete! Refresh your dashboard to see changes.');

        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

migratePlaywrightToBugBuddy();
