// analyzer/bugComposer.js
import { generateStructuredBugReport } from "../ai/bugAI.js";

export async function composeBug(item, url) {
  try {
    // Create a plain text description from the signal data
    const plainTextDescription = `
      Error Type: ${item.type}
      Message: ${item.message}
      URL: ${url}
      Severity: ${item.severity}
      ${item.stack ? `Stack: ${item.stack}` : ''}
    `.trim();

    // Use comprehensive AI bug report generation
    const comprehensiveReport = await generateStructuredBugReport(plainTextDescription);

    // Return all comprehensive fields
    return {
      title: comprehensiveReport.title,
      description: comprehensiveReport.description,
      severity: comprehensiveReport.severity,
      priority: comprehensiveReport.priority,
      steps: comprehensiveReport.steps_to_reproduce,
      actual: comprehensiveReport.actual_output,
      expected: comprehensiveReport.expected_output,
      assignee: comprehensiveReport.assignee,
      labels: [item.type, "AUTO_GENERATED"],
      aiAnalyzed: true
    };
  } catch (err) {
    console.warn("⚠ AI Enrichment failed, using fallback data.");
    // Fallback if AI fails so the bug still gets added
    return {
      title: item.title || "Unknown Error",
      description: item.message,
      severity: item.severity || "Medium",
      priority: "Medium",
      priority_justification: "Default priority due to AI failure",
      labels: [item.type, "AI_FAILED"],
      steps: "1. Open the application\n2. Replicate the reported action",
      actual: item.message || "Error occurred",
      expected: "Application should function without errors",
      assignee: "Backend Dev",
      environment: "Unknown - requires investigation",
      aiAnalyzed: false
    };
  }
}