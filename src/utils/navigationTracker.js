/**
 * Navigation Flow Tracker
 * Tracks user navigation history for bug context
 */

class NavigationTracker {
    constructor() {
        this.navigationHistory = [];
        this.maxHistory = 50;
        this.sessionStartTime = Date.now();
        this.currentPageStartTime = Date.now();
    }

    /**
     * Track a navigation event
     */
    track(path, referrer = '') {
        const now = Date.now();
        const previousDuration = this.currentPageStartTime
            ? now - this.currentPageStartTime
            : 0;

        // Update previous entry with duration
        if (this.navigationHistory.length > 0) {
            this.navigationHistory[this.navigationHistory.length - 1].duration = previousDuration;
        }

        const navigationEvent = {
            timestamp: new Date().toISOString(),
            path: path,
            referrer: referrer || (this.navigationHistory.length > 0
                ? this.navigationHistory[this.navigationHistory.length - 1].path
                : ''),
            duration: 0, // Will be updated on next navigation
            sessionTime: now - this.sessionStartTime
        };

        this.navigationHistory.push(navigationEvent);

        // Keep only last 50 navigations
        if (this.navigationHistory.length > this.maxHistory) {
            this.navigationHistory.shift();
        }

        this.currentPageStartTime = now;

        console.log('📍 Navigation tracked:', path);
    }

    /**
     * Get full navigation history
     */
    getHistory() {
        return this.navigationHistory;
    }

    /**
     * Get navigation summary (human-readable path)
     */
    getSummary() {
        return this.navigationHistory
            .map(nav => nav.path)
            .join(' → ');
    }

    /**
     * Get navigation flow for bug report
     */
    getFlowForBugReport() {
        return {
            flow: this.navigationHistory,
            summary: this.getSummary(),
            totalPages: this.navigationHistory.length,
            sessionDuration: Date.now() - this.sessionStartTime,
            currentPage: this.navigationHistory.length > 0
                ? this.navigationHistory[this.navigationHistory.length - 1].path
                : 'unknown'
        };
    }

    /**
     * Clear history (useful for testing)
     */
    clear() {
        this.navigationHistory = [];
        this.sessionStartTime = Date.now();
        this.currentPageStartTime = Date.now();
    }
}

// Create singleton instance
const navigationTracker = new NavigationTracker();

// Make it globally available for bug-tracker-monitor.js
if (typeof window !== 'undefined') {
    window.__navigationTracker = navigationTracker;
}

export default navigationTracker;
