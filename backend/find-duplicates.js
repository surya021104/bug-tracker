/**
 * Find Duplicate Issues Script
 * 
 * This script identifies duplicate bugs in the database
 * based on their title and description similarity.
 */

import mongoose from 'mongoose';
import Issue from './models/Issue.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bug-tracker';

async function findDuplicates() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all bugs
        const allBugs = await Issue.find().sort({ createdAt: 1 });
        console.log(`📊 Total bugs in database: ${allBugs.length}\n`);

        // Group by signature
        const signatureMap = new Map();
        const titleMap = new Map();
        const duplicates = [];

        allBugs.forEach((bug) => {
            // Check for signature duplicates
            if (bug.signature) {
                if (signatureMap.has(bug.signature)) {
                    duplicates.push({
                        type: 'signature',
                        original: signatureMap.get(bug.signature),
                        duplicate: bug
                    });
                } else {
                    signatureMap.set(bug.signature, bug);
                }
            }

            // Check for title duplicates (case-insensitive)
            const normalizedTitle = bug.title?.toLowerCase().trim();
            if (normalizedTitle) {
                if (titleMap.has(normalizedTitle)) {
                    const existing = titleMap.get(normalizedTitle);
                    // Only consider it a duplicate if description is also similar
                    const existingDesc = existing.description?.toLowerCase().trim() || '';
                    const currentDesc = bug.description?.toLowerCase().trim() || '';
                    
                    if (existingDesc === currentDesc) {
                        duplicates.push({
                            type: 'title+description',
                            original: existing,
                            duplicate: bug
                        });
                    }
                } else {
                    titleMap.set(normalizedTitle, bug);
                }
            }
        });

        console.log(`🔍 Found ${duplicates.length} duplicate issues:\n`);

        if (duplicates.length > 0) {
            duplicates.forEach((dup, index) => {
                console.log(`${index + 1}. [${dup.type}] Duplicate Detected:`);
                console.log(`   Original: ${dup.original.id}`);
                console.log(`   Title: ${dup.original.title}`);
                console.log(`   Created: ${dup.original.createdAt}`);
                console.log(`   
   Duplicate: ${dup.duplicate.id}`);
                console.log(`   Title: ${dup.duplicate.title}`);
                console.log(`   Created: ${dup.duplicate.createdAt}`);
                console.log('');
            });

            console.log('\n📋 Issue IDs to delete (keeping the older one):');
            const idsToDelete = duplicates.map(dup => dup.duplicate.id);
            console.log(JSON.stringify(idsToDelete, null, 2));
        } else {
            console.log('✅ No duplicates found!');
        }

        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');

    } catch (err) {
        console.error('❌ Script failed:', err);
        process.exit(1);
    }
}

findDuplicates();
