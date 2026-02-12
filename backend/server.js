import express from "express";
import cors from "cors";
import http from "http";
import XLSX from "xlsx";
import multer from "multer";
import mongoose from "mongoose";

import connectDB from "./config/database.js";
import Issue from "./models/Issue.js";
import Settings from "./models/Settings.js";
import TeamMember from "./models/TeamMember.js";
import ApiKey from "./models/ApiKey.js";

import { initSocket, emitNewBug, emitBugUpdated, emitIssueDeleted } from "./socket.js";
import { analyzeApp } from "./analyzer/playwrightAnalyzer.js";
import { interpretSignals } from "./analyzer/signalInterpreter.js";
import { composeBug } from "./analyzer/bugComposer.js";
import { createBugSignature } from "./analyzer/bugSignature.js";
import { generateStructuredBugReport } from "./ai/bugAI.js";

import {
  getComprehensiveAnalytics,
  getTrendComparison,
  getDistinctApps
} from "./utils/reportingUtils.js";

import {
  parseExcelTestCases,
  validateTestCases
} from "./utils/testCaseParser.js";

import {
  generatePlaywrightSpec,
  generateSummary
} from "./utils/playwrightGenerator.js";

import {
  generateApiKey,
  maskApiKey,
  getDefaultRateLimit
} from "./utils/apiKeyUtils.js";

/* ===============================
   APP SETUP
================================ */

connectDB();

const app = express();
const server = http.createServer(app);
initSocket(server);

/* ===============================
   CORS CONFIGURATION (PRODUCTION-READY)
================================ */

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  process.env.FRONTEND_URL_PROD,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174"
].filter(Boolean); // Remove undefined values

console.log("🔒 Allowed CORS origins:", allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

app.use(express.json());

/* ===============================
   HEALTH CHECK ENDPOINT
================================ */

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "BugBuddy Backend API",
    timestamp: new Date().toISOString(),
    mongoConnected: isMongoConnected
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    mongodb: isMongoConnected ? "connected" : "disconnected",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/* ===============================
   STORAGE FALLBACK
================================ */

let isMongoConnected = false;
const inMemoryIssues = [];
const inMemorySettings = new Map();

/* ===============================
   MULTER (EXCEL UPLOAD)
================================ */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".xls", ".xlsx"];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
    allowed.includes(ext) ? cb(null, true) : cb(new Error("Only Excel files allowed"));
  }
});

/* ===============================
   MONGO CONNECTION FLAGS
================================ */

mongoose.connection.on("connected", () => {
  isMongoConnected = true;
  console.log("✅ MongoDB connected");
});

mongoose.connection.on("error", () => {
  isMongoConnected = false;
  console.warn("⚠️ MongoDB unavailable — using in-memory storage");
});

/* ===============================
   SMART CLASSIFICATION
================================ */

function classifyBug(title = "", description = "") {
  const text = `${title} ${description}`.toLowerCase();

  let severity = "Low";
  let type = "Functional";

  if (/\b(crash|panic|fatal|security|unauthorized|white screen)\b/.test(text))
    severity = "Critical";
  else if (/\b(error|failed|exception|timeout|null|undefined)\b/.test(text))
    severity = "High";
  else if (/\b(warning|bug|validation|incorrect)\b/.test(text))
    severity = "Medium";

  if (/\b(api|network|fetch|axios|xhr|dns|gateway|404|500)\b/.test(text))
    type = "Network";
  else if (/\b(login|auth|token|session|password)\b/.test(text))
    type = "Authentication";
  else if (/\b(css|ui|ux|layout|responsive|overlap)\b/.test(text))
    type = "UI/UX";
  else if (/\b(slow|lag|performance|load time|memory|cpu)\b/.test(text))
    type = "Performance";

  return { severity, type };
}

/* ===============================
   BUG INGESTION
================================ */

