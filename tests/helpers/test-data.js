/**
 * ========================================
 * TEST DATA GENERATORS
 * ========================================
 * 
 * Helper functions to generate consistent test data
 */

/**
 * Generate test user credentials
 * Updated to match the actual Login.jsx implementation
 */
export function getTestUser() {
    return {
        empId: 'E001',              // Employee ID format used by login
        password: 'admin123',        // Default password from EMPLOYEES data
        name: 'Test User',

        // Legacy fields for reference
        email: 'admin@company.com'   // Not used in login, but kept for compatibility
    };
}

/**
 * Generate random test issue data
 */
export function generateTestIssue() {
    const timestamp = Date.now();

    return {
        title: `Test Issue ${timestamp}`,
        description: `This is a test issue created by automated Playwright test at ${new Date().toISOString()}`,
        severity: 'Medium',
        status: 'Todo',
        module: 'Automated Testing',
        steps: '1. Run automated test\n2. Create issue\n3. Verify creation',
        expected: 'Issue should be created successfully',
        actual: 'Issue created by automated test'
    };
}

/**
 * Get URLs for testing
 */
export function getTestUrls(baseUrl = 'http://localhost:5173') {
    return {
        home: baseUrl,
        login: `${baseUrl}/login`,
        dashboard: `${baseUrl}/dashboard`,
        issues: `${baseUrl}/issues`,
        newIssue: `${baseUrl}/issues/new`,
        reports: `${baseUrl}/reports`,
        settings: `${baseUrl}/settings`,
        team: `${baseUrl}/team`
    };
}

/**
 * Common test timeouts
 */
export const TIMEOUTS = {
    short: 5000,
    medium: 10000,
    long: 30000,
    navigation: 5000,
    api: 10000
};
