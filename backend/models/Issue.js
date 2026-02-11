import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    signature: {
        type: String,
        index: true
        // Note: Not using unique constraint to allow application-level duplicate handling
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    module: String,
    applicationUrl: String,
    status: {
        type: String,
        enum: ['Todo', 'Open', 'New', 'In Progress', 'Fixed', 'Closed', 'Resolved'],
        default: 'Todo'
    },
    severity: {
        type: String,
        enum: ['Critical', 'High', 'Medium', 'Low'],
        default: 'Medium'
    },
    steps: mongoose.Schema.Types.Mixed,
    expected: String,
    actual: String,
    createdBy: String,
    openedBy: String,
    openedAt: Date,
    fixedBy: String,
    fixedAt: Date,
    closedAt: Date,
    assignee: String,
    navigationFlow: mongoose.Schema.Types.Mixed,
    navigationSummary: String,
    stateFlow: mongoose.Schema.Types.Mixed,
    isAuto: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: Date,
    occurrences: {
        type: Number,
        default: 1
    },
    lastOccurrence: {
        type: Date,
        default: Date.now
    },
    // Approximate impact metrics (incremented on each event with user/session info)
    affectedUsers: {
        type: Number,
        default: 0
    },
    affectedSessions: {
        type: Number,
        default: 0
    },
    // Multi-app support fields
    appId: {
        type: String,
        default: 'default',
        index: true
    },
    appName: {
        type: String,
        default: 'Legacy Bugs'
    },
    environment: {
        type: String,
        default: 'unknown'
    }
});

const Issue = mongoose.model('Issue', issueSchema);

export default Issue;
