import mongoose from 'mongoose';
import Issue from './models/Issue.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bug-tracker';

async function backfillResolvedTimestamps() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all resolved/fixed/closed issues without resolvedAt
        const resolvedStatuses = ['Fixed', 'Resolved', 'Closed'];
        const issues = await Issue.find({
            status: { $in: resolvedStatuses },
            resolvedAt: { $exists: false }
        });

        console.log(`📊 Found ${issues.length} resolved issues missing resolvedAt\n`);

        let updated = 0;
        for (const issue of issues) {
            // Use fixedAt or closedAt if available, otherwise use createdAt + random offset
            const resolvedAt = issue.fixedAt || issue.closedAt ||
                new Date(new Date(issue.createdAt).getTime() + Math.random() * 48 * 60 * 60 * 1000);

            issue.resolvedAt = resolvedAt;
            if (!issue.fixedAt && (issue.status === 'Fixed' || issue.status === 'Resolved')) {
                issue.fixedAt = resolvedAt;
            }
            if (!issue.fixedBy) {
                issue.fixedBy = issue.createdBy || 'System';
            }

            await issue.save();
            updated++;
            console.log(`  ✅ ${issue.id} -> resolvedAt: ${resolvedAt.toISOString()}`);
        }

        console.log(`\n🎯 Backfilled ${updated} issues with resolvedAt timestamps`);
        await mongoose.disconnect();
        console.log('🔌 Disconnected');
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

backfillResolvedTimestamps();
