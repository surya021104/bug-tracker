import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    profile: {
        name: String,
        email: String,
        avatar: String,
        role: String
    },
    notifications: {
        email: { type: Boolean, default: true },
        browser: { type: Boolean, default: true },
        frequency: {
            type: String,
            enum: ['instant', 'daily', 'weekly'],
            default: 'instant'
        },
        triggers: {
            newBugs: { type: Boolean, default: true },
            statusChanges: { type: Boolean, default: true },
            assignments: { type: Boolean, default: true }
        }
    },
    appearance: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'light'
        },
        accentColor: { type: String, default: '#3b82f6' },
        viewDensity: {
            type: String,
            enum: ['compact', 'comfortable'],
            default: 'comfortable'
        }
    },
    application: {
        defaultStatus: { type: String, default: 'Todo' },
        defaultSeverity: { type: String, default: 'Medium' },
        autoAssign: { type: Boolean, default: false },
        defaultAssignee: String
    },
    integrations: {
        apiKey: String,
        webhookUrl: String,
        slackWebhook: String,
        githubToken: String
    },
    advanced: {
        debugMode: { type: Boolean, default: false },
        performanceMonitoring: { type: Boolean, default: false },
        experimentalFeatures: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
