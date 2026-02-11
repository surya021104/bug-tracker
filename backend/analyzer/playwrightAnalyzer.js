// backend/analyzer/playwrightAnalyzer.js
import { chromium } from "playwright";

export async function analyzeApp(url) {
  const signals = [];
  let browser;

  try {
    console.log(`🔍 Analyzing ${url}...`);

    // Launch browser
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // ==========================================
    // 1. TRACK RUNTIME ERRORS
    // ==========================================
    page.on('console', msg => {
      if (msg.type() === 'error') {
        signals.push({
          signalType: "JS_RUNTIME_ERROR",
          type: "error",
          message: msg.text(),
          url: page.url(),
          severity: "High"
        });
      }
    });

    page.on('pageerror', error => {
      signals.push({
        signalType: "JS_RUNTIME_ERROR",
        type: "error",
        message: error.message,
        stack: error.stack,
        url: page.url(),
        severity: "High"
      });
    });

    // ==========================================
    // 2. TRACK API ERRORS
    // ==========================================
    page.on('response', async response => {
      if (response.status() >= 400) {
        signals.push({
          signalType: "API_ERROR",
          type: "network",
          endpoint: response.url(),
          statusCode: response.status(),
          message: `${response.status()} ${response.statusText()}`,
          url: page.url(),
          severity: response.status() >= 500 ? "Critical" : "High"
        });
      }
    });

    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // Let page settle

    // ==========================================
    // 3. TRACK BUTTON FAILURES
    // ==========================================
    console.log('🔘 Testing buttons...');

    const buttons = await page.$$('button, [role="button"], input[type="submit"], input[type="button"]');
    console.log(`   Found ${buttons.length} buttons`);

    // Test first 10 buttons
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      try {
        const button = buttons[i];

        // Get button info
        const buttonInfo = await button.evaluate(btn => ({
          text: btn.textContent?.trim() || btn.value || btn.getAttribute('aria-label') || 'Unknown',
          id: btn.id || '',
          className: btn.className || '',
          disabled: btn.disabled
        }));

        // Skip disabled buttons
        if (buttonInfo.disabled) continue;

        // Capture state before click
        const beforeUrl = page.url();
        const beforeTitle = await page.title();

        // Click button
        await button.click({ timeout: 1000, force: false });

        // Wait for potential response
        await page.waitForTimeout(1500);

        // Capture state after click
        const afterUrl = page.url();
        const afterTitle = await page.title();

        // Check if anything changed
        const urlChanged = beforeUrl !== afterUrl;
        const titleChanged = beforeTitle !== afterTitle;
        const hasLoading = await page.locator('[class*="loading"], [class*="spinner"], [aria-busy="true"]').count() > 0;
        const hasModal = await page.locator('[role="dialog"], [class*="modal"]').count() > 0;

        const somethingHappened = urlChanged || titleChanged || hasLoading || hasModal;

        // If nothing happened, it's likely a broken button
        if (!somethingHappened) {
          signals.push({
            signalType: "UI_INTERACTION_FAILURE",
            type: "button_failure",
            message: `Button "${buttonInfo.text}" clicked but no response detected`,
            buttonText: buttonInfo.text,
            buttonId: buttonInfo.id,
            buttonClass: buttonInfo.className,
            failureType: 'NO_RESPONSE',
            url: page.url(),
            severity: "Medium"
          });

          console.log(`   ❌ Button failed: "${buttonInfo.text}"`);
        } else {
          console.log(`   ✅ Button works: "${buttonInfo.text}"`);
        }

      } catch (e) {
        // Button not clickable or other issue - skip it
        continue;
      }
    }

    // Summary
    const runtimeErrors = signals.filter(s => s.signalType === 'JS_RUNTIME_ERROR').length;
    const apiErrors = signals.filter(s => s.signalType === 'API_ERROR').length;
    const buttonErrors = signals.filter(s => s.signalType === 'UI_INTERACTION_FAILURE').length;

    console.log(`\n✅ Analysis complete:`);
    console.log(`   📊 Total issues: ${signals.length}`);
    console.log(`   🔴 Runtime errors: ${runtimeErrors}`);
    console.log(`   🔴 API errors: ${apiErrors}`);
    console.log(`   🔴 Button failures: ${buttonErrors}\n`);

  } catch (error) {
    console.error('❌ Analyzer error:', error.message);
    signals.push({
      signalType: "ANALYZER_ERROR",
      type: "error",
      message: `Failed to analyze: ${error.message}`,
      severity: "Low"
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return signals;
}
