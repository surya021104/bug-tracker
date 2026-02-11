/**
 * Playwright Test Case Generator
 * Generates .spec.js files from parsed test case data
 */

/**
 * Infer URL route from module name
 * @param {string} module - Module/feature name
 * @returns {string} - Inferred URL route
 */
function inferRoute(module) {
    if (!module) return '/';

    // Clean and normalize module name
    const cleaned = module
        .toLowerCase()
        .replace(/test cases?/gi, '')
        .replace(/positive|negative|functional/gi, '')
        .trim();

    // Common module to route mappings
    const routeMap = {
        'employee': '/employees',
        'leave': '/leave',
        'payroll': '/payroll',
        'dashboard': '/dashboard',
        'login': '/login',
        'timesheet': '/timesheet',
        'project': '/projects',
        'report': '/reports',
        'setting': '/settings',
        'attendance': '/attendance'
    };

    // Check if cleaned module matches any known routes
    for (const [key, route] of Object.entries(routeMap)) {
        if (cleaned.includes(key)) {
            return route;
        }
    }

    // Default: convert to route format
    if (cleaned) {
        return `/${cleaned.replace(/\s+/g, '-')}`;
    }

    return '/';
}

/**
 * Generate a single test case function
 * @param {Object} testCase - Test case object
 * @returns {string} - Generated test code
 */
function generateTestCase(testCase) {
    const { testId, scenario, module, expectedResult, steps } = testCase;
    const route = inferRoute(module);
    const moduleTag = module.toUpperCase().replace(/\s+/g, '_');

    return `
test('${testId}: ${scenario}', async ({ page }) => {
  console.log('🧪 [${moduleTag}] ${testId}: ${scenario}');
  
  // Navigate to the module
  await page.goto('${route}');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  
  // TODO: Implement test steps
  ${steps ? `// Steps: ${steps.substring(0, 100)}${steps.length > 100 ? '...' : ''}` : '// Add your test logic here'}
  
  // Expected Result: ${expectedResult || 'Verify the scenario works as expected'}
  
  // Basic page load verification
  const mainContent = page.locator('main, [role="main"], .main-content').first();
  
  if (await mainContent.isVisible().catch(() => false)) {
    console.log('✅ Page loaded successfully');
  } else {
    console.log('⚠️ Main content not found - page may not have loaded correctly');
  }
  
  // TODO: Add specific assertions and validations
  // Example:
  // await expect(page.locator('selector')).toBeVisible();
  // await page.click('button');
  // await page.fill('input', 'value');
});
`;
}

/**
 * Generate complete Playwright spec file
 * @param {Array} testCases - Array of test case objects
 * @param {string} fileName - Optional custom file name
 * @returns {string} - Complete spec.js file content
 */
export function generatePlaywrightSpec(testCases, fileName = 'generated-tests.spec.js') {
    if (!testCases || testCases.length === 0) {
        throw new Error('No test cases provided for generation');
    }

    // Group test cases by module
    const groupedTests = {};
    testCases.forEach(tc => {
        const module = tc.module || 'General';
        if (!groupedTests[module]) {
            groupedTests[module] = [];
        }
        groupedTests[module].push(tc);
    });

    // Generate file header
    let specContent = `/**
 * Auto-generated Playwright Test Cases
 * Generated on: ${new Date().toLocaleString()}
 * Total Test Cases: ${testCases.length}
 * 
 * ⚠️ IMPORTANT: This is a template file. Please review and customize:
 * - Add specific selectors for your application
 * - Implement detailed test steps and assertions
 * - Update routes/URLs to match your application
 * - Add necessary fixtures or page objects
 */

import { test, expect } from '@playwright/test';

// Optional: Add custom fixtures or setup here
// test.beforeEach(async ({ page }) => {
//   // Common setup
// });

`;

    // Generate test cases grouped by module
    Object.entries(groupedTests).forEach(([module, tests]) => {
        specContent += `\n// ==========================================\n`;
        specContent += `// ${module.toUpperCase()} MODULE TESTS\n`;
        specContent += `// ==========================================\n`;

        tests.forEach(testCase => {
            specContent += generateTestCase(testCase);
        });
    });

    // Add footer with helpful comments
    specContent += `\n// ==========================================\n`;
    specContent += `// HELPER FUNCTIONS (Optional)\n`;
    specContent += `// ==========================================\n\n`;
    specContent += `// Add any reusable helper functions here\n`;
    specContent += `// Example:\n`;
    specContent += `// async function login(page, username, password) {\n`;
    specContent += `//   await page.fill('#username', username);\n`;
    specContent += `//   await page.fill('#password', password);\n`;
    specContent += `//   await page.click('button[type="submit"]');\n`;
    specContent += `// }\n`;

    return specContent;
}

/**
 * Generate summary statistics for the generated tests
 * @param {Array} testCases - Array of test case objects
 * @returns {Object} - Summary statistics
 */
export function generateSummary(testCases) {
    const modules = [...new Set(testCases.map(tc => tc.module))];
    const priorities = testCases.reduce((acc, tc) => {
        acc[tc.priority] = (acc[tc.priority] || 0) + 1;
        return acc;
    }, {});

    return {
        totalTests: testCases.length,
        modules: modules,
        moduleCount: modules.length,
        priorityDistribution: priorities
    };
}
