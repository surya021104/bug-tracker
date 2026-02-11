# Playwright E2E Monitoring - Quick Start Guide

## 🎯 What This Does

This Playwright integration automatically **detects bugs and reports them** to your bug tracker system through the existing `/api/bugs/ingest` endpoint.

**Bug types detected:**
- ✅ JavaScript runtime errors
- ✅ Console errors
- ✅ Network failures (API errors, 4xx, 5xx)
- ✅ UI element missing/broken
- ✅ Navigation failures
- ✅ Validation bugs
- ✅ Performance issues
- ✅ Page crashes

## 📁 What Was Created

```
tests/
├── helpers/
│   ├── bug-reporter.js      # Utility to report bugs to backend
│   └── test-data.js          # Test data generators
├── e2e-monitoring/
│   ├── login.spec.js         # Login flow tests
│   └── dashboard.spec.js     # Dashboard & reports tests
├── auth.setup.js             # Authentication setup
└── .auth/                    # Saved authentication state
playwright.monitor.config.js  # Monitoring configuration
```

## 🚀 How to Run Tests

### 1. **Make sure your backend is running**
```bash
cd backend
node server.js
```

### 2. **Run monitoring tests** (headless mode)
```bash
npm run test:monitor
```

### 3. **Run with UI** (see tests execute in browser)
```bash
npm run test:monitor:headed
```

### 4. **Interactive UI mode** (debug tests)
```bash
npm run test:monitor:ui
```

### 5. **View test report**
```bash
npm run test:monitor:report
```

## 🔍 How It Works

```mermaid
graph LR
    A[Playwright Test] -->|Detects Error| B[bug-reporter.js]
    B -->|POST| C[/api/bugs/ingest]
    C -->|Processes| D[Backend Server]
    D -->|Stores| E[MongoDB]
    E -->|Updates| F[Dashboard]
```

### Example: When a test runs

1. **Test navigates** to login page
2. **Monitors** for console errors, network failures
3. **Detects** any issues (missing elements, crashes, etc.)
4. **Reports** to backend via `reportBug()` function
5. **Bug appears** in your dashboard automatically! 🎉

## 📊 What Gets Reported

When a bug is found, the system reports:

```javascript
{
  type: 'PLAYWRIGHT_TEST_FAILURE',
  message: 'Login button not found',
  url: 'http://localhost:5173/login',
  severity: 'High',
  testName: 'Login Flow - Elements Visibility',
  environment: 'automated-testing',
  timestamp: '2026-01-27T12:00:00Z'
}
```

## 📝 Available Test Scripts

| Command | Description |
|---------|-------------|
| `npm run test:monitor` | Run all monitoring tests (headless) |
| `npm run test:monitor:headed` | Run tests with visible browser |
| `npm run test:monitor:ui` | Open Playwright UI for debugging |
| `npm run test:monitor:report` | View HTML test report |

## 🧪 Current Test Coverage

### Login Flow (`login.spec.js`)
- ✅ Login page displays correctly
- ✅ Validation for empty credentials
- ✅ Invalid credentials handling
- ✅ Successful login with valid credentials

### Dashboard (`dashboard.spec.js`)
- ✅ Dashboard loads without errors
- ✅ Performance metrics capture
- ✅ Navigation to reports
- ✅ Issues list accessibility

## 🔧 Configuration

### Test User Credentials
Edit `tests/helpers/test-data.js`:
```javascript
export function getTestUser() {
  return {
    email: 'test@bugtracker.com',  // ← Change this
    password: 'TestPassword123!',   // ← Change this
    name: 'Test User'
  };
}
```

### Backend URL
By default, tests use `http://localhost:4000` for the backend.

To change, set environment variable:
```bash
$env:BACKEND_URL="http://your-backend:port"
npm run test:monitor
```

### Test Timeouts
Edit `tests/helpers/test-data.js`:
```javascript
export const TIMEOUTS = {
  short: 5000,      // 5 seconds
  medium: 10000,    // 10 seconds
  long: 30000,      // 30 seconds
};
```

## 📈 Next Steps

### Add More Tests
Create new test files in `tests/e2e-monitoring/`:

```javascript
// tests/e2e-monitoring/issue-creation.spec.js
import { test } from '@playwright/test';
import { reportBug } from '../helpers/bug-reporter.js';

test.use({ storageState: 'tests/.auth/user.json' });

test('should create new issue', async ({ page }) => {
  await page.goto('http://localhost:5173/issues/new');
  // ... your test logic
});
```

### Schedule Tests
Run tests automatically every hour using GitHub Actions, cron jobs, or task scheduler.

**Example: GitHub Actions** (`.github/workflows/playwright-monitor.yml`)
```yaml
name: Playwright Monitoring
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:monitor
```

## 🐛 Troubleshooting

### Tests fail with "Cannot find module"
```bash
# Make sure Playwright is installed
npm install
npx playwright install
```

### Authentication fails
- Check credentials in `tests/helpers/test-data.js`
- Make sure user exists in your database
- Check if login flow changed in your app

### Tests don't report bugs
- Verify backend is running on port 4000
- Check backend logs for errors
- Test endpoint manually:
```bash
curl -X POST http://localhost:4000/api/bugs/ingest \
  -H "Content-Type: application/json" \
  -d '{"type":"TEST","message":"Test bug"}'
```

### Browser doesn't close after test
- Use Ctrl+C to stop
- Run: `npx playwright kill-server`

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Architecture Document](./playwright-integration-architecture.md)
- [Task Tracker](./task.md)

## ✨ Features

✅ **Zero impact on existing code** - All tests are separate  
✅ **Automatic bug reporting** - Integrates with `/api/bugs/ingest`  
✅ **Multiple browsers** - Test on Chromium, Firefox, WebKit  
✅ **Retry logic** - Reduces false positives  
✅ **Screenshots & videos** - Captured on failures  
✅ **Performance monitoring** - Track page load metrics  

---

**Need help?** Check the architecture document for detailed information about all 5 integration approaches!
