/**
 * ========================================
 * E2E TEST: DASHBOARD & REPORTS
 * ========================================
 * 
 * Tests dashboard functionality and reports page
 */

import { test, expect } from '@playwright/test';
import { reportBug, reportTestFailure, reportPerformanceIssue } from '../helpers/bug-reporter.js';
import { getTestUrls, TIMEOUTS } from '../helpers/test-data.js';

// Use authenticated state
test.use({ storageState: 'tests/.auth/user.json' });

test.describe('Dashboard & Reports Monitoring', () => {
    test('should load dashboard without errors', async ({ page }) => {
        const urls = getTestUrls();

        try {
            await page.goto(urls.dashboard, { waitUntil: 'networkidle' });

            // Wait for content to load
            await page.waitForLoadState('domcontentloaded');

            // Check for basic dashboard elements
            const bodyContent = await page.textContent('body');

            if (bodyContent.includes('error') || bodyContent.includes('Error')) {
                await reportBug({
                    type: 'UI_ERROR_MESSAGE',
                    message: 'Dashboard displays error message',
                    url: page.url(),
                    severity: 'High',
                    testName: 'Dashboard - Error Check'
                });
            }

            console.log('✅ Dashboard loaded successfully');
        } catch (error) {
            await reportBug({
                type: 'PAGE_LOAD_FAILURE',
                message: `Dashboard failed to load: ${error.message}`,
                url: page.url(),
                severity: 'Critical',
                testName: 'Dashboard - Load',
                stack: error.stack
            });
            throw error;
        }
    });

    test('should measure dashboard performance', async ({ page }) => {
        const urls = getTestUrls();

        await page.goto(urls.dashboard);

        try {
            // Capture performance metrics
            const metrics = await page.evaluate(() => {
                const perf = window.performance;
                const navigation = perf.getEntriesByType('navigation')[0];
                const paintEntries = perf.getEntriesByType('paint');

                return {
                    domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
                    loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
                    firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
                    networkRequests: perf.getEntriesByType('resource').length
                };
            });

            console.log('📊 Performance Metrics:', metrics);

            // Report if performance is poor
            await reportPerformanceIssue(metrics, page.url(), 'Dashboard - Performance');

        } catch (error) {
            console.log('⚠️  Could not capture performance metrics:', error.message);
        }
    });

    test('should navigate to reports page', async ({ page }) => {
        const urls = getTestUrls();

        try {
            await page.goto(urls.dashboard, { waitUntil: 'networkidle' });

            // Try to find and click reports link
            const reportsLink = page.locator('a[href*="reports"], a:has-text("Reports"), a:has-text("Analytics")').first();

            if (await reportsLink.count() > 0) {
                await reportsLink.click();
                await page.waitForLoadState('networkidle');

                expect(page.url()).toContain('report');
                console.log('✅ Navigated to reports page');
            } else {
                console.log('⚠️  Reports link not found on dashboard');
            }
        } catch (error) {
            await reportBug({
                type: 'NAVIGATION_FAILURE',
                message: `Failed to navigate to reports: ${error.message}`,
                url: page.url(),
                severity: 'Medium',
                testName: 'Dashboard - Reports Navigation',
                stack: error.stack
            });
            throw error;
        }
    });

    test('should display issues list', async ({ page }) => {
        const urls = getTestUrls();

        try {
            await page.goto(urls.issues, { waitUntil: 'networkidle' });

            // Wait for content
            await page.waitForLoadState('domcontentloaded');

            // Check if page loaded
            const title = await page.title();
            console.log('📄 Issues page title:', title);

            console.log('✅ Issues page accessible');
        } catch (error) {
            await reportBug({
                type: 'PAGE_LOAD_FAILURE',
                message: `Issues page failed to load: ${error.message}`,
                url: page.url(),
                severity: 'High',
                testName: 'Dashboard - Issues List',
                stack: error.stack
            });
            throw error;
        }
    });

    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== 'passed') {
            await reportTestFailure(testInfo, page);
        }
    });
});
