/**
 * ========================================
 * PLAYWRIGHT BUG REPORTER UTILITY
 * ========================================
 * 
 * Helper utility to report bugs from Playwright tests
 * to the bug tracker's /api/bugs/ingest endpoint
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

/**
 * Report a bug to the bug tracker system
 * @param {Object} bugData - Bug information
 * @param {string} bugData.type - Bug type (e.g., 'PLAYWRIGHT_E2E_ERROR')
 * @param {string} bugData.message - Bug description
 * @param {string} bugData.severity - Severity level ('Critical', 'High', 'Medium', 'Low')
 * @param {Object} additionalData - Any additional context
 */
export async function reportBug(bugData, additionalData = {}) {
    const payload = {
        type: bugData.type || 'PLAYWRIGHT_E2E_ERROR',
        message: bugData.message || 'Automated test failure',
        url: bugData.url || 'unknown',
        severity: bugData.severity || 'High',
        environment: 'automated-testing',
        testName: bugData.testName || 'Unknown Test',
        timestamp: new Date().toISOString(),
        ...additionalData
    };

    try {
        const response = await fetch(`${BACKEND_URL}/api/bugs/ingest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Bug reported successfully: ${result.bugId || 'created'}`);
            return result;
        } else {
            console.error(`❌ Bug report failed with status: ${response.status}`);
            const errorText = await response.text();
            console.error('Response:', errorText);
            return null;
        }
    } catch (error) {
        console.error('❌ Failed to send bug report:', error.message);
        return null;
    }
}

/**
 * Report test failure to bug tracker
 * @param {Object} testInfo - Playwright test info object
 * @param {Object} page - Playwright page object
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

    // Capture additional context if page is available
    const additionalData = {};

    if (page) {
        try {
            // Capture console errors
            const consoleLogs = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleLogs.push(msg.text());
                }
            });
            if (consoleLogs.length > 0) {
                additionalData.consoleErrors = consoleLogs;
            }

            // Capture page title
            additionalData.pageTitle = await page.title().catch(() => 'unknown');

            // Capture viewport size
            additionalData.viewport = page.viewportSize();
        } catch (e) {
            // Silent fail - don't let reporting errors break the test
        }
    }

    return await reportBug(bugData, additionalData);
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

    // Check for slow LCP
    if (metrics.largestContentfulPaint > 2500) {
        issues.push({
            type: 'PERFORMANCE_ISSUE',
            message: `Largest Contentful Paint exceeds 2.5s: ${metrics.largestContentfulPaint}ms`,
            url: pageUrl,
            severity: metrics.largestContentfulPaint > 4000 ? 'High' : 'Medium',
            testName: testName,
            performanceMetrics: metrics,
            module: 'Performance'
        });
    }

    // Check for slow FCP
    if (metrics.firstContentfulPaint > 1800) {
        issues.push({
            type: 'PERFORMANCE_ISSUE',
            message: `First Contentful Paint exceeds 1.8s: ${metrics.firstContentfulPaint}ms`,
            url: pageUrl,
            severity: 'Medium',
            testName: testName,
            performanceMetrics: metrics,
            module: 'Performance'
        });
    }

    // Report all issues
    const results = [];
    for (const issue of issues) {
        results.push(await reportBug(issue));
    }

    return results;
}

/**
 * Report console error from page
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
