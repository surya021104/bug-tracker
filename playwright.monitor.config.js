// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for E2E Monitoring
 * 
 * This configuration is specifically for automated monitoring tests
 * that report bugs to the bug tracker system
 */
export default defineConfig({
    testDir: './tests',

    // Only run monitoring tests (not regular functional tests)
    testMatch: ['**/e2e-monitoring/**/*.spec.js'],

    // Run tests in parallel for faster execution
    fullyParallel: true,

    // Retry failed tests once (helps reduce false positives)
    retries: 1,

    // Use 2 workers for parallel execution
    workers: 2,

    // Reporter configuration
    reporter: [
        ['html', { outputFolder: 'playwright-report-monitoring', open: 'never' }],
        ['json', { outputFile: 'test-results-monitoring.json' }],
        ['list'] // Console output
    ],

    // Timeout for each test
    timeout: 30000,

    // Global timeout for entire test run
    globalTimeout: 600000, // 10 minutes

    // Shared settings for all tests
    use: {
        // Base URL for the application
        baseURL: process.env.FRONTEND_URL || 'http://localhost:5173',

        // Capture trace on first retry (useful for debugging)
        trace: 'on-first-retry',

        // Screenshot only on failure
        screenshot: 'only-on-failure',

        // Video only on failure
        video: 'retain-on-failure',

        // Browser context options
        viewport: { width: 1280, height: 720 },

        // Ignore HTTPS errors (for development)
        ignoreHTTPSErrors: true,

        // Navigation timeout
        navigationTimeout: 15000,

        // Action timeout
        actionTimeout: 10000,
    },

    // Test projects (browsers to test)
    projects: [
        // Setup project - runs authentication before tests
        {
            name: 'setup',
            testMatch: /.*\.setup\.js/,
        },

        // Chromium tests (primary browser)
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Use saved authentication state
                storageState: 'tests/.auth/user.json'
            },
            dependencies: ['setup'],
        },

        // Optional: Firefox tests
        // {
        //   name: 'firefox',
        //   use: { 
        //     ...devices['Desktop Firefox'],
        //     storageState: 'tests/.auth/user.json'
        //   },
        //   dependencies: ['setup'],
        // },

        // Optional: WebKit tests
        // {
        //   name: 'webkit',
        //   use: { 
        //     ...devices['Desktop Safari'],
        //     storageState: 'tests/.auth/user.json'
        //   },
        //   dependencies: ['setup'],
        // },
    ],

    // Web server configuration
    // Starts your app before running tests
    webServer: {
        command: process.env.FRONTEND_URL ? 'echo "Using deployed frontend at $FRONTEND_URL"' : 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true, // Don't restart if already running
        timeout: 120000, // 2 minutes to start
        stdout: 'ignore',
        stderr: 'pipe',
    },
});
