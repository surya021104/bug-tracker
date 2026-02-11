/**
 * Remove Slow LCP Duplicates
 * Specifically removes the duplicate "Slow LCP on Project Allocation Page" issues
 */

import mongoose from 'mongoose';
import Issue from './models/Issue.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bug-tracker';

async function removeLCPDuplicates() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all "Slow LCP on Project Allocation Page" issues
        const allIssues = await Issue.find().sort({ createdAt: 1 });
        const lcpIssues = allIssues.filter(issue => {
            const title = (issue.title || '').toLowerCase();
            return title === 'slow lcp on project allocation page';
        });

        console.log(`📊 Found ${lcpIssues.length} issues with title "Slow LCP on Project Allocation Page"\n`);

        if (lcpIssues.length <= 1) {
            console.log('✅ No duplicates to remove!');
            await mongoose.disconnect();
            return;
        }

        // Keep the oldest, delete the rest
        const toKeep = lcpIssues[0];
        const toDelete = lcpIssues.slice(1);

        console.log(`📌 Keeping: ${toKeep.id} (created: ${toKeep.createdAt})`);
        console.log(`   Description: ${(toKeep.description || '').substring(0, 80)}...\n`);

        console.log(`🗑️  Deleting ${toDelete.length} duplicate(s):\n`);
        for (const issue of toDelete) {
            console.log(`   ${issue.id} (created: ${issue.createdAt})`);
            console.log(`   Description: ${(issue.description || '').substring(0, 80)}...`);
        }

        // Update occurrence count on the one we're keeping
        toKeep.occurrences = lcpIssues.length;
        toKeep.lastOccurrence = new Date();
        await toKeep.save();

        // Delete the duplicates
        const idsToDelete = toDelete.map(i => i.id);
        const result = await Issue.deleteMany({ id: { $in: idsToDelete } });

        console.log(`\n✅ Deleted ${result.deletedCount} duplicate(s)`);
        console.log(`✅ Updated ${toKeep.id} occurrence count to ${toKeep.occurrences}`);

        const finalCount = await Issue.countDocuments();
        console.log(`\n📊 Final database count: ${finalCount} issues`);

        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');

    } catch (err) {
        console.error('❌ Cleanup failed:', err);
        process.exit(1);
    }
}

removeLCPDuplicates();
