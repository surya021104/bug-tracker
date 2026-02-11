// Bulk Update Script: Mark bugs as Closed
// Use this to bulk-update bugs to "Closed" status

import mongoose from 'mongoose';
import Issue from './models/Issue.js';

console.log(' Bulk Update to Closed Status\n');

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/bug-tracker');

// Get all issues that are NOT already closed/resolved
const activeIssues = await Issue.find({
    status: { $nin: ['Closed', 'Fixed', 'Resolved'] }
}).sort({ createdAt: -1 });

console.log(`Found ${activeIssues.length} active issues:\n`);

activeIssues.forEach((issue, index) => {
    console.log(`${index + 1}. [${issue.id}] ${issue.title} - Status: ${issue.status}`);
});

// OPTION 1: Mark specific bugs by ID as Closed
const bugsToClose = [
    // Add bug IDs here, for example:
    // 'BUG-1706338815992',
    // 'BUG-1706338816287',
    // 'BUG-1706338817706',
];

if (bugsToClose.length > 0) {
    const result = await Issue.updateMany(
        { id: { $in: bugsToClose } },
        {
            $set: {
                status: 'Closed',
                closedAt: new Date().toISOString()
            }
        }
    );
    console.log(`\n Closed ${result.modifiedCount} specific bugs`);
} else {
    console.log('\n No bugs specified to close. Edit the bugsToClose array to add bug IDs.');
}

// OPTION 2: Uncomment to close ALL active bugs (use with caution!)
// const result = await Issue.updateMany(
//   { status: { $nin: ['Closed', 'Fixed', 'Resolved'] } },
//   { 
//     $set: { 
//       status: 'Closed',
//       closedAt: new Date().toISOString()
//     } 
//   }
// );
// console.log(`\n Closed ${result.modifiedCount} bugs`);

mongoose.connection.close();
console.log('\n Done!');
