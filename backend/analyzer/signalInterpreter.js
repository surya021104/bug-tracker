// analyzer/signalInterpreter.js

export function interpretSignals(signals = []) {
  if (!Array.isArray(signals)) return [];

  return signals.map(signal => {
    // Support both 'type' and 'signalType' fields
    const bugType = signal.type || signal.signalType;

    switch (bugType) {

      case "JS_RUNTIME_ERROR":
        return {
          type: "JS_RUNTIME_ERROR",
          title: "JavaScript Runtime Error",
          message: signal.message,
          stack: signal.stack,
          severity: "High"
        };

      case "CONSOLE_ERROR":
        return {
          type: "CONSOLE_ERROR",
          title: "Console Error Detected",
          message: signal.message,
          severity: signal.severity || "Medium",
          stack: signal.stack || ""
        };

      case "VALIDATION_BUG":
        return {
          type: "VALIDATION_BUG",
          title: "Form Validation Issue",
          message: signal.message,
          severity: signal.severity || "High"
        };

      case "API_ERROR":
        if (signal.status === 401 || signal.status === 403) {
          return {
            type: "AUTH_ERROR",
            title: "Authorization Failure",
            message: `Unauthorized request to ${signal.endpoint}`,
            severity: "Critical"
          };
        }

        return {
          type: "API_ERROR",
          title: "API Endpoint Failure",
          message: `${signal.endpoint} returned ${signal.status}`,
          severity: signal.status >= 500 ? "High" : "Medium"
        };

      case "NETWORK_ERROR":
        return {
          type: "NETWORK_ERROR",
          title: "Network Connectivity Issue",
          message: signal.message,
          severity: "High"
        };

      case "UI_INTERACTION_FAILURE":
        return {
          type: "UI_INTERACTION_FAILURE",
          title: `Button Failure: ${signal.buttonText || 'Unknown Button'}`,
          message: signal.message,
          buttonText: signal.buttonText,
          buttonId: signal.buttonId,
          selector: signal.selector,
          failureType: signal.failureType,
          severity: signal.failureType === 'RAPID_CLICKS' ? 'High' : 'Medium',
          stack: JSON.stringify({
            selector: signal.selector,
            position: signal.position,
            failureType: signal.failureType
          })
        };

      case "PROMISE_REJECTION":
        return {
          type: "ASYNC_ERROR",
          title: "Unhandled Promise Rejection",
          message: signal.message,
          severity: "Medium"
        };

      case "PLAYWRIGHT_TEST_FAILURE":
        return {
          type: "PLAYWRIGHT_TEST_FAILURE",
          title: signal.message || signal.title || "Playwright Test Failed",
          message: signal.message || "Automated test failure detected",
          testName: signal.testName,
          testFile: signal.testFile,
          expected: signal.expected || "",
          actual: signal.actual || "",
          severity: signal.severity || "High",
          source: "playwright"
        };

      default:
        return {
          type: bugType || "UNKNOWN",
          title: signal.title || signal.message || "Unknown Application Error",
          message: signal.message || "Unknown issue",
          severity: signal.severity || "Low"
        };
    }
  });
}

