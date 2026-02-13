/**
 * Custom Playwright Reporter for Bug Tracker
 * 
 * Instructions:
 * 1. Copy this file to your test project (e.g., helpers/BugTrackerReporter.js)
 * 2. Update playwright.config.js to use it:
 *    reporter: [
 *      ['list'],
 *      ['./helpers/BugTrackerReporter.js']
 *    ],
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

class BugTrackerReporter {
    constructor() {
        this.endpoint = 'http://localhost:4000/api/issues';
    }

    onBegin(config, suite) {
        console.log(`Starting test run with ${suite.allTests().length} tests`);
    }

    async onTestEnd(test, result) {
        if (result.status === 'failed' || result.status === 'timedOut') {
            console.log(`❌ Test Failed: ${test.title}`);
            await this.reportBug(test, result);
        }
    }

    async reportBug(test, result) {
        try {
            const error = result.error;
            const title = `[Playwright] ${test.title}`;
            let description = `Test failed in ${test.location.file}:${test.location.line}\n\n`;

            if (error) {
                description += `Error: ${error.message}\n\n`;
                if (error.stack) {
                    description += `Stack:\n${error.stack}\n`;
                }
            }

            // Extract project/browser name
            const project = test.parent?.project()?.name || 'Chromium';

            const bugData = {
                title: title,
                description: description,
                severity: "High", // Default for test failures
                createdBy: "BugBuddy",
                type: "Automated Test",
                appName: "Employee Portal", // You can customize this
                browser: project,
                environment: "Test",
                steps: [
                    { order: 1, action: "Run BugBuddy Test", description: test.title },
                    { order: 2, action: "Verify Result", description: "Test Failed" }
                ]
            };

            // Use fetch to send without external dependencies if possible, 
            // but in Node environment we might need 'node-fetch' or built-in 'http'
            // Using built-in http for zero-dependencies
            await this.sendRequest(bugData);

        } catch (err) {
            console.error('Failed to report bug to tracker:', err);
        }
    }

    sendRequest(data) {
        return new Promise((resolve, reject) => {
            const backendUrl = process.env.BACKEND_URL || process.env.BUG_TRACKER_API_URL || 'http://localhost:4000';
            let url;
            try {
                url = new URL(backendUrl);
            } catch (e) {
                console.error(`   ⚠️ Invalid BACKEND_URL: ${backendUrl}`);
                return resolve();
            }

            const protocol = url.protocol === 'https:' ? https : http;
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: '/api/issues',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            const req = protocol.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const responseData = JSON.parse(body);
                            console.log(`   ✅ Bug reported: ${responseData.issue?.id || 'Success'}`);
                        } catch (e) {
                            console.log(`   ✅ Bug reported successfully`);
                        }
                        resolve();
                    } else {
                        console.error(`   ⚠️ Failed to report bug: ${res.statusCode} ${body}`);
                        resolve();
                    }
                });
            });

            req.on('error', (e) => {
                console.error(`   ⚠️ Bug Tracker unreachable (${backendUrl}): ${e.message}`);
                resolve();
            });

            req.write(JSON.stringify(data));
            req.end();
        });
    }
}

export default BugTrackerReporter;
