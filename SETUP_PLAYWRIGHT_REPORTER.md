# 🎭 Connect Playwright to Bug Tracker

To see your test failures in the Bug Tracker **Playwright Page**, you need to add a custom reporter to your test project (`employee-react-main-main`).

## Step 1: Copy the Reporter

I have created a reporter file for you here:
`C:\Users\user\Desktop\bug-tracker-v10\bug-tracker\integration\BugTrackerReporter.js`

**Copy this file** to your test project folder, for example:
`C:\Users\user\Desktop\employee-react-main-main (5)\employee-react-main-main\tests\helpers\BugTrackerReporter.js`
*(Create the `helpers` folder if it doesn't exist)*

## Step 2: Update `playwright.config.js`

Open your `playwright.config.js` in the `employee-react-main-main` project and update the `reporter` section:

```javascript
// playwright.config.js

module.exports = {
  // ... other config ...
  
  reporter: [
    ['list'], // Keep existing list/dot reporter
    ['./tests/helpers/BugTrackerReporter.js'] // Add this line!
  ],

  // ...
};
```

## Step 3: Run Your Tests Again

Run your tests as usual:
```bash
npx playwright test
```

## ✅ Result

Any **failed** tests will now automatically:
1. Be sent to the Bug Tracker
2. Appear on the **Playwright Page**
3. trigger "New Bug" notifications
