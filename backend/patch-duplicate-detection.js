/**
 * Patch server.js to fix duplicate detection
 * Changes duplicate detection from title+description to title-only matching
 */

import fs from 'fs';
import path from 'path';

const serverPath = './server.js';
const serverContent = fs.readFileSync(serverPath, 'utf8');

// Fix 1: Bug ingestion endpoint - remove description matching
const oldIngestionCode1 = `    // Fallback: Check by title+description if no signature match
    if (!existing && item.title) {
      const normalizedTitle = item.title.toLowerCase().trim();
      const normalizedDesc = (item.description || '').toLowerCase().trim();

      if (isMongoConnected) {
        const allIssues = await Issue.find();
        existing = allIssues.find(issue => {
          const issueTitle = (issue.title || '').toLowerCase().trim();
          const issueDesc = (issue.description || '').toLowerCase().trim();
          return issueTitle === normalizedTitle && issueDesc === normalizedDesc;
        });
      } else {
        existing = inMemoryIssues.find(i => {
          const issueTitle = (i.title || '').toLowerCase().trim();
          const issueDesc = (i.description || '').toLowerCase().trim();
          return issueTitle === normalizedTitle && issueDesc === normalizedDesc;
        });
      }
    }`;

const newIngestionCode1 = `    // Fallback: Check by title ONLY if no signature match
    // NOTE: We match by title alone, not title+description, because:
    // - AI-generated descriptions can vary slightly for the same bug  
    // - Same title typically indicates the same underlying issue
    if (!existing && item.title) {
      const normalizedTitle = item.title.toLowerCase().trim();

      if (isMongoConnected) {
        const allIssues = await Issue.find();
        existing = allIssues.find(issue => {
          const issueTitle = (issue.title || '').toLowerCase().trim();
          return issueTitle === normalizedTitle;
        });
      } else {
        existing = inMemoryIssues.find(i => {
          const issueTitle = (i.title || '').toLowerCase().trim();
          return issueTitle === normalizedTitle;
        });
      }
    }`;

// Fix 2: Manual issue creation - remove description matching
const oldManualCode = `  // Check for duplicates by title + description
  const normalizedTitle = title.trim().toLowerCase();
  const normalizedDesc = (description || "").trim().toLowerCase();

  let existing;
  if (isMongoConnected) {
    const allIssues = await Issue.find();
    existing = allIssues.find(issue => {
      const issueTitle = (issue.title || '').toLowerCase().trim();
      const issueDesc = (issue.description || '').toLowerCase().trim();
      return issueTitle === normalizedTitle && issueDesc === normalizedDesc;
    });
  } else {
    existing = inMemoryIssues.find(i => {
      const issueTitle = (i.title || '').toLowerCase().trim();
      const issueDesc = (i.description || '').toLowerCase().trim();
      return issueTitle === normalizedTitle && issueDesc === normalizedDesc;
    });
  }`;

const newManualCode = `  // Check for duplicates by title ONLY
  // NOTE: Matching by title alone to catch variations in description
  const normalizedTitle = title.trim().toLowerCase();

  let existing;
  if (isMongoConnected) {
    const allIssues = await Issue.find();
    existing = allIssues.find(issue => {
      const issueTitle = (issue.title || '').toLowerCase().trim();
      return issueTitle === normalizedTitle;
    });
  } else {
    existing = inMemoryIssues.find(i => {
      const issueTitle = (i.title || '').toLowerCase().trim();
      return issueTitle === normalizedTitle;
    });
  }`;

let updatedContent = serverContent;

// Apply fixes
updatedContent = updatedContent.replace(oldIngestionCode1, newIngestionCode1);
updatedContent = updatedContent.replace(oldManualCode, newManualCode);

// Check if changes were applied
if (updatedContent === serverContent) {
    console.log('⚠️  No changes made - code patterns not found');
    console.log('This might be because the code was already updated or has different formatting');
} else {
    fs.writeFileSync(serverPath, updatedContent, 'utf8');
    console.log('✅ Successfully patched server.js');
    console.log('📝 Changes made:');
    console.log('  1. Bug ingestion: now matches by title only (not title+description)');
    console.log('  2. Manual issues: now matches by title only (not title+description)');
    console.log('\n🔄 Please restart the server for changes to take effect');
}
