#!/usr/bin/env node

/**
 * Quick Start Script for Testing Target Applications
 * 
 * This script helps you quickly set up Playwright tests
 * for a new target application.
 * 
 * Usage:
 *   node scripts/setup-target-app.js
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';

const execAsync = promisify(exec);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log('\n🚀 Target App Testing Setup\n');
    console.log('This will help you set up Playwright tests for a new target application.\n');

    // Get app details
    const appName = await question('Target app name (e.g., "My E-Commerce Site"): ');
    const appUrl = await question('Target app URL (e.g., "https://example.com"): ');
    const projectName = await question('Test project directory name (e.g., "my-app-tests"): ');

    console.log('\n📦 Setting up project...\n');

    // Create directory
    const projectPath = join(process.cwd(), '..', projectName);

    try {
        await fs.mkdir(projectPath, { recursive: true });
        await fs.mkdir(join(projectPath, 'tests', 'helpers'), { recursive: true });
        await fs.mkdir(join(projectPath, 'tests', 'e2e'), { recursive: true });
    } catch (error) {
        console.error('Error creating directories:', error.message);
        process.exit(1);
    }

    // Create package.json
    const packageJson = {
        name: projectName,
        version: '1.0.0',
        type: 'module',
        scripts: {
            test: 'playwright test',
            'test:headed': 'playwright test --headed',
            'test:ui': 'playwright test --ui',
            'test:report': 'playwright show-report'
        },
        devDependencies: {
            '@playwright/test': '^1.57.0'
        }
    };

    await fs.writeFile(
        join(projectPath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );

    // Copy bug reporter
    const bugReporterSource = join(process.cwd(), 'tests', 'helpers', 'standalone-bug-reporter.js');
    const bugReporterDest = join(projectPath, 'tests', 'helpers', 'bug-reporter.js');

    try {
        await fs.copyFile(bugReporterSource, bugReporterDest);
    } catch (error) {
        console.error('⚠️  Could not copy bug-reporter.js:', error.message);
    }

    // Create .env file
    const envContent = `# Bug Tracker Configuration
BUG_TRACKER_URL=http://localhost:4000
TARGET_APP_NAME=${appName}
TARGET_APP_URL=${appUrl}
TARGET_APP_ENV=production
`;

    await fs.writeFile(join(projectPath, '.env'), envContent);

    // Create playwright.config.js
    const playwrightConfig = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 1,
  workers: 2,
  
  reporter: [
    ['html'],
    ['list']
  ],
  
  use: {
    baseURL: '${appUrl}',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
`;

    await fs.writeFile(join(projectPath, 'playwright.config.js'), playwrightConfig);

    // Create example test
    const exampleTest = `import { test, expect } from '@playwright/test';
import { reportBug, setupErrorMonitoring } from '../helpers/bug-reporter.js';

test.describe('${appName} - Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    setupErrorMonitoring(page, '${appName}');
  });

  test('Homepage should load', async ({ page }) => {
    try {
      await page.goto('/');
      await expect(page).toHaveTitle(/.+/);
      console.log('✅ Homepage loaded successfully');
    } catch (error) {
      await reportBug({
        type: 'PAGE_LOAD_FAILURE',
        message: \`Homepage failed: \${error.message}\`,
        url: page.url(),
        severity: 'Critical',
        testName: 'Homepage Load',
        module: '${appName}'
      });
      throw error;
    }
  });
});
`;

    await fs.writeFile(join(projectPath, 'tests', 'e2e', 'homepage.spec.js'), exampleTest);

    // Create README
    const readme = `# ${appName} - Playwright Tests

## Setup

\`\`\`bash
npm install
npx playwright install
\`\`\`

## Run Tests

\`\`\`bash
npm test              # Headless
npm run test:headed   # With browser
npm run test:ui       # Interactive UI
\`\`\`

## Configuration

Edit \`.env\` to change:
- BUG_TRACKER_URL
- TARGET_APP_URL
- Environment settings

All detected bugs will automatically appear in the bug tracker!
`;

    await fs.writeFile(join(projectPath, 'README.md'), readme);

    console.log('✅ Project created successfully!\n');
    console.log(`📁 Location: ${projectPath}\n`);
    console.log('Next steps:');
    console.log(`  1. cd ../${projectName}`);
    console.log('  2. npm install');
    console.log('  3. npx playwright install');
    console.log('  4. npm test\n');
    console.log('All bugs will be reported to: http://localhost:4000\n');

    rl.close();
}

main().catch(console.error);
