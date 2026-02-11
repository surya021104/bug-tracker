import mongoose from 'mongoose';

const ApiKeySchema = new mongoose.Schema({
    apiKey: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    apiKeyPreview: {
        type: String,
        required: true
    },
    appName: {
        type: String,
        required: true,
        trim: true
    },
    appId: {
        type: String,
        required: true,
        index: true
    },
    environment: {
        type: String,
        required: true,
        enum: ['development', 'staging', 'production'],
        default: 'development'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    rateLimit: {
        type: Number,
        default: 1000 // errors per hour
    },
    owner: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUsedAt: {
        type: Date,
        default: null
    },
    webhookUrl: {
        type: String,
        default: ''
    }
});

// Virtual for last 4 characters (for display)
ApiKeySchema.virtual('lastFourChars').get(function () {
    return this.apiKey.slice(-4);
});

// Index for faster lookups
ApiKeySchema.index({ apiKey: 1, isActive: 1 });
ApiKeySchema.index({ appId: 1 });

const ApiKey = mongoose.model('ApiKey', ApiKeySchema);

export default ApiKey;
