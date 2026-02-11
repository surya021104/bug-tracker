import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

// Initialize OpenAI with OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

export async function getIntelligentAnalysis(signal, url) {
  const prompt = `
Analyze the following application error and act like a senior software architect.

URL: ${url}
Error Type: ${signal.type}
Message: ${signal.message}
Stack Trace: ${signal.stack || "N/A"}

Return ONLY valid JSON in the exact format below.
Do NOT add explanations or markdown.

{
  "perfect_title": "Short professional bug title",
  "root_cause_analysis": "Clear technical root cause explanation",
  "labels": ["API", "LOGIC", "UI", "DATABASE", "SERVER", "CLIENT", "SECURITY", "PERFORMANCE", "NETWORK", "OTHER"],
  "repro_steps": "1. Step one\n2. Step two\n3. Step three",
  "fix_suggestion": "Concrete code-level fix recommendation"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an automated bug analysis engine. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2
    });

    const text = response.choices[0].message.content;

    // Clean any potential control characters
    const cleanedText = text.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("OpenAI Bug Analysis Failed:", error);
    throw error;
  }
}

/**
 * Generate a complete, professional bug report from plain language description
 * Follows QA industry standards with 10 required fields
 */
export async function generateStructuredBugReport(plainTextDescription) {
  const currentYear = new Date().getFullYear();
  const bugNumber = Math.floor(Math.random() * 900) + 100; // Random 3-digit number

  const prompt = `
You are a senior QA engineer and bug analyst.

I will provide a plain language bug description.
Your task is to convert it into a COMPLETE, PROFESSIONAL BUG REPORT.

User's description: "${plainTextDescription}"

Return ONLY valid JSON in the exact format below.
Do NOT add markdown, explanations, or any text outside the JSON.

{
  "bug_id": "BUG-${currentYear}-${bugNumber}",
  "title": "Short, clear, and actionable bug title",
  "description": "Detailed explanation of what the issue is and where it occurs",
  "module": "Affected module or feature (e.g., Login, Dashboard, Reports, API, UI, Backend)",
  "steps_to_reproduce": "1. Start from application launch or login\n2. Clear numbered steps\n3. Each step should be specific and repeatable",
  "actual_output": "What is currently happening (error message, crash, wrong UI, incorrect data, etc.)",
  "expected_output": "What should happen instead",
  "priority": "Choose ONE: Blocker, Critical, High, Medium, or Low",
  "severity": "Choose ONE: Critical, High, Medium, or Low",
  "assignee": "Suggest most appropriate role: Frontend Dev, Backend Dev, Full Stack, QA, or DevOps",
}

Rules:
- Do NOT leave any field empty
- Do NOT add assumptions unless logical
- Be concise, professional, and bug-tracker ready
- Priority must be one of: Blocker, Critical, High, Medium, Low
- Severity must be one of: Critical, High, Medium, Low
`;

  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a senior QA engineer who creates professional bug reports. Always respond with valid JSON only. Never leave fields empty."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3
    });

    const text = response.choices[0].message.content;
    const cleanedText = text.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Bug Report Generation Failed:", error);
    throw error;
  }
}
