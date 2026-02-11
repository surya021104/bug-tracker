export const ISSUE_TEMPLATES = {
  LOGIN_CRASH: {
    description:
      "The application crashes when a user attempts to log in using invalid credentials.",
    steps:
      "1. Open the application\n2. Navigate to the Login screen\n3. Enter an invalid username or password\n4. Click the Login button",
    expected:
      "The system should validate the credentials and display an appropriate error message without crashing.",
    actual:
      "The application crashes immediately after submitting invalid credentials."
  },

  SERVER_CRASH: {
    description:
      "The backend server crashes or returns an internal error when processing a client request.",
    steps:
      "1. Trigger the affected API from the UI\n2. The request is sent to the server\n3. Server attempts to process the request",
    expected:
      "The server should handle the request gracefully and return a proper error response.",
    actual:
      "The server crashes or responds with a 500 Internal Server Error."
  },

  UI_BUG: {
    description:
      "A user interface element does not behave or render as expected.",
    steps:
      "1. Navigate to the affected page\n2. Interact with the UI component",
    expected:
      "The UI should display correctly and respond to user interactions as designed.",
    actual:
      "The UI layout breaks or the component does not respond correctly."
  },

  PERFORMANCE: {
    description:
      "The application experiences noticeable delays or slow response times.",
    steps:
      "1. Perform the specified user action\n2. Observe application response time",
    expected:
      "The application should respond within the acceptable performance limits.",
    actual:
      "The application responds slowly, causing noticeable delays."
  }
};
