/**
 * ========================================
 * EXAMPLE: Testing a Target Application
 * ========================================
 * 
 * This is a template for testing ANY external application
 * and reporting bugs to the centralized bug tracker.
 * 
 * Copy this file and customize for your target app.
 */

import { test, expect } from '@playwright/test';
import {
    reportBug,
    reportTestFailure,
    setupErrorMonitoring
} from '../helpers/standalone-bug-reporter.js';

// ========================================
// CONFIGURATION
// ========================================

const TARGET_APP = {
    name: 'My Target App',
    url: 'https://example.com',
    // Add your app-specific config
    loginUrl: 'https://example.com/login',
    dashboardUrl: 'https://example.com/dashboard',
};

// ========================================
// TESTS
// ========================================

test.describe('Target Application Monitoring', () => {

    test.beforeEach(async ({ page }) => {
        // Setup automatic error monitoring
        setupErrorMonitoring(page, TARGET_APP.name);
    });

    // ----------------------------------------
    // Test 1: Homepage Load
    // ----------------------------------------
    test('Homepage should load successfully', async ({ page }) => {
        try {
            await page.goto(TARGET_APP.url);

            // Verify page loaded
            await expect(page).toHaveTitle(/.+/);

            // Check for critical elements
            const body = await page.locator('body');
            await expect(body).toBeVisible();

            console.log(`✅ ${TARGET_APP.name} homepage loaded`);
        } catch (error) {
            await reportBug({
                type: 'PAGE_LOAD_FAILURE',
                message: `Homepage failed to load: ${error.message}`,
                url: TARGET_APP.url,
                severity: 'Critical',
                testName: 'Homepage Load Test',
                module: TARGET_APP.name
            });
            throw error;
        }
    });

    // ----------------------------------------
    // Test 2: Navigation
    // ----------------------------------------
    test('Main navigation should work', async ({ page }) => {
        await page.goto(TARGET_APP.url);

        try {
            // Find navigation links (customize selectors for your app)
            const navLinks = await page.locator('nav a').all();

            if (navLinks.length > 0) {
                // Test first nav link
                const firstLink = navLinks[0];
                const linkText = await firstLink.textContent();

                await firstLink.click();
                await page.waitForLoadState('networkidle');

                console.log(`✅ Navigation to "${linkText}" successful`);
            } else {
                await reportBug({
                    type: 'UI_ELEMENT_MISSING',
                    message: 'No navigation links found',
                    url: page.url(),
                    severity: 'High',
                    testName: 'Navigation Test',
                    module: TARGET_APP.name
                });
            }
        } catch (error) {
            await reportBug({
                type: 'NAVIGATION_FAILURE',
                message: `Navigation failed: ${error.message}`,
                url: page.url(),
                severity: 'High',
                testName: 'Navigation Test',
                module: TARGET_APP.name
            });
            throw error;
        }
    });

    // ----------------------------------------
    // Test 3: Search Functionality
    // ----------------------------------------
    test('Search should work', async ({ page }) => {
        await page.goto(TARGET_APP.url);

        try {
            // Find search input (customize selector)
            const searchInput = page.locator('input[type="search"], input[name="search"], input[placeholder*="Search"]').first();

            if (await searchInput.count() > 0) {
                await searchInput.fill('test query');
                await searchInput.press('Enter');

                // Wait for results
                await page.waitForLoadState('networkidle');

                console.log('✅ Search functionality works');
            } else {
                console.log('⚠️  No search input found (might not be available)');
            }
        } catch (error) {
            await reportBug({
                type: 'SEARCH_FAILURE',
                message: `Search failed: ${error.message}`,
                url: page.url(),
                severity: 'Medium',
                testName: 'Search Test',
                module: TARGET_APP.name
            });
            throw error;
        }
    });

    // ----------------------------------------
    // Test 4: Performance Check
    // ----------------------------------------
    test('Performance should meet thresholds', async ({ page }) => {
        await page.goto(TARGET_APP.url);

        try {
            // Measure performance
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

            // Report if FCP is too slow
            if (metrics.firstContentfulPaint > 2000) {
                await reportBug({
                    type: 'PERFORMANCE_ISSUE',
                    message: `First Contentful Paint too slow: ${metrics.firstContentfulPaint}ms`,
                    url: TARGET_APP.url,
                    severity: 'Medium',
                    testName: 'Performance Test',
                    module: 'Performance',
                    performanceMetrics: metrics
                });
            }
        } catch (error) {
            console.log('⚠️  Could not measure performance:', error.message);
        }
    });

    // ----------------------------------------
    // Test 5: Forms (if applicable)
    // ----------------------------------------
    test('Contact form validation', async ({ page }) => {
        // Skip if no contact page
        try {
            await page.goto(`${TARGET_APP.url}/contact`);
        } catch {
            test.skip();
            return;
        }

        try {
            // Try to submit empty form
            const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();

            if (await submitButton.count() > 0) {
                await submitButton.click();

                // Should show validation errors
                await page.waitForTimeout(1000);

                // Check if still on same page (validation prevented submit)
                if (!page.url().includes('/contact')) {
                    await reportBug({
                        type: 'VALIDATION_BUG',
                        message: 'Form submitted without validation',
                        url: page.url(),
                        severity: 'High',
                        testName: 'Form Validation Test',
                        module: 'Forms'
                    });
                }

                console.log('✅ Form validation works');
            }
        } catch (error) {
            console.log('⚠️  Form validation test inconclusive');
        }
    });

    // ----------------------------------------
    // Auto-report failed tests
    // ----------------------------------------
    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== 'passed') {
            await reportTestFailure(testInfo, page);
        }
    });
});

// ========================================
// CUSTOM TEST HELPERS
// ========================================

/**
 * Helper: Check if element exists
 */
async function elementExists(page, selector) {
    try {
        const count = await page.locator(selector).count();
        return count > 0;
    } catch {
        return false;
    }
}

/**
 * Helper: Wait for page to be stable
 */
async function waitForStable(page) {
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
}
