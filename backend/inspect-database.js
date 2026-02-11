/**
 * Database Inspection Script
 * 
 * This script shows what bugs are currently in the database
 * with their createdBy and type fields.
 */

import mongoose from 'mongoose';
import Issue from './models/Issue.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bug-tracker';

async function inspectDatabase() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all bugs
        const allBugs = await Issue.find().sort({ createdAt: -1 }).limit(20);

        console.log(`📊 Total bugs in database: ${await Issue.countDocuments()}`);
        console.log(`\n📝 Showing last 20 bugs:\n`);

        allBugs.forEach((bug, index) => {
            console.log(`${index + 1}. ${bug.id}`);
            console.log(`   Title: ${bug.title}`);
            console.log(`   Created By: ${bug.createdBy || 'N/A'}`);
            console.log(`   Type: ${bug.type || 'N/A'}`);
            console.log(`   Status: ${bug.status}`);
            console.log(`   Created: ${bug.createdAt}`);
            console.log('');
        });

        // Count by createdBy
        console.log('📊 Statistics:');
        const playwrightCount = await Issue.countDocuments({ createdBy: 'Playwright' });
        const autoAICount = await Issue.countDocuments({ createdBy: 'Auto-AI Monitor' });
        const manualCount = await Issue.countDocuments({ createdBy: { $nin: ['Playwright', 'Auto-AI Monitor'] } });

        console.log(`   Playwright: ${playwrightCount}`);
        console.log(`   Auto-AI Monitor: ${autoAICount}`);
        console.log(`   Manual/Other: ${manualCount}`);

        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');

    } catch (err) {
        console.error('❌ Inspection failed:', err);
        process.exit(1);
    }
}

inspectDatabase();
