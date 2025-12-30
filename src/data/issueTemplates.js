export const ISSUE_TEMPLATES = {
  LOGIN_CRASH: {
    description: "Application crashes during login flow",
    steps: "Open login → enter invalid credentials → submit",
    expected: "System should show validation error message",
    actual: "Application crashes unexpectedly"
  },

  SERVER_CRASH: {
    description: "Server crashes on API request",
    steps: "Trigger API → server receives request → process fails",
    expected: "Server should return proper error response",
    actual: "Server crashes or returns 500 error"
  },

  UI_BUG: {
    description: "UI layout or interaction issue",
    steps: "Navigate to page → interact with component",
    expected: "UI should behave as designed",
    actual: "UI behaves incorrectly"
  },

  PERFORMANCE: {
    description: "Performance degradation issue",
    steps: "Perform repeated actions → observe delay",
    expected: "Application should respond within acceptable time",
    actual: "Application responds slowly"
  }
};
