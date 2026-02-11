/**
 * ========================================
 * AUTHENTICATION SETUP FOR PLAYWRIGHT TESTS
 * ========================================
 * 
 * This setup runs once before all tests to authenticate
 * and save the authentication state for reuse
 */

import { test as setup, expect } from '@playwright/test';
import { getTestUser, getTestUrls } from './helpers/test-data.js';

const authFile = 'tests/.auth/user.json';

setup('authenticate', async ({ page }) => {
    const user = getTestUser();
    const urls = getTestUrls();

    console.log('🔐 Setting up authentication...');

    // Navigate to login page
    await page.goto(urls.login);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if login form exists
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');

    if (await emailInput.count() === 0) {
        console.log('⚠️  No login form found - app might not require authentication or already logged in');
        // Save current state anyway
        await page.context().storageState({ path: authFile });
        return;
    }

    // Fill in credentials
    await emailInput.fill(user.email);
    await passwordInput.fill(user.password);

    // Find and click login button
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    // Wait for navigation or error
    try {
        // Wait for either dashboard or error message
        await Promise.race([
            page.waitForURL(/dashboard|issues|home/, { timeout: 10000 }),
            page.waitForSelector('.error, [role="alert"]', { timeout: 5000 })
        ]);

        // Check if we successfully logged in
        const currentUrl = page.url();

        if (currentUrl.includes('login')) {
            console.log('⚠️  Still on login page - authentication might have failed');
            console.log('   Current URL:', currentUrl);

            // Check for error messages
            const errorElement = await page.locator('.error, [role="alert"]').first();
            if (await errorElement.count() > 0) {
                const errorText = await errorElement.textContent();
                console.log('   Error message:', errorText);
            }

            // Still save state for tests to continue
            await page.context().storageState({ path: authFile });
        } else {
            console.log('✅ Authentication successful');
            console.log('   Redirected to:', currentUrl);

            // Save authenticated state
            await page.context().storageState({ path: authFile });
        }
    } catch (error) {
        console.log('⚠️  Authentication timeout or error:', error.message);
        // Save state anyway - tests will handle auth failure
        await page.context().storageState({ path: authFile });
    }
});
