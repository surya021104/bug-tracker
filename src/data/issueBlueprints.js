export const ISSUE_BLUEPRINTS = {
  AUTHENTICATION: {
    crash: {
      description:
        "The application crashes during authentication when invalid input or unexpected conditions occur.",
      expected:
        "The system should validate user credentials and display an appropriate error message.",
      actual:
        "The application crashes instead of handling the authentication failure."
    },
    validation: {
      description:
        "Authentication validation does not work as expected.",
      expected:
        "The system should prevent login and display validation feedback.",
      actual:
        "Invalid credentials are not handled correctly."
    }
  },

  API: {
    serverCrash: {
      description:
        "The backend server fails while processing an API request.",
      expected:
        "The server should return a controlled error response.",
      actual:
        "The server crashes or returns an internal server error."
    },
    timeout: {
      description:
        "The API does not respond within the expected time.",
      expected:
        "The API should respond within acceptable performance limits.",
      actual:
        "The request times out or remains pending."
    }
  },

  UI: {
    rendering: {
      description:
        "UI components do not render correctly on the screen.",
      expected:
        "UI components should render according to the design specifications.",
      actual:
        "UI layout breaks or elements are misaligned."
    },
    interaction: {
      description:
        "UI components do not respond to user interactions.",
      expected:
        "UI components should respond correctly to user actions.",
      actual:
        "User interactions have no effect or trigger incorrect behavior."
    }
  },

  PERFORMANCE: {
    slow: {
      description:
        "The application experiences performance degradation during normal usage.",
      expected:
        "The application should respond quickly to user actions.",
      actual:
        "The application responds slowly, causing delays."
    }
  }
};
