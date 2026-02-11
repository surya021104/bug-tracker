import XLSX from 'xlsx';

/**
 * Flexible Excel Test Case Parser
 * Handles various column naming conventions
 */

// Column name patterns to search for (case-insensitive)
const COLUMN_PATTERNS = {
    testId: ['test case id', 'test case #', 'testcase id', 'tc id', 'id', 'test id'],
    scenario: ['scenario', 'test description', 'description', 'test case', 'test name', 'name'],
    module: ['module', 'category', 'feature', 'component'],
    expectedResult: ['expected result', 'expected output', 'expected behavior', 'expected', 'result'],
    steps: ['steps', 'test steps', 'steps to reproduce', 'procedure'],
    priority: ['priority', 'severity', 'importance']
};

/**
 * Find column name that matches any pattern
 * @param {Array} headers - Array of column headers from Excel
 * @param {Array} patterns - Array of possible column names
 * @returns {string|null} - Matched column name or null
 */
function findColumn(headers, patterns) {
    const lowerHeaders = headers.map(h => (h || '').toString().toLowerCase().trim());

    for (const pattern of patterns) {
        const index = lowerHeaders.findIndex(h => h.includes(pattern));
        if (index !== -1) {
            return headers[index];
        }
    }
    return null;
}

/**
 * Parse Excel file buffer and extract test cases
 * @param {Buffer} fileBuffer - Excel file buffer
 * @returns {Array} - Array of test case objects
 */
export function parseExcelTestCases(fileBuffer) {
    try {
        // Read the Excel file
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonData || jsonData.length === 0) {
            throw new Error('Excel file is empty or has no data');
        }

        // Get headers from first row
        const headers = Object.keys(jsonData[0]);

        // Find relevant columns
        const columns = {
            testId: findColumn(headers, COLUMN_PATTERNS.testId),
            scenario: findColumn(headers, COLUMN_PATTERNS.scenario),
            module: findColumn(headers, COLUMN_PATTERNS.module),
            expectedResult: findColumn(headers, COLUMN_PATTERNS.expectedResult),
            steps: findColumn(headers, COLUMN_PATTERNS.steps),
            priority: findColumn(headers, COLUMN_PATTERNS.priority)
        };

        console.log('📊 Detected columns:', columns);

        // Validate required columns
        if (!columns.testId && !columns.scenario) {
            throw new Error('Could not find Test ID or Scenario column. Please ensure your Excel has at least one of these columns.');
        }

        // Parse test cases
        const testCases = jsonData.map((row, index) => {
            const testId = columns.testId ? row[columns.testId] : `TC-${index + 1}`;
            const scenario = columns.scenario ? row[columns.scenario] : 'Test Case';
            const module = columns.module ? row[columns.module] : 'General';
            const expectedResult = columns.expectedResult ? row[columns.expectedResult] : '';
            const steps = columns.steps ? row[columns.steps] : '';
            const priority = columns.priority ? row[columns.priority] : 'Medium';

            // Skip empty rows
            if (!testId && !scenario) {
                return null;
            }

            return {
                testId: testId.toString().trim(),
                scenario: scenario.toString().trim(),
                module: module.toString().trim(),
                expectedResult: expectedResult.toString().trim(),
                steps: steps.toString().trim(),
                priority: priority.toString().trim()
            };
        }).filter(tc => tc !== null); // Remove null entries

        console.log(`✅ Parsed ${testCases.length} test cases from Excel`);

        return testCases;

    } catch (error) {
        console.error('❌ Excel parsing failed:', error);
        throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
}

/**
 * Validate test cases array
 * @param {Array} testCases - Array of test case objects
 * @returns {Object} - Validation result
 */
export function validateTestCases(testCases) {
    if (!Array.isArray(testCases) || testCases.length === 0) {
        return {
            valid: false,
            message: 'No test cases found in the Excel file'
        };
    }

    const invalidCases = testCases.filter(tc => !tc.testId || !tc.scenario);

    if (invalidCases.length > 0) {
        return {
            valid: false,
            message: `${invalidCases.length} test case(s) are missing required fields (Test ID or Scenario)`
        };
    }

    return {
        valid: true,
        count: testCases.length
    };
}
