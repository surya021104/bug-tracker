/**
 * Smart Button Failure Detection System
 * Automatically detects when buttons don't work and reports them to bug tracker
 */

class ButtonMonitor {
    constructor() {
        this.clickTracking = new Map();
        this.rapidClickThreshold = 3; // 3 clicks within 2 seconds = frustrated user
        this.rapidClickWindow = 2000; // 2 seconds
        this.responseTimeout = 1000; // Wait 1 second for button to do something
        this.enabled = true;
        this.apiEndpoint = (import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/bugs/ingest';
    }

    /**
     * Initialize the button monitor
     */
    init() {
        if (!this.enabled) return;

        // Monitor all clicks on the document
        document.addEventListener('click', (e) => this.handleClick(e), true);

        console.log('🔍 Button Monitor Active - Tracking navigation failures after form submission');
    }

    /**
     * Handle button clicks and detect failures
     */
    async handleClick(event) {
        const button = event.target.closest('button, [role="button"], input[type="submit"], input[type="button"]');

        if (!button) return;

        const buttonInfo = this.getButtonInfo(button);
        const buttonId = this.getButtonIdentifier(button);

        // Track rapid clicks (frustrated user)
        this.trackRapidClicks(buttonId, buttonInfo);

        // Check if button does something
        await this.checkButtonResponse(button, buttonInfo);
    }

    /**
     * Track rapid clicks on the same button
     */
    trackRapidClicks(buttonId, buttonInfo) {
        const now = Date.now();

        if (!this.clickTracking.has(buttonId)) {
            this.clickTracking.set(buttonId, []);
        }

        const clicks = this.clickTracking.get(buttonId);

        // Remove old clicks outside the time window
        const recentClicks = clicks.filter(time => now - time < this.rapidClickWindow);
        recentClicks.push(now);

        this.clickTracking.set(buttonId, recentClicks);

        // If user clicked rapidly, likely the button isn't working
        if (recentClicks.length >= this.rapidClickThreshold) {
            this.reportButtonFailure({
                ...buttonInfo,
                failureType: 'RAPID_CLICKS',
                message: `User clicked "${buttonInfo.buttonText}" ${recentClicks.length} times rapidly - button likely not responding`,
                clicks: recentClicks.length
            });

            // Clear tracking to avoid duplicate reports
            this.clickTracking.set(buttonId, []);
        }
    }

    /**
     * Check if button actually does something after being clicked
     */
    async checkButtonResponse(button, buttonInfo) {
        const beforeState = {
            url: window.location.href,
            hash: window.location.hash,
            pathname: window.location.pathname,
            documentState: document.readyState,
            activeElement: document.activeElement
        };

        // Check if button is disabled
        if (button.disabled) {
            return; // Disabled buttons are expected not to work
        }

        // Check if button is inside a form
        const form = button.closest('form');
        const isSubmitButton = button.type === 'submit' || (form && button.getAttribute('type') !== 'button');

        // Only track submit buttons
        if (!isSubmitButton) {
            return;
        }

        // Check if form has filled values
        let formHasValues = false;
        if (form) {
            const formData = new FormData(form);
            formHasValues = Array.from(formData.values()).some(value => value.trim() !== '');
        }

        // Only track if form has values
        if (!formHasValues) {
            return;
        }

        // Wait for potential response
        await new Promise(resolve => setTimeout(resolve, this.responseTimeout));

        const afterState = {
            url: window.location.href,
            hash: window.location.hash,
            pathname: window.location.pathname,
            documentState: document.readyState,
            activeElement: document.activeElement
        };

        // Detect if navigation happened
        const navigationHappened =
            beforeState.url !== afterState.url ||
            beforeState.pathname !== afterState.pathname ||
            beforeState.hash !== afterState.hash;

        // Report navigation failure for filled forms
        if (!navigationHappened && !this.hasVisualChanges()) {
            this.reportButtonFailure({
                ...buttonInfo,
                failureType: 'NAVIGATION_FAILURE',
                message: `Submit button "${buttonInfo.buttonText}" clicked with filled form but no navigation occurred`,
                formFilled: true,
                expectedNavigation: true
            });
        }
    }

    /**
     * Detect visual changes (basic heuristic)
     */
    hasVisualChanges() {
        // Check if any loading indicators appeared
        const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], [aria-busy="true"]');
        return loadingElements.length > 0;
    }

    /**
     * Get button information for reporting
     */
    getButtonInfo(button) {
        const rect = button.getBoundingClientRect();

        return {
            buttonText: button.textContent?.trim() || button.value || button.ariaLabel || 'Unknown Button',
            buttonId: button.id || 'no-id',
            buttonClass: button.className || 'no-class',
            buttonType: button.type || 'button',
            pageUrl: window.location.href,
            pagePath: window.location.pathname,
            pageTitle: document.title,
            position: {
                x: rect.x,
                y: rect.y
            },
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
    }

    /**
     * Get unique identifier for a button
     */
    getButtonIdentifier(button) {
        return button.id ||
            button.textContent?.trim() ||
            `${button.className}-${button.getBoundingClientRect().x}-${button.getBoundingClientRect().y}`;
    }

    /**
     * Report button failure to bug tracker
     */
    async reportButtonFailure(failureInfo) {
        console.error('🐛 Button Failure Detected:', failureInfo);

        // Get navigation flow if available
        const navigationFlow = window.__navigationTracker
            ? window.__navigationTracker.getFlowForBugReport()
            : null;

        const bugReport = {
            type: 'UI_INTERACTION_FAILURE',
            message: failureInfo.message,
            url: failureInfo.pageUrl,
            severity: 'Medium',
            navigationFlow: navigationFlow, // Attach navigation flow
            stack: JSON.stringify({
                buttonText: failureInfo.buttonText,
                buttonId: failureInfo.buttonId,
                buttonClass: failureInfo.buttonClass,
                failureType: failureInfo.failureType,
                pageTitle: failureInfo.pageTitle,
                timestamp: failureInfo.timestamp,
                position: failureInfo.position,
                clicks: failureInfo.clicks || 1
            }, null, 2)
        };

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bugReport)
            });

            if (response.ok) {
                console.log('✅ Button failure reported to bug tracker');
            }
        } catch (error) {
            console.error('Failed to report button failure:', error);
        }
    }

    /**
     * Enable or disable monitoring
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// Create singleton instance
const buttonMonitor = new ButtonMonitor();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => buttonMonitor.init());
} else {
    buttonMonitor.init();
}

export default buttonMonitor;
