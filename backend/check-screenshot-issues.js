/**
 * Check for exact duplicate IDs from screenshot
 */

import mongoose from 'mongoose';
import Issue from './models/Issue.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bug-tracker';

async function checkSpecificIssues() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // IDs from screenshot
        const ids = [
            'BUG-1770268486015-pko5',
            'BUG-1770268485781-jcan'
        ];

        console.log('🔍 Checking issues from screenshot:\n');

        for (const id of ids) {
            const issue = await Issue.findOne({ id });
            if (issue) {
                console.log(`✅ Found: ${id}`);
                console.log(`   Title: ${issue.title}`);
                console.log(`   Description: ${(issue.description || '').substring(0, 100)}...`);
                console.log(`   Signature: ${issue.signature || 'none'}`);
                console.log(`   Created: ${issue.createdAt}`);
                console.log('');
            } else {
                console.log(`❌ Not found: ${id}\n`);
            }
        }

        // Check for title "Slow LCP on Project Allocation Page"
        console.log('\n📊 All issues with title "Slow LCP on Project Allocation Page":\n');
        const lcpIssues = await Issue.find();
        const matchingIssues = lcpIssues.filter(issue => {
            const title = (issue.title || '').toLowerCase();
            return title.includes('slow lcp') && title.includes('project allocation');
        });

        console.log(`Found ${matchingIssues.length} issues:\n`);
        matchingIssues.forEach((issue, idx) => {
            console.log(`${idx + 1}. ${issue.id}`);
            console.log(`   Title: ${issue.title}`);
            console.log(`   Description: ${(issue.description || '').substring(0, 80)}...`);
            console.log(`   Created: ${issue.createdAt}`);
            console.log(`   Signature: ${issue.signature || 'none'}`);
            console.log('');
        });

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');

    } catch (err) {
        console.error('❌ Check failed:', err);
        process.exit(1);
    }
}

checkSpecificIssues();
