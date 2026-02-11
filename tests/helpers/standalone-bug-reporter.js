/**
 * ========================================
 * STANDALONE BUG REPORTER
 * ========================================
 * 
 * Use this file in ANY Playwright project to report bugs
 * to a centralized bug tracker system.
 * 
 * USAGE:
 * 1. Copy this file to your test project: tests/helpers/bug-reporter.js
 * 2. Set BUG_TRACKER_URL environment variable (or edit BACKEND_URL below)
 * 3. Import and use in your tests
 * 
 * EXAMPLE:
 * import { reportBug } from './helpers/bug-reporter.js';
 * 
 * await reportBug({
 *   type: 'PAGE_LOAD_FAILURE',
 *   message: 'Homepage failed to load',
 *   url: 'https://myapp.com',
 *   severity: 'Critical',
 *   testName: 'Homepage Test'
 * });
 */

// ========================================
// CONFIGURATION
// ========================================

/**
 * Bug Tracker Backend URL
 * 
 * Options:
 * 1. Set environment variable: BUG_TRACKER_URL
 * 2. Edit this constant directly
 * 3. Pass as parameter to reportBug()
 */
const BACKEND_URL = process.env.BUG_TRACKER_URL || 'http://localhost:4000';

/**
 * Application Name (customize for your target app)
 */
const APP_NAME = process.env.TARGET_APP_NAME || 'Target Application';

/**
 * Environment (staging, production, test, etc.)
 */
const ENVIRONMENT = process.env.TARGET_APP_ENV || 'automated-testing';

// ========================================
// CORE FUNCTIONS
// ========================================

/**
 * Report a bug to the centralized bug tracker
 * 
 * @param {Object} bugData - Bug information
 * @param {string} bugData.type - Bug type (e.g., 'PLAYWRIGHT_E2E_ERROR')
 * @param {string} bugData.message - Bug description
 * @param {string} bugData.url - URL where bug occurred
 * @param {string} bugData.severity - 'Critical', 'High', 'Medium', or 'Low'
 * @param {string} bugData.testName - Name of the test
 * @param {string} [bugData.module] - Application module/feature
 * @param {Object} [additionalData] - Any additional context
 * @param {string} [backendUrl] - Override backend URL
 */
