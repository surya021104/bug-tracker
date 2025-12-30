import { ISSUE_BLUEPRINTS } from "../data/issueBlueprints";

export function generateIssueDescription(issue) {
  const base =
    ISSUE_BLUEPRINTS?.[issue.category]?.[issue.symptom];

  if (!base) {
    return {
      description: "Issue description not available.",
      steps: "Steps not defined.",
      expected: "Expected behavior not defined.",
      actual: "Actual behavior not defined."
    };
  }

  return {
    description: base.description,
    steps: `Trigger: ${issue.trigger || "Not specified"}`,
    expected: base.expected,
    actual: base.actual
  };
}
