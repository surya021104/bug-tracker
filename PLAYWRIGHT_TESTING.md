# Quick Test Guide

## Prerequisites Check

✅ Backend running on port 4000 (node server.js)
⚠️ Frontend should be running on port 5173 (npm run dev)

## Step 1: Start Frontend (if not running)

Open a new terminal and run:
```bash
npm run dev
```

Wait for: "Local: http://localhost:5173"

## Step 2: Run Playwright Tests

### Option A: Headless Mode (Recommended First)
```bash
npm run test:monitor
```

### Option B: Watch Tests Run (Headed Mode)
```bash
npm run test:monitor:headed
```

### Option C: Interactive UI (Best for Debugging)
```bash
npm run test:monitor:ui
```

## Step 3: Check Results

### In Terminal
- ✅ Green checkmarks = tests passed
- ❌ Red X = test failed (bug reported!)
- See summary at the end

### In Dashboard
1. Open: http://localhost:5173/issues
2. Look for bugs with:
   - `createdBy: "Auto-AI Monitor"`
   - `environment: "automated-testing"`

### View HTML Report
```bash
npm run test:monitor:report
```

## What to Expect

### Normal Test Run Output:
```
Running 8 tests using 2 workers

  ✓ Login Flow Monitoring › should display login page correctly (2.5s)
  ✓ Login Flow Monitoring › should show validation for empty credentials (1.8s)
  ✓ Login Flow Monitoring › should handle invalid credentials gracefully (2.1s)
  ✓ Login Flow Monitoring › should successfully login with valid credentials (3.2s)
  ✓ Dashboard & Reports Monitoring › should load dashboard without errors (1.9s)
  ✓ Dashboard & Reports Monitoring › should measure dashboard performance (2.3s)
  ✓ Dashboard & Reports Monitoring › should navigate to reports page (2.0s)
  ✓ Dashboard & Reports Monitoring › should display issues list (1.6s)

  8 passed (17.4s)
```

### If Test Fails (Bug Detected):
```
  ✗ Login Flow Monitoring › should display login page correctly (567ms)

    Error: locator.toBeVisible: Timeout 5000ms exceeded
    
  ✅ Bug reported successfully: BUG-1738067890123
```

## Troubleshooting

### "ECONNREFUSED" error
- Backend not running → Start with: `cd backend && node server.js`
- Wrong port → Check BACKEND_URL in bug-reporter.js

### "Navigation timeout"
- Frontend not running → Start with: `npm run dev`
- Page loading slowly → Increase timeout in playwright.monitor.config.js

### Tests hang/don't finish
- Press Ctrl+C to stop
- Run: `npx playwright kill-server`
- Try again

### "Cannot find module"
- Run: `npm install`
- Run: `npx playwright install`

## Quick Commands Reference

| Command | What It Does |
|---------|-------------|
| `npm run test:monitor` | Run all tests (headless) |
| `npm run test:monitor:headed` | Run with visible browser |
| `npm run test:monitor:ui` | Open interactive UI |
| `npm run test:monitor:report` | View HTML report |
| `npx playwright test --help` | See all options |

## Next: Verify Bugs Appear

After running tests, check:
1. Terminal output shows bugs reported
2. Dashboard shows new issues
3. Issues have navigation flow data
4. Performance metrics captured