export async function reportBug(bugData, additionalData = {}, backendUrl = null) {
    const targetUrl = backendUrl || BACKEND_URL;

    const payload = {
        type: bugData.type || 'PLAYWRIGHT_E2E_ERROR',
        message: bugData.message || 'Automated test failure',
        url: bugData.url || 'unknown',
        severity: bugData.severity || 'High',

        // Application context
        applicationUrl: bugData.url,
        applicationName: APP_NAME,
        module: bugData.module || APP_NAME,
        environment: ENVIRONMENT,

        // Test context
        testName: bugData.testName || 'Unknown Test',
        timestamp: new Date().toISOString(),

        // Additional data
        ...additionalData
    };

    try {
        const response = await fetch(`${targetUrl}/api/bugs/ingest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add authentication if needed:
                // 'Authorization': `Bearer ${process.env.BUG_TRACKER_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Bug reported to ${targetUrl}: ${result.bugId || 'created'}`);
            return result;
        } else {
            console.error(`❌ Bug report failed: ${response.status} ${response.statusText}`);
            const errorText = await response.text().catch(() => '');
            if (errorText) console.error('Response:', errorText);
            return null;
        }
    } catch (error) {
        console.error(`❌ Failed to send bug report to ${targetUrl}:`, error.message);
        return null;
    }
}

/**
 * Report test failure to bug tracker
 */
export async function reportTestFailure(testInfo, page) {
    const url = page ? page.url() : 'unknown';

    const bugData = {
        type: 'PLAYWRIGHT_TEST_FAILURE',
        message: `Test failed: ${testInfo.title}`,
        url: url,
        severity: 'High',
        testName: testInfo.title,
        testFile: testInfo.file,
        duration: testInfo.duration,
        retry: testInfo.retry
    };

    const additionalData = {};

    if (page) {
        try {
            additionalData.pageTitle = await page.title().catch(() => 'unknown');
            additionalData.viewport = page.viewportSize();
        } catch (e) {
            // Silent fail
        }
    }

    return await reportBug(bugData, additionalData);
}

/**
 * Report console error
 */
export async function reportConsoleError(consoleMessage, pageUrl, testName) {
    const bugData = {
        type: 'CONSOLE_ERROR',
        message: `Console Error: ${consoleMessage.text()}`,
        url: pageUrl,
        severity: 'Medium',
        testName: testName,
        consoleType: consoleMessage.type(),
        module: 'Console'
    };

    return await reportBug(bugData);
}

/**
 * Report network error
 */
export async function reportNetworkError(response, pageUrl, testName) {
    const bugData = {
        type: response.status() >= 500 ? 'API_ERROR' : 'NETWORK_ERROR',
        message: `${response.status()} ${response.statusText()}: ${response.url()}`,
        url: pageUrl,
        severity: response.status() >= 500 ? 'Critical' : 'High',
        testName: testName,
        apiUrl: response.url(),
        statusCode: response.status(),
        module: 'Network'
    };

    return await reportBug(bugData);
}

/**
 * Report accessibility violation
 */
export async function reportAccessibilityViolation(violation, pageUrl, testName) {
    const bugData = {
        type: 'ACCESSIBILITY_VIOLATION',
        message: `A11Y: ${violation.description}`,
        url: pageUrl,
        severity: violation.impact === 'critical' ? 'Critical' : 'Medium',
        testName: testName,
        wcagRule: violation.id,
        affectedElements: violation.nodes?.length || 0,
        helpUrl: violation.helpUrl,
        module: 'Accessibility'
    };

    return await reportBug(bugData);
}

/**
 * Report performance issue
 */
export async function reportPerformanceIssue(metrics, pageUrl, testName) {
    const issues = [];

    if (metrics.largestContentfulPaint > 2500) {
        issues.push({
            type: 'PERFORMANCE_ISSUE',
            message: `LCP exceeds 2.5s: ${metrics.largestContentfulPaint}ms`,
            url: pageUrl,
            severity: metrics.largestContentfulPaint > 4000 ? 'High' : 'Medium',
            testName: testName,
            performanceMetrics: metrics,
            module: 'Performance'
        });
    }

    if (metrics.firstContentfulPaint > 1800) {
        issues.push({
            type: 'PERFORMANCE_ISSUE',
            message: `FCP exceeds 1.8s: ${metrics.firstContentfulPaint}ms`,
            url: pageUrl,
            severity: 'Medium',
            testName: testName,
            performanceMetrics: metrics,
            module: 'Performance'
        });
    }

    const results = [];
    for (const issue of issues) {
        results.push(await reportBug(issue));
    }

    return results;
}

// ========================================
// HELPER: Setup Error Monitoring
// ========================================

/**
 * Setup automatic error monitoring for a Playwright page
 * Call this in your test.beforeEach()
 * 
 * @param {Page} page - Playwright page object
 * @param {string} testName - Name of the test
 */
export function setupErrorMonitoring(page, testName) {
    // Console errors
    page.on('console', async (msg) => {
        if (msg.type() === 'error') {
            await reportConsoleError(msg, page.url(), testName);
        }
    });

    // Network errors
    page.on('response', async (response) => {
        if (response.status() >= 400) {
            await reportNetworkError(response, page.url(), testName);
        }
    });

    // Page crashes
    page.on('crash', async () => {
        await reportBug({
            type: 'PAGE_CRASH',
            message: 'Page crashed',
            url: page.url(),
            severity: 'Critical',
            testName: testName
        });
    });

    console.log(`🔍 Error monitoring active for: ${testName}`);
}

// ========================================
// EXPORTS
// ========================================

export default {
    reportBug,
    reportTestFailure,
    reportConsoleError,
    reportNetworkError,
    reportAccessibilityViolation,
    reportPerformanceIssue,
    setupErrorMonitoring
};
