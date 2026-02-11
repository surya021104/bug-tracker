/**
 * Check API Key Usage
 * Investigates why API key usage might be showing as 1
 */

import mongoose from 'mongoose';
import Issue from './models/Issue.js';
import ApiKey from './models/ApiKey.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bug-tracker';

async function checkApiKeyUsage() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all API keys
        const allKeys = await ApiKey.find();
        console.log(`📊 Total API Keys: ${allKeys.length}\n`);

        for (const key of allKeys) {
            console.log(`\n🔑 API Key: ${key.appName} (${key.environment})`);
            console.log(`   App ID: ${key.appId}`);
            console.log(`   Is Active: ${key.isActive}`);
            console.log(`   Rate Limit: ${key.rateLimit}/hour`);

            // Check usage in last hour
            const oneHourAgo = new Date(Date.now() - 3600000);
            const usageLastHour = await Issue.countDocuments({
                appId: key.appId,
                createdAt: { $gte: oneHourAgo }
            });

            // Check total usage ever
            const totalUsage = await Issue.countDocuments({
                appId: key.appId
            });

            // Get all issues for this app
            const allIssues = await Issue.find({ appId: key.appId }).sort({ createdAt: -1 }).limit(5);

            console.log(`   Usage (last hour): ${usageLastHour}`);
            console.log(`   Usage (total): ${totalUsage}`);
            console.log(`   Last Used: ${key.lastUsedAt || 'Never'}`);

            if (allIssues.length > 0) {
                console.log(`   Recent Issues (last 5):`);
                allIssues.forEach((issue, idx) => {
                    console.log(`     ${idx + 1}. ${issue.id} - ${issue.title}`);
                    console.log(`        Created: ${issue.createdAt}`);
                });
            } else {
                console.log(`   No issues found for this API key`);
            }
        }

        // Check issues without API keys (default appId)
        console.log(`\n\n📊 Issues without API Key (appId: "default"):`);
        const defaultIssues = await Issue.countDocuments({ appId: 'default' });
        console.log(`   Total: ${defaultIssues}`);

        // Check all unique appIds
        console.log(`\n\n📊 All Unique App IDs in Database:`);
        const uniqueAppIds = await Issue.distinct('appId');
        for (const appId of uniqueAppIds) {
            const count = await Issue.countDocuments({ appId });
            console.log(`   ${appId}: ${count} issues`);
        }

        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');

    } catch (err) {
        console.error('❌ Check failed:', err);
        process.exit(1);
    }
}

checkApiKeyUsage();