app.post("/api/bugs/ingest", async (req, res) => {
  try {
    const signal = req.body;
    const signalType = signal.type || signal.signalType;

    // Optional impact context (if provided by SDK / monitor)
    const userId = signal.userId || signal.user || signal.userEmail || signal.userIdHash;
    const sessionId = signal.sessionId || signal.session || signal.sessionKey;

    // Detect if this is a BugBuddy test failure
    const isBugBuddyTest = signalType === 'PLAYWRIGHT_TEST_FAILURE' ||
      signalType === 'PLAYWRIGHT_E2E_ERROR' ||
      signal.source === 'playwright' ||
      signal.testName;

    const apiKeyValue = req.headers["x-api-key"];
    let appMeta = { appId: "default", appName: "Legacy", environment: "unknown" };

    // Skip API key validation for BugBuddy tests (they're internal, not external apps)
    if (apiKeyValue && !isBugBuddyTest) {
      const key = await ApiKey.findOne({ apiKey: apiKeyValue, isActive: true });
      if (!key) return res.status(401).json({ error: "Invalid API key" });

      const oneHourAgo = new Date(Date.now() - 3600000);
      const usage = await Issue.countDocuments({
        appId: key.appId,
        createdAt: { $gte: oneHourAgo }
      });

      if (usage >= key.rateLimit)
        return res.status(429).json({ error: "Rate limit exceeded" });

      key.lastUsedAt = new Date();
      await key.save();

      appMeta = {
        appId: key.appId,
        appName: key.appName,
        environment: key.environment
      };
    }

    const interpreted = interpretSignals([signal]);
    if (!interpreted.length) return res.json({ status: "ignored" });

    const item = interpreted[0];
    const signature = createBugSignature(item, signal.url);

    // Enhanced duplicate detection: check by signature first
    let existing = isMongoConnected
      ? await Issue.findOne({ signature })
      : inMemoryIssues.find(i => i.signature === signature);

    // Fallback: Check by title+description if no signature match
    if (!existing && item.title) {
      const normalizedTitle = item.title.toLowerCase().trim();


      if (isMongoConnected) {
        const allIssues = await Issue.find();
        existing = allIssues.find(issue => {
          const issueTitle = (issue.title || '').toLowerCase().trim();

          return issueTitle === normalizedTitle;
        });
      } else {
        existing = inMemoryIssues.find(i => {
          const issueTitle = (i.title || '').toLowerCase().trim();

          return issueTitle === normalizedTitle;
        });
      }
    }

    if (existing) {
      existing.occurrences = (existing.occurrences || 1) + 1;
      existing.lastOccurrence = new Date();

      // Approximate impact counters
      if (userId) {
        existing.affectedUsers = (existing.affectedUsers || 0) + 1;
      }
      if (sessionId) {
        existing.affectedSessions = (existing.affectedSessions || 0) + 1;
      }
      if (isMongoConnected) await existing.save();
      emitBugUpdated(existing);
      console.log(`🔄 Duplicate detected: ${existing.id} (occurrences: ${existing.occurrences})`);
      return res.json({ status: "duplicate", bugId: existing.id });
    }

    const enriched = await composeBug(item, signal.url);
    const smart = classifyBug(item.title, item.description);

    // Determine proper labeling based on source
    let createdBy = "Auto-Monitor";
    let module = enriched.module || "Application";

    if (isBugBuddyTest) {
      createdBy = "BugBuddy";
      module = "BugBuddy Tests";
      appMeta = {
        appId: "bugbuddy-tests",
        appName: signal.testFile || "BugBuddy Test Suite",
        environment: "Test"
      };
    }

    const bug = {
      id: `BUG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      signature,
      ...enriched,
      module,
      severity: enriched.severity || smart.severity,
      type: enriched.type || smart.type,
      status: "Todo",
      createdBy,
      createdAt: new Date(),
      isAuto: true,
      affectedUsers: userId ? 1 : 0,
      affectedSessions: sessionId ? 1 : 0,
      ...appMeta
    };

    if (isMongoConnected) await Issue.create(bug);
    else inMemoryIssues.unshift(bug);

    emitNewBug(bug);
    res.json({ status: "created", bugId: bug.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ingestion failed" });
  }
});

/* ===============================
   AI BUG REPORT GENERATION
================================ */

app.post("/api/bugs/generate-report", async (req, res) => {
  try {
    const { plainTextDescription } = req.body;

    if (!plainTextDescription || !plainTextDescription.trim()) {
      return res.status(400).json({ error: "Plain text description is required" });
    }

    console.log('🤖 Generating AI bug report for:', plainTextDescription);

    // Call AI function to generate structured report
    const report = await generateStructuredBugReport(plainTextDescription);

    console.log('✅ AI report generated successfully');
    res.json({ report });
  } catch (err) {
    console.error('❌ AI generation error:', err);
    res.status(500).json({ error: err.message || "Failed to generate AI report" });
  }
});

/* ===============================
   GET ISSUES
================================ */

app.get("/api/issues", async (req, res) => {
  const issues = isMongoConnected
    ? await Issue.find().sort({ createdAt: -1 })
    : inMemoryIssues;
  res.json(issues);
});

/* ===============================
   CREATE MANUAL ISSUE
================================ */

app.post("/api/issues", async (req, res) => {
  const { title, description, severity, createdBy, type, appName, steps, expected, actual, browser, environment } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: "Title required" });

  // Check for duplicates by title + description
  const normalizedTitle = title.trim().toLowerCase();


  let existing;
  if (isMongoConnected) {
    const allIssues = await Issue.find();
    existing = allIssues.find(issue => {
      const issueTitle = (issue.title || '').toLowerCase().trim();
      return issueTitle === normalizedTitle;
    });
  } else {
    existing = inMemoryIssues.find(i => {
      const issueTitle = (i.title || '').toLowerCase().trim();
      return issueTitle === normalizedTitle;
    });
  }

  if (existing) {
    // Update occurrence count instead of creating duplicate
    existing.occurrences = (existing.occurrences || 1) + 1;
    existing.lastOccurrence = new Date();
    if (isMongoConnected) await existing.save();
    emitBugUpdated(existing);
    console.log(`🔄 Duplicate manual issue detected: ${existing.id}`);
    return res.json({
      success: true,
      issue: existing,
      duplicate: true,
      message: "Similar issue already exists. Occurrence count incremented."
    });
  }

  const issue = {
    id: `BUG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: title.trim(),
    description: description || "",
    severity: severity || "Medium",
    status: "Todo",
    createdAt: new Date(),
    isAuto: false,
    createdBy: createdBy || "Manual",
    type: type || "Functional",
    appName: appName || "Unknown",
    steps: steps || [],
    expected: expected || "",
    actual: actual || "",
    browser: browser || "Unknown",
    environment: environment || "Production"
  };

  if (isMongoConnected) await Issue.create(issue);
  else inMemoryIssues.unshift(issue);

  emitNewBug(issue);
  res.json({ success: true, issue });
});

/* ===============================
   API KEY LIST (FIXED)
================================ */

app.get("/api/keys", async (req, res) => {
  const keys = await ApiKey.find().sort({ createdAt: -1 });

  const result = await Promise.all(
    keys.map(async key => {
      const oneHourAgo = new Date(Date.now() - 3600000);
      const currentUsage = await Issue.countDocuments({
        appId: key.appId,
        createdAt: { $gte: oneHourAgo }
      });

      return {
        _id: key._id,
        apiKey: key.apiKey, // Returning full key as requested
        apiKeyPreview: key.apiKeyPreview,
        appName: key.appName,
        appId: key.appId,
        environment: key.environment,
        isActive: key.isActive,
        rateLimit: key.rateLimit,
        currentUsage,
        usagePercent: Math.round((currentUsage / key.rateLimit) * 100),
        owner: key.owner,
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt
      };
    })
  );

  res.json(result);
});

/* ===============================
   EXCEL → PLAYWRIGHT
================================ */

app.post("/api/test-cases/parse", upload.single("excelFile"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const testCases = parseExcelTestCases(req.file.buffer);
  const validation = validateTestCases(testCases);
  if (!validation.valid) return res.status(400).json(validation);

  res.json({
    success: true,
    summary: generateSummary(testCases),
    specContent: generatePlaywrightSpec(testCases, req.file.originalname)
  });
});

/* ===============================
   UPDATE ISSUE STATUS
================================ */

app.patch("/api/issues/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, currentUser } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    // Build the update object with ownership tracking
    const now = new Date();
    const userName = currentUser
      ? `${currentUser.empId || 'SYS'} - ${currentUser.name || 'System'}`
      : 'System';

    const updateFields = { status };

    // Set ownership timestamps based on status transition
    if (status === "Open" || status === "New") {
      updateFields.openedBy = userName;
      updateFields.openedAt = now;
    } else if (status === "Fixed" || status === "Resolved") {
      updateFields.fixedBy = userName;
      updateFields.fixedAt = now;
      updateFields.resolvedAt = now;
    } else if (status === "Closed") {
      updateFields.closedAt = now;
      // Also set resolvedAt if not already set
      updateFields.resolvedAt = now;
    }

    let updatedIssue;
    if (isMongoConnected) {
      updatedIssue = await Issue.findOneAndUpdate(
        { id },
        updateFields,
        { new: true }
      );
      if (!updatedIssue) {
        return res.status(404).json({ error: "Issue not found" });
      }
    } else {
      const issue = inMemoryIssues.find(i => i.id === id);
      if (!issue) {
        return res.status(404).json({ error: "Issue not found" });
      }
      Object.assign(issue, updateFields);
      updatedIssue = issue;
    }

    console.log(`🔄 Updated issue status: ${id} -> ${status} (by ${userName})`);
    emitBugUpdated(updatedIssue);
    res.json({ success: true, issue: updatedIssue });
  } catch (err) {
    console.error("Update status failed:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

/* ===============================
   DELETE ISSUE
================================ */

app.delete("/api/issues/:id", async (req, res) => {
  try {
    const { id } = req.params;

    let deletedIssue;
    if (isMongoConnected) {
      deletedIssue = await Issue.findOneAndDelete({ id });
      if (!deletedIssue) {
        return res.status(404).json({ error: "Issue not found" });
      }
      console.log(`🗑️  Deleted issue from MongoDB: ${id}`);
    } else {
      const index = inMemoryIssues.findIndex(i => i.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Issue not found" });
      }
      deletedIssue = inMemoryIssues[index];
      inMemoryIssues.splice(index, 1);
      console.log(`🗑️  Deleted issue from in-memory (remaining: ${inMemoryIssues.length}): ${id}`);
    }

    // Emit socket event so all connected clients remove the issue
    emitIssueDeleted(id);

    res.json({ success: true, message: "Issue deleted", id });
  } catch (err) {
    console.error("Delete issue failed:", err);
    res.status(500).json({ error: "Failed to delete issue" });
  }
});

/* ===============================
   TOGGLE API KEY STATUS
================================ */

app.put("/api/keys/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;

    const key = await ApiKey.findById(id);
    if (!key) {
      return res.status(404).json({ error: "API key not found" });
    }

    key.isActive = !key.isActive;
    await key.save();

    console.log(`🔑 Toggled API key: ${key.appName} → ${key.isActive ? 'Active' : 'Disabled'}`);

    res.json({
      success: true,
      isActive: key.isActive,
      message: `API key ${key.isActive ? 'enabled' : 'disabled'}`
    });

  } catch (err) {
    console.error("Toggle API key failed:", err);
    res.status(500).json({ error: "Failed to toggle API key" });
  }
});

/* ===============================
   DELETE API KEY
================================ */

app.delete("/api/keys/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const key = await ApiKey.findByIdAndDelete(id);
    if (!key) {
      return res.status(404).json({ error: "API key not found" });
    }

    console.log(`🗑️  Deleted API key: ${key.appName} (${key.environment})`);

    res.json({
      success: true,
      message: "API key deleted"
    });
  } catch (err) {
    console.error("Delete API key failed:", err);
    res.status(500).json({ error: "Failed to delete API key" });
  }
});

