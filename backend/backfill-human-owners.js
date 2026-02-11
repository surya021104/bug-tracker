/**
 * backfill-human-owners.js
 * Assigns random human employees as openedBy/fixedBy for existing issues
 * so the Team Leaderboard has real data immediately.
 * 
 * "createdBy" is left as-is (System / Auto-Monitor / Manual Entry).
 * Only openedBy and fixedBy are assigned to human employees.
 */

import mongoose from 'mongoose';
import Issue from './models/Issue.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bug-tracker';

const EMPLOYEES = [
    { empId: 'EMP001', name: 'Surya' },
    { empId: 'EMP002', name: 'Anitha' },
    { empId: 'EMP003', name: 'Pradeep' },
    { empId: 'EMP004', name: 'Rahul' },
    { empId: 'EMP005', name: 'Divya' },
    { empId: 'EMP006', name: 'Vikram' },
    { empId: 'EMP007', name: 'Meena' },
    { empId: 'EMP008', name: 'Arjun' },
    { empId: 'EMP009', name: 'Kavitha' },
    { empId: 'EMP010', name: 'Ravi' }
];

function randomEmp() {
    const e = EMPLOYEES[Math.floor(Math.random() * EMPLOYEES.length)];
    return `${e.empId} - ${e.name}`;
}

// Pick a different employee for fixer vs opener
function randomFixerExcluding(openerId) {
    const others = EMPLOYEES.filter(e => e.empId !== openerId);
    const e = others[Math.floor(Math.random() * others.length)];
    return `${e.empId} - ${e.name}`;
}

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Connected to MongoDB');

    const Issue = mongoose.connection.collection('issues');
    const issues = await Issue.find({}).toArray();
    console.log(`📋 Found ${issues.length} issues`);

    let updated = 0;

    for (const issue of issues) {
        const updates = {};

        // Assign openedBy if missing or if it's "System"
        if (!issue.openedBy || issue.openedBy === 'System' || issue.openedBy === 'Unknown') {
            const opener = randomEmp();
            updates.openedBy = opener;

            // Also set openedAt if missing
            if (!issue.openedAt) {
                const created = new Date(issue.createdAt || issue.timestamp || Date.now());
                // Opened ~1-4 hours after creation
                const offset = (Math.random() * 3 + 1) * 60 * 60 * 1000;
                updates.openedAt = new Date(created.getTime() + offset).toISOString();
            }
        }

        // Assign fixedBy if status is Fixed/Resolved/Closed and fixedBy is missing
        const fixedStatuses = ['Fixed', 'Resolved', 'Closed'];
        if (fixedStatuses.includes(issue.status)) {
            if (!issue.fixedBy || issue.fixedBy === 'System' || issue.fixedBy === 'Unknown') {
                const openerId = (updates.openedBy || issue.openedBy || '').split(' - ')[0];
                updates.fixedBy = randomFixerExcluding(openerId);

                if (!issue.fixedAt) {
                    const openedAt = new Date(updates.openedAt || issue.openedAt || issue.createdAt || Date.now());
                    // Fixed ~2-48 hours after opening
                    const offset = (Math.random() * 46 + 2) * 60 * 60 * 1000;
                    updates.fixedAt = new Date(openedAt.getTime() + offset).toISOString();
                }
            }

            // Ensure resolvedAt is set
            if (!issue.resolvedAt) {
                updates.resolvedAt = updates.fixedAt || issue.fixedAt || new Date().toISOString();
            }
        }

        if (Object.keys(updates).length > 0) {
            await Issue.updateOne({ _id: issue._id }, { $set: updates });
            updated++;
            console.log(`  ✅ ${issue.title?.substring(0, 50) || issue._id} → openedBy: ${updates.openedBy || '(kept)'}, fixedBy: ${updates.fixedBy || '(kept)'}`);
        }
    }

    console.log(`\n🎯 Backfilled ${updated} / ${issues.length} issues with human owners`);
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
}

run().catch(err => {
    console.error('❌ Backfill failed:', err);
    process.exit(1);
});
