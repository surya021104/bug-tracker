import mongoose from 'mongoose';
import Issue from './models/Issue.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bug-tracker';

async function cleanupDuplicates() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected\n');

        const allIssues = await Issue.find({}).sort({ createdAt: 1 }); // Oldest first
        console.log(`📊 Total Issues Scanned: ${allIssues.length}`);

        const groups = {};
        let duplicateCount = 0;
        let removedCount = 0;

        // Grouping Logic (Adaptive & Fuzzy)
        allIssues.forEach(issue => {
            // Normalize Title: Remove numbers, dates, timestamps to find "base" issue types
            // e.g. "Slow LCP on Login Page (123ms)" -> "slow lcp on login page ()"
            let normalizedTitle = (issue.title || 'Untitled').toLowerCase();
            normalizedTitle = normalizedTitle.replace(/\d+/g, 'N'); // Replace numbers with N
            normalizedTitle = normalizedTitle.replace(/[\(\)\[\]]/g, ''); // Remove brackets
            normalizedTitle = normalizedTitle.trim();

            const key = issue.signature || normalizedTitle;

            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(issue);
        });

        console.log('\n🔍 Adaptive Duplicate Analysis (Fuzzy Match):');
        console.log('--------------------------------------------------');

        const deletionPromises = [];

        for (const [key, issues] of Object.entries(groups)) {
            if (issues.length > 1) {
                // Sort by creation date (oldest first)
                issues.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                const keep = issues[0]; // Keep the oldest
                const remove = issues.slice(1);

                duplicateCount += remove.length;

                console.log(`⚠️  Found ${issues.length} instances of type: "${key}"`);
                console.log(`   Keeping: ${keep.id} (${new Date(keep.createdAt).toISOString()}) - "${keep.title}"`);
                console.log(`   Removing: ${remove.length} duplicates...`);

                // Update metrics on the kept issue
                keep.occurrences = (keep.occurrences || 1) + remove.length;
                keep.lastOccurrence = new Date();
                await keep.save();

                // Delete the others
                remove.forEach(issue => {
                    deletionPromises.push(Issue.findByIdAndDelete(issue._id));
                    removedCount++;
                });
            }
        }

        if (duplicateCount === 0) {
            console.log('✅ No duplicates found (even with fuzzy matching).');
        } else {
            await Promise.all(deletionPromises);
            console.log('--------------------------------------------------');
            console.log(`\n✅ Cleanup Complete.`);
            console.log(`🗑️  Removed ${removedCount} duplicate issues.`);
            console.log(`✨ Consolidated occurrences.`);
        }

        // Generate Detailed Issue Type Report
        console.log('\n\n📊 Final Issue Type Report:');
        console.log('--------------------------------------------------');
        const finalIssues = await Issue.find({});

        // Group by Module -> Normalized Title
        const report = {};
        finalIssues.forEach(i => {
            const mod = i.module || 'General';
            // Normalize for reporting as well
            let normTitle = (i.title || 'Untitled').replace(/\d+/g, 'N').trim();

            if (!report[mod]) report[mod] = {};
            if (!report[mod][normTitle]) report[mod][normTitle] = 0;
            report[mod][normTitle]++;
        });

        Object.entries(report).forEach(([mod, titles]) => {
            console.log(`\n📦 Module: ${mod}`);
            Object.entries(titles)
                .sort((a, b) => b[1] - a[1])
                .forEach(([t, count]) => {
                    console.log(`   - ${t} (${count})`);
                });
        });

        await mongoose.disconnect();
        console.log('\n🔌 Disconnected');

    } catch (err) {
        console.error('❌ Error:', err);
    }
}

cleanupDuplicates();
