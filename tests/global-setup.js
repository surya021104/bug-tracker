// Global test setup - Automatically report ALL test failures to bug tracker
import { test } from '@playwright/test';
import { reportTestFailure } from './helpers/bug-reporter.js';

// Global afterEach hook - applies to ALL tests
test.afterEach(async ({ page }, testInfo) => {
    // Only report if test failed
    if (testInfo.status !== 'passed') {
        await reportTestFailure(testInfo, page);
    }
});

console.log('✅ Global bug reporting enabled for all Playwright tests');
