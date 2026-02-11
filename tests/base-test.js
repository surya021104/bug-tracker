// Custom Playwright test with automatic bug reporting
import { test as base } from '@playwright/test';
import { reportTestFailure } from './helpers/bug-reporter.js';

// Extend base test with automatic bug reporting
export const test = base.extend({
    // Auto-report failed tests
    autoReportBugs: [async ({ page }, use, testInfo) => {
        // Before test - setup if needed
        await use();

        // After test - report if failed
        if (testInfo.status !== 'passed') {
            await reportTestFailure(testInfo, page);
        }
    }, { auto: true }]
});

export { expect } from '@playwright/test';
