import crypto from 'crypto';

/**
 * Generate a secure API key with environment prefix
 * Format: APP_{ENV}_{TIMESTAMP}_{RANDOM}
 */
export function generateApiKey(environment = 'development') {
    const envPrefix = environment.toUpperCase().substring(0, 4);
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomBytes = crypto.randomBytes(16).toString('hex').toUpperCase();

    return `APP_${envPrefix}_${timestamp}_${randomBytes}`;
}

/**
 * Create a masked preview of API key for display
 * Shows first 8 chars and last 4 chars
 */
export function maskApiKey(apiKey) {
    if (!apiKey || apiKey.length < 12) return apiKey;

    const start = apiKey.substring(0, 8);
    const end = apiKey.slice(-4);
    const maskedLength = apiKey.length - 12;
    const masked = '*'.repeat(Math.min(maskedLength, 8));

    return `${start}${masked}${end}`;
}

/**
 * Get default rate limit based on environment
 */
export function getDefaultRateLimit(environment) {
    const limits = {
        development: 5000,    // Higher for testing
        staging: 2000,
        production: 1000      // Conservative for prod
    };

    return limits[environment] || 1000;
}