/* ===============================
   GENERATE NEW API KEY
================================ */

app.post("/api/keys/generate", async (req, res) => {
  try {
    const { appName, environment, rateLimit, owner } = req.body;

    // Validation
    if (!appName || !appName.trim()) {
      return res.status(400).json({ error: "App name is required" });
    }

    if (!['development', 'staging', 'production'].includes(environment)) {
      return res.status(400).json({ error: "Invalid environment" });
    }

    // Generate unique API key
    const apiKey = generateApiKey(environment);
    const apiKeyPreview = maskApiKey(apiKey);

    // Generate appId from appName (lowercase, no spaces)
    const appId = appName.toLowerCase().replace(/\s+/g, '-') + '-' + environment;

    // Use provided rate limit or default
    const finalRateLimit = rateLimit || getDefaultRateLimit(environment);

    const keyData = {
      apiKey,
      apiKeyPreview,
      appName: appName.trim(),
      appId,
      environment,
      isActive: true,
      rateLimit: finalRateLimit,
      owner: owner || '',
      createdAt: new Date()
    };

    const newKey = await ApiKey.create(keyData);

    console.log(`🔑 Generated new API key for: ${appName} (${environment})`);

    // Return full key ONLY on creation (never again!)
    res.json({
      success: true,
      apiKey: apiKey,
      apiKeyPreview: apiKeyPreview,
      appName: newKey.appName,
      appId: newKey.appId,
      environment: newKey.environment,
      rateLimit: newKey.rateLimit,
      createdAt: newKey.createdAt,
      message: "Save this key securely - you won't see it again!"
    });

  } catch (err) {
    console.error("Generate API key failed:", err);
    res.status(500).json({ error: "Failed to generate API key" });
  }
});

/* ===============================
   ANALYTICS ENDPOINTS
================================ */

app.get("/api/analytics/comprehensive", async (req, res) => {
  try {
    const analytics = await getComprehensiveAnalytics();
    res.json(analytics);
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

app.get("/api/analytics/trends", async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const trends = await getTrendComparison(period);
    res.json(trends);
  } catch (err) {
    console.error("Trends error:", err);
    res.status(500).json({ error: "Failed to fetch trends" });
  }
});

// Add endpoint that ReportsPage expects
app.get("/api/reports/analytics", async (req, res) => {
  try {
    const { timeRange = 'all', appName = null } = req.query;
    const analytics = await getComprehensiveAnalytics(timeRange, appName);
    res.json(analytics);
  } catch (err) {
    console.error("Reports analytics error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// Distinct apps for the filter dropdown
app.get("/api/reports/apps", async (req, res) => {
  try {
    const apps = await getDistinctApps();
    res.json(apps);
  } catch (err) {
    console.error("Failed to fetch apps:", err);
    res.status(500).json({ error: "Failed to fetch apps" });
  }
});

/* ===============================
   SERVER START
================================ */

const PORT = process.env.PORT || 4000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);
});
