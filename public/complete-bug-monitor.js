/**
 * ========================================
 * COMPLETE BUG TRACKER MONITORING SCRIPT
 * ========================================
 * 
 * Deploy this to your TARGET APPLICATION to enable:
 * - Automatic error tracking (JS, API, Network, Promise)
 * - State change monitoring
 * - Navigation flow tracking
 * - Button failure detection
 * - Automatic reporting to Bug Tracker
 * 
 * USAGE:
 * 1. Copy this file to your target app's public folder
 * 2. Add <script src="/complete-bug-monitor.js"></script> in your HTML
 * 3. Configure API Key in your HTML:
 *    <script>
 *      window.BUG_TRACKER_CONFIG = {
 *        apiKey: 'YOUR_FULL_API_KEY_HERE',
 *        endpoint: 'http://localhost:4000/api/bugs/ingest'
 *      };
 *    </script>
 */

(function () {
    'use strict';

    // ========================================
    // CONFIGURATION
    // ========================================
    // Merge default config with window level config
    const USER_CONFIG = window.BUG_TRACKER_CONFIG || {};

    const CONFIG = {
        INGEST_ENDPOINT: USER_CONFIG.endpoint || 'http://localhost:4000/api/bugs/ingest',
        API_KEY: USER_CONFIG.apiKey || '', // API Key from window config
        MAX_STATE_HISTORY: 50,
        MAX_NAV_HISTORY: 50,
        SENSITIVE_FIELDS: ['password', 'passwd', 'pwd', 'token', 'secret', 'apikey', 'creditcard', 'ssn', 'cvv'],
        DEBOUNCE_MS: 100
    };

    // Warn if no API key is set
    if (!CONFIG.API_KEY) {
        console.warn('⚠️ Bug Tracker: No API Key configured. Bugs may not be assigned to your app correctly.');
    }

    // ========================================
    // STATE TRACKING
    // ========================================
    const stateHistory = [];
    let stateDebounceTimer = null;

    function sanitizeData(obj, depth = 0) {
        if (depth > 5) return '[MAX_DEPTH]'; // Prevent infinite recursion
        if (!obj || typeof obj !== 'object') return obj;

        const sanitized = Array.isArray(obj) ? [] : {};

        for (let key in obj) {
            const lowerKey = key.toLowerCase();

            // Check for sensitive fields
            if (CONFIG.SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitized[key] = sanitizeData(obj[key], depth + 1);
            } else if (typeof obj[key] === 'function') {
                sanitized[key] = '[FUNCTION]';
            } else {
                sanitized[key] = obj[key];
            }
        }

        return sanitized;
    }

    window.__trackState = function (componentName, state, action = 'UPDATE') {
        clearTimeout(stateDebounceTimer);

        stateDebounceTimer = setTimeout(() => {
            stateHistory.push({
                timestamp: new Date().toISOString(),
                component: componentName,
                state: sanitizeData(state),
                action: action,
                url: window.location.href
            });

            // Keep only last N entries
            while (stateHistory.length > CONFIG.MAX_STATE_HISTORY) {
                stateHistory.shift();
            }

            console.log('📊 State tracked:', componentName, action);
        }, CONFIG.DEBOUNCE_MS);
    };

    window.__getStateFlow = function () {
        return stateHistory;
    };

    // ========================================
    // NAVIGATION TRACKING
    // ========================================
    const navigationHistory = [];
    let currentPageStart = Date.now();
    window.__sessionStart = Date.now();

    function trackNavigation(path, referrer = '') {
        const now = Date.now();
        const duration = now - currentPageStart;

        // Update previous entry's duration
        if (navigationHistory.length > 0) {
            navigationHistory[navigationHistory.length - 1].duration = duration;
        }

        navigationHistory.push({
            timestamp: new Date().toISOString(),
            path: path,
            referrer: referrer || document.referrer,
            duration: 0, // Will be updated on next navigation
            sessionTime: now - window.__sessionStart
        });

        while (navigationHistory.length > CONFIG.MAX_NAV_HISTORY) {
            navigationHistory.shift();
        }

        currentPageStart = now;
        console.log('📍 Navigation tracked:', path);
    }

    // Track initial page load
    trackNavigation(window.location.pathname + window.location.search + window.location.hash);

    // Track history API
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function () {
        originalPushState.apply(this, arguments);
        trackNavigation(window.location.pathname + window.location.search + window.location.hash);
    };

    history.replaceState = function () {
        originalReplaceState.apply(this, arguments);
        trackNavigation(window.location.pathname + window.location.search + window.location.hash);
    };

    // Track browser back/forward
    window.addEventListener('popstate', () => {
        trackNavigation(window.location.pathname + window.location.search + window.location.hash);
    });

    // Track hash changes
    window.addEventListener('hashchange', () => {
        trackNavigation(window.location.pathname + window.location.search + window.location.hash);
    });

    window.__getNavigationFlow = function () {
        return {
            flow: navigationHistory,
            summary: navigationHistory.map(n => n.path).join(' → '),
            totalPages: navigationHistory.length,
            sessionDuration: Date.now() - window.__sessionStart,
            currentPage: navigationHistory.length > 0
                ? navigationHistory[navigationHistory.length - 1].path
                : 'unknown'
        };
    };

    // ========================================
    // BUG REPORTING
    // ========================================
    // IMPORTANT: Must save originalFetch BEFORE wrapping window.fetch
    const originalFetch = window.fetch;

    async function reportBug(bugData) {
        // Try to enrich signal with user + session context if available
        let userId = null;
        try {
            if (typeof window.BUG_TRACKER_GET_USER === 'function') {
                const user = window.BUG_TRACKER_GET_USER();
                if (user) {
                    userId = user.id || user.userId || user.email || user.username || null;
                }
            } else if (window.currentUser) {
                const u = window.currentUser;
                userId = u.id || u.userId || u.email || u.username || null;
            }
        } catch (e) {
            // swallow – diagnostics only
        }

        // Simple session identifier (persists for the tab/session)
        if (!window.__BUG_TRACKER_SESSION_ID) {
            window.__BUG_TRACKER_SESSION_ID =
                (window.sessionStorage && window.sessionStorage.getItem('BUG_TRACKER_SESSION_ID')) ||
                `sess_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
            if (window.sessionStorage) {
                try {
                    window.sessionStorage.setItem('BUG_TRACKER_SESSION_ID', window.__BUG_TRACKER_SESSION_ID);
                } catch (e) {
                    // ignore storage failures
                }
            }
        }

        const payload = {
            ...bugData,
            userId,
            sessionId: window.__BUG_TRACKER_SESSION_ID,
            stateFlow: stateHistory,
            navigationFlow: window.__getNavigationFlow(),
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`
        };

        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            // Add API Key header if configured
            if (CONFIG.API_KEY) {
                headers['X-API-Key'] = CONFIG.API_KEY;
            }

            // USE originalFetch TO AVOID INFINITE RECURSION
            const response = await originalFetch(CONFIG.INGEST_ENDPOINT, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log('✅ Bug reported with full context:', bugData.type);
            } else {
                console.error('❌ Bug report failed:', response.status);
            }
        } catch (err) {
            console.error('❌ Failed to send bug report:', err);
        }
    }

    // ========================================
    // JS RUNTIME ERROR MONITORING
    // ========================================
    window.addEventListener('error', (event) => {
        reportBug({
            type: 'JS_RUNTIME_ERROR',
            message: event.message || 'Unknown error',
            url: window.location.href,
            stack: event.error?.stack || 'No stack trace',
            severity: 'High',
            lineNumber: event.lineno,
            columnNumber: event.colno,
            filename: event.filename
        });
    }, true);

    // ========================================
    // UNHANDLED PROMISE REJECTION MONITORING
    // ========================================
    window.addEventListener('unhandledrejection', (event) => {
        reportBug({
            type: 'PROMISE_REJECTION',
            message: event.reason?.message || String(event.reason) || 'Unhandled promise rejection',
            url: window.location.href,
            stack: event.reason?.stack || 'No stack trace',
            severity: 'Medium'
        });
    });

    // ========================================
    // API ERROR MONITORING
    // ========================================
    // originalFetch is declared above, before reportBug()
    window.fetch = async function (...args) {
        const startTime = Date.now();

        try {
            // Check if this is a request to our ingest endpoint to avoid tracking our own reports
            const url = String(args[0]);
            if (url.includes(CONFIG.INGEST_ENDPOINT)) {
                return originalFetch(...args);
            }

            const response = await originalFetch(...args);
            const duration = Date.now() - startTime;

            // Clone response to read it (responses can only be read once)
            const clonedResponse = response.clone();

            // Report API errors (4xx, 5xx)
            if (!response.ok && response.status >= 400) {
                let errorMessage = `API ${response.status}: ${args[0]}`;

                try {
                    const body = await clonedResponse.text();
                    if (body) errorMessage += ` - ${body.substring(0, 200)}`;
                } catch (e) {
                    // Unable to read body
                }

                reportBug({
                    type: 'API_ERROR',
                    message: errorMessage,
                    url: window.location.href,
                    severity: response.status >= 500 ? 'Critical' : 'Medium',
                    apiUrl: String(args[0]),
                    statusCode: response.status,
                    duration: duration
                });
            }

            return response;
        } catch (err) {
            // Network error
            reportBug({
                type: 'NETWORK_ERROR',
                message: `Network failure: ${args[0]} - ${err.message}`,
                url: window.location.href,
                severity: 'High',
                apiUrl: String(args[0])
            });

            throw err;
        }
    };

    // ========================================
    // BUTTON FAILURE MONITORING
    // ========================================
    const buttonClickTracker = new Map();
    const RAPID_CLICK_THRESHOLD = 5;
    const RAPID_CLICK_WINDOW = 2000;

    document.addEventListener('click', (event) => {
        const button = event.target.closest('button, [role="button"], input[type="submit"], input[type="button"]');

        if (!button) return;

        const buttonId = button.id || button.textContent?.trim() || 'unknown';
        const now = Date.now();

        // Track rapid clicks
        if (!buttonClickTracker.has(buttonId)) {
            buttonClickTracker.set(buttonId, []);
        }

        const clicks = buttonClickTracker.get(buttonId);
        const recentClicks = clicks.filter(time => now - time < RAPID_CLICK_WINDOW);
        recentClicks.push(now);
        buttonClickTracker.set(buttonId, recentClicks);

        // Rapid clicking detected
        if (recentClicks.length >= RAPID_CLICK_THRESHOLD) {
            reportBug({
                type: 'UI_INTERACTION_FAILURE',
                message: `Button "${button.textContent?.trim() || buttonId}" clicked ${recentClicks.length} times rapidly - likely unresponsive`,
                url: window.location.href,
                severity: 'Medium',
                buttonId: buttonId,
                buttonText: button.textContent?.trim(),
                buttonClass: button.className
            });

            buttonClickTracker.set(buttonId, []);
        }
    }, true);

    // ========================================
    // VALIDATION BUG DETECTION
    // ========================================
    const formValidationTracker = new Map();

    // Helper: Check if element is required
    function isRequired(element) {
        return element.required ||
            element.hasAttribute('required') ||
            element.getAttribute('aria-required') === 'true' ||
            element.classList.contains('required');
    }

    // Helper: Check if element is empty
    function isEmpty(element) {
        if (!element.value) return true;
        const value = element.value.trim();
        return value === '' || value === null || value === undefined;
    }

    // Helper: Get all form inputs
    function getFormInputs(form) {
        return Array.from(form.querySelectorAll('input, select, textarea'));
    }

    // Helper: Find validation messages near element
    function hasValidationMessage(element) {
        // Check for common error message patterns
        const parent = element.parentElement;
        if (!parent) return false;

        // Look for error messages in parent and siblings
        const errorSelectors = [
            '.error', '.error-message', '.field-error', '.validation-error',
            '[role="alert"]', '.invalid-feedback', '.form-error'
        ];

        for (const selector of errorSelectors) {
            const errorElement = parent.querySelector(selector);
            if (errorElement && errorElement.textContent.trim()) {
                return true;
            }
        }

        // Check element's own invalid state
        if (element.classList.contains('error') ||
            element.classList.contains('invalid') ||
            element.getAttribute('aria-invalid') === 'true') {
            return true;
        }

        return false;
    }

    // Monitor form submissions
    document.addEventListener('submit', (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement)) return;

        const formId = form.id || form.name || 'unknown-form';
        const inputs = getFormInputs(form);
        const requiredInputs = inputs.filter(isRequired);
        const emptyRequiredInputs = requiredInputs.filter(isEmpty);

        // BUG: Required fields are empty but form is submitting
        if (emptyRequiredInputs.length > 0) {
            const emptyFields = emptyRequiredInputs.map(input =>
                input.name || input.id || input.placeholder || 'unnamed'
            ).join(', ');

            reportBug({
                type: 'VALIDATION_BUG',
                message: `Form "${formId}" submitted with ${emptyRequiredInputs.length} empty required field(s): ${emptyFields}`,
                url: window.location.href,
                severity: 'High',
                formId: formId,
                emptyFields: emptyFields,
                totalRequiredFields: requiredInputs.length,
                validationIssue: 'REQUIRED_FIELDS_EMPTY'
            });
        }

        // BUG: Form has validation errors but still submitting
        const inputsWithErrors = inputs.filter(hasValidationMessage);
        if (inputsWithErrors.length > 0) {
            const fieldsWithErrors = inputsWithErrors.map(input =>
                input.name || input.id || input.placeholder || 'unnamed'
            ).join(', ');

            reportBug({
                type: 'VALIDATION_BUG',
                message: `Form "${formId}" submitted despite ${inputsWithErrors.length} field(s) showing validation errors: ${fieldsWithErrors}`,
                url: window.location.href,
                severity: 'High',
                formId: formId,
                fieldsWithErrors: fieldsWithErrors,
                validationIssue: 'SUBMIT_WITH_ERRORS_VISIBLE'
            });
        }
    }, true);

    // Monitor individual input changes for validation issues
    document.addEventListener('input', (event) => {
        const input = event.target;
        if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(input.tagName)) return;

        const form = input.closest('form');
        if (!form) return;

        const formId = form.id || form.name || 'unknown-form';

        // Track validation state
        setTimeout(() => {
            const isRequiredField = isRequired(input);
            const isEmptyField = isEmpty(input);
            const hasError = hasValidationMessage(input);

            // BUG: Required field is empty but no error message shown
            if (isRequiredField && isEmptyField && !hasError) {
                const fieldName = input.name || input.id || input.placeholder || 'unnamed';

                // Only report if user has interacted (lost focus)
                if (document.activeElement !== input) {
                    reportBug({
                        type: 'VALIDATION_BUG',
                        message: `Required field "${fieldName}" in form "${formId}" is empty but no validation message shown`,
                        url: window.location.href,
                        severity: 'Medium',
                        formId: formId,
                        fieldName: fieldName,
                        validationIssue: 'MISSING_ERROR_MESSAGE'
                    });
                }
            }
        }, 500); // Wait for validation to potentially trigger
    }, true);

    // Monitor submit button state
    document.addEventListener('click', (event) => {
        const button = event.target.closest('button[type="submit"], input[type="submit"]');
        if (!button) return;

        const form = button.closest('form');
        if (!form) return;

        const formId = form.id || form.name || 'unknown-form';
        const inputs = getFormInputs(form);
        const requiredInputs = inputs.filter(isRequired);
        const emptyRequiredInputs = requiredInputs.filter(isEmpty);
        const buttonDisabled = button.disabled || button.getAttribute('aria-disabled') === 'true';

        // BUG: Submit button is enabled despite empty required fields
        if (emptyRequiredInputs.length > 0 && !buttonDisabled) {
            const emptyFields = emptyRequiredInputs.map(input =>
                input.name || input.id || input.placeholder || 'unnamed'
            ).join(', ');

            reportBug({
                type: 'VALIDATION_BUG',
                message: `Submit button enabled in form "${formId}" despite ${emptyRequiredInputs.length} empty required field(s): ${emptyFields}`,
                url: window.location.href,
                severity: 'High',
                formId: formId,
                emptyFields: emptyFields,
                validationIssue: 'SUBMIT_BUTTON_ENABLED_INVALID_FORM'
            });
        }

        // BUG: Button enabled but validation errors visible
        const inputsWithErrors = inputs.filter(hasValidationMessage);
        if (inputsWithErrors.length > 0 && !buttonDisabled) {
            const fieldsWithErrors = inputsWithErrors.map(input =>
                input.name || input.id || input.placeholder || 'unnamed'
            ).join(', ');

            reportBug({
                type: 'VALIDATION_BUG',
                message: `Submit button enabled in form "${formId}" despite validation errors on: ${fieldsWithErrors}`,
                url: window.location.href,
                severity: 'Medium',
                formId: formId,
                fieldsWithErrors: fieldsWithErrors,
                validationIssue: 'SUBMIT_BUTTON_ENABLED_WITH_ERRORS'
            });
        }
    }, true);

    // ========================================
    // INITIALIZATION
    // ========================================
    console.log('%c🔍 Bug Tracker Monitoring Active', 'color: #10b981; font-weight: bold; font-size: 14px');
    console.log(`✅ App Monitoring: ${CONFIG.API_KEY ? 'Active (API Key Set)' : 'Active (No API Key)'}`);
    console.log('✅ Reporting to:', CONFIG.INGEST_ENDPOINT);

    // Make config accessible for debugging
    window.__bugTrackerConfig = CONFIG;

})();
