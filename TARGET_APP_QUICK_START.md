# Quick Reference: Testing Target Apps

## 🎯 Copy These Files for Target App Testing

### Essential Files to Copy:
1. **Bug Reporter:** `tests/helpers/standalone-bug-reporter.js`
   - Copy to your target app test project
   - Configure `BUG_TRACKER_URL` 

2. **Example Test:** `tests/examples/target-app-example.spec.js`
   - Use as template for your tests
   - Customize selectors and URLs

## 📋 Quick Setup Checklist

- [ ] Create new test project directory
- [ ] Copy `standalone-bug-reporter.js`
- [ ] Install Playwright: `npm install -D @playwright/test`
- [ ] Create `playwright.config.js` with target app URL
- [ ] Set `BUG_TRACKER_URL` environment variable
- [ ] Write tests using `reportBug()`
- [ ] Run tests: `npx playwright test`
- [ ] Check bugs in dashboard: `http://localhost:5173/issues`

## 🚀 Quickest Method

```bash
# From bug tracker directory
node scripts/setup-target-app.js
```

This interactive script will:
✅ Create project structure
✅ Copy bug reporter
✅ Generate config files
✅ Create example tests

## 🔧 Manual Setup (3 steps)

### Step 1: Copy Bug Reporter
```bash
cp tests/helpers/standalone-bug-reporter.js /path/to/your-tests/helpers/
```

### Step 2: Create Test
```javascript
import { reportBug, setupErrorMonitoring } from './helpers/bug-reporter.js';

test('test name', async ({ page }) => {
  setupErrorMonitoring(page, 'Your App');
  
  await page.goto('https://your-app.com');
  
  // Test logic...
  // Bugs automatically reported!
});
```

### Step 3: Run
```bash
npx playwright test
```

## 📊 View Results

All bugs appear at: `http://localhost:5173/issues`

Filter by:
- `environment: "automated-testing"`
- `applicationName: "Your App Name"`

---

**Full Guide:** See [TARGET_APP_TESTING_GUIDE.md](./TARGET_APP_TESTING_GUIDE.md)
