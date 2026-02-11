/**
 * Find Similar Issues
 * Shows issues with same titles but different descriptions
 */

import mongoose from 'mongoose';
import Issue from './models/Issue.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bug-tracker';

async function findSimilarIssues() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const allBugs = await Issue.find().sort({ createdAt: 1 });
        console.log(`📊 Total bugs: ${allBugs.length}\n`);

        // Group by title (case-insensitive)
        const titleMap = new Map();

        allBugs.forEach(bug => {
            const normalizedTitle = (bug.title || '').toLowerCase().trim();
            if (!titleMap.has(normalizedTitle)) {
                titleMap.set(normalizedTitle, []);
            }
            titleMap.get(normalizedTitle).push(bug);
        });

        // Find titles with multiple issues
        console.log('🔍 Issues with same title but different descriptions:\n');

        let totalDuplicates = 0;
        for (const [title, issues] of titleMap.entries()) {
            if (issues.length > 1) {
                console.log(`\n📌 Title: "${issues[0].title}"`);
                console.log(`   Count: ${issues.length} issues\n`);

                issues.forEach((issue, idx) => {
                    const descPreview = (issue.description || '').substring(0, 100);
                    console.log(`   ${idx + 1}. ${issue.id}`);
                    console.log(`      Created: ${issue.createdAt}`);
                    console.log(`      Description: ${descPreview}...`);
                    console.log(`      Signature: ${issue.signature || 'none'}`);
                });

                totalDuplicates += (issues.length - 1);
            }
        }

        console.log(`\n\n📊 Summary:`);
        console.log(`   Total duplicate/similar issues: ${totalDuplicates}`);

        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');

    } catch (err) {
        console.error('❌ Script failed:', err);
        process.exit(1);
    }
}

findSimilarIssues();
