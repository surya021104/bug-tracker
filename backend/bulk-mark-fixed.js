// Bulk Update Script: Mark bugs as Fixed
// Use this to bulk-update bugs to "Fixed" status

import mongoose from 'mongoose';
import Issue from './models/Issue.js';

console.log('Bulk Update to Fixed Status\n');

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/bug-tracker');

// Get all issues that are NOT already fixed/closed/resolved
const activeIssues = await Issue.find({
    status: { $in: ['Todo', 'Open', 'New', 'In Progress'] }
}).sort({ createdAt: -1 });

console.log(`Found ${activeIssues.length} active issues:\n`);

activeIssues.forEach((issue, index) => {
    console.log(`${index + 1}. [${issue.id}] ${issue.title} - Status: ${issue.status}`);
});

// Uncomment below to mark ALL as Fixed (use with caution!)
// const result = await Issue.updateMany(
//   { status: { $in: ['Todo', 'Open', 'New', 'In Progress'] } },
//   { 
//     $set: { 
//       status: 'Fixed',
//       fixedAt: new Date().toISOString(),
//       fixedBy: 'Bulk Update Script'
//     } 
//   }
// );
// console.log(`\n✅ Updated ${result.modifiedCount} issues to Fixed status`);

// OR mark specific bugs by ID:
const bugsToFix = [
    // 'BUG-1706338815992',  // Uncomment and add bug IDs here
    // 'BUG-1706338816287',
];

if (bugsToFix.length > 0) {
    const result = await Issue.updateMany(
        { id: { $in: bugsToFix } },
        {
            $set: {
                status: 'Fixed',
                fixedAt: new Date().toISOString(),
                fixedBy: 'Manual Bulk Update'
            }
        }
    );
    console.log(`\n Updated ${result.modifiedCount} specific issues to Fixed status`);
}

mongoose.connection.close();
console.log('\n Done!');
