// src/modules/issues/IssueHeader.jsx
import React, { useState } from "react";

export default function IssueHeader({
  issues,
  onAddIssue,
  onGenerateAI,
  currentUser,
  selectedFilter,
  onFilterChange
}) {
  const total = issues.length;
  const newCount = issues.filter(i => i.status === "Open" || i.status === "New").length;
  const inProgress = issues.filter(i => i.status === "In Progress").length;
  const fixed = issues.filter(i => i.status === "Fixed").length;
  const closed = issues.filter(i => i.status === "Closed" || i.status === "Resolved").length;
  const todo = issues.filter(i => i.status === "Todo").length;

  // Form state
  const [aiMode, setAiMode] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [module, setModule] = useState("");
  const [severity, setSeverity] = useState("Medium");

  const handleGenerateAI = async () => {
    if (!title.trim()) {
      setError("Please enter an issue title first");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const report = await onGenerateAI(title);

      // Populate form with AI-generated data
      setDescription(report.description || "");
      setSteps(report.steps_to_reproduce || "");
      setExpected(report.expected_output || "");
      setActual(report.actual_output || "");
      setModule(report.module || "Frontend");
      setSeverity(report.severity || "Medium");
      setShowForm(true);
    } catch (err) {
      setError("AI generation failed. Please fill manually or try again.");
      console.error("AI generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setError("");

    try {
      const issueData = {
        title: title.trim(),
        description,
        steps,
        expected,
        actual,
        module: module || "Frontend",
        severity: severity || "Medium"
      };

      console.log('Submitting issue with data:', issueData);
      await onAddIssue(issueData);
      console.log('Issue submitted successfully');

      // Clear form
      setTitle("");
      setDescription("");
      setSteps("");
      setExpected("");
      setActual("");
      setModule("");
      setSeverity("Medium");
      setShowForm(false);
    } catch (err) {
      setError("Failed to create issue. Please try again.");
      console.error("Submit error:", err);
      console.error("Error details:", err.message, err.stack);
    }
  };

  const statConfig = [
    { key: 'all', label: 'All Issues', count: total, color: '#6366f1' },
    { key: 'Todo', label: 'Todo', count: todo, color: '#8b5cf6' },
    { key: 'Open', label: 'Open', count: newCount, color: '#3b82f6' },
    { key: 'In Progress', label: 'In Progress', count: inProgress, color: '#f59e0b' },
    { key: 'Fixed', label: 'Fixed', count: fixed, color: '#10b981' },
    { key: 'Closed', label: 'Closed', count: closed, color: '#6b7280' }
  ];

  return (
    <div className="issue-header-premium">
      {/* Hero Section */}
      <div className="hero-premium">
        <div className="hero-content">
          <div className="hero-title-section">
            <h1 className="hero-title">Issue Tracker</h1>
            <p className="hero-subtitle">Track, manage, and resolve issues efficiently</p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid-premium">
            {statConfig.map(stat => (
              <div
                key={stat.key}
                className={`stat-card-premium ${selectedFilter === stat.key ? 'stat-active-premium' : ''}`}
                onClick={() => onFilterChange(stat.key)}
                style={{ '--stat-color': stat.color }}
              >
                <div className="stat-number">{stat.count}</div>
                <div className="stat-label">{stat.label}</div>
                {selectedFilter === stat.key && <div className="stat-indicator"></div>}
              </div>
            ))}
          </div>

          {/* Create Issue Button */}
          {!showForm && (
            <button
              className="btn-create-issue"
              onClick={() => setShowForm(true)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              New Issue
            </button>
          )}
        </div>
      </div>

      {/* Issue Creation Form */}
      {showForm && (
        <div className="issue-form-container">
          <div className="issue-form-card">
            <div className="form-header">
              <h2 className="form-title">Create New Issue</h2>
              <button className="btn-close" onClick={() => {
                setShowForm(false);
                setTitle("");
                setDescription("");
                setSteps("");
                setExpected("");
                setActual("");
                setModule("");
                setSeverity("Medium");
                setError("");
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* AI Toggle */}
            <label className="ai-toggle-premium">
              <input
                type="checkbox"
                checked={aiMode}
                onChange={(e) => setAiMode(e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                AI-Enhanced Mode
              </span>
            </label>

            {error && (
              <div className="error-banner">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                  <path d="M10 6V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="10" cy="14" r="1" fill="currentColor" />
                </svg>
                {error}
              </div>
            )}

            {/* Title Input */}
            <div className="form-group-premium">
              <label className="form-label">Issue Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Login button not responding to clicks"
                className="form-input-premium"
                disabled={isGenerating}
              />
            </div>

            {/* AI Generate Button */}
            {aiMode && (
              <button
                className={`btn-generate-ai ${isGenerating ? 'generating' : ''}`}
                onClick={handleGenerateAI}
                disabled={isGenerating || !title.trim()}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner"></span>
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Generate Details with AI
                  </>
                )}
              </button>
            )}

            {/* Additional Fields */}
            <div className="form-fields-grid">
              <div className="form-group-premium">
                <label className="form-label">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the issue..."
                  className="form-textarea-premium"
                  rows="3"
                />
              </div>

              <div className="form-group-premium">
                <label className="form-label">Steps to Reproduce</label>
                <textarea
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. Observe..."
                  className="form-textarea-premium code"
                  rows="4"
                />
              </div>

              <div className="form-row-premium">
                <div className="form-group-premium">
                  <label className="form-label">Expected Result</label>
                  <textarea
                    value={expected}
                    onChange={(e) => setExpected(e.target.value)}
                    placeholder="What should happen..."
                    className="form-textarea-premium"
                    rows="2"
                  />
                </div>

                <div className="form-group-premium">
                  <label className="form-label">Actual Result</label>
                  <textarea
                    value={actual}
                    onChange={(e) => setActual(e.target.value)}
                    placeholder="What actually happens..."
                    className="form-textarea-premium"
                    rows="2"
                  />
                </div>
              </div>

              <div className="form-row-premium">
                <div className="form-group-premium">
                  <label className="form-label">Module</label>
                  <input
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                    placeholder="e.g., Login, Dashboard"
                    className="form-input-premium"
                  />
                </div>

                <div className="form-group-premium">
                  <label className="form-label">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="form-select-premium"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                className="btn-secondary-premium"
                onClick={() => {
                  setShowForm(false);
                  setTitle("");
                  setDescription("");
                  setSteps("");
                  setExpected("");
                  setActual("");
                  setModule("");
                  setSeverity("Medium");
                  setError("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary-premium"
                onClick={handleSubmit}
                disabled={!title.trim()}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.5 5L7.5 14L3.5 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Submit Issue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Search and Filter Toolbar */}
      <div className="search-filter-premium">
        {/* Search Bar - Centered */}
        <div className="search-container-premium">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="search-icon">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
            <path d="M12.5 12.5L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input placeholder="Search issues, modules, reporters..." className="search-input-premium" />
        </div>

        {/* Utility Buttons */}
        <div className="filter-controls">
          <button className="btn-filter">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 4.5H16M5 9H13M7.5 13.5H10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Filter
          </button>
          <button className="btn-filter">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 5H15M6 9H12M8 13H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Sort
          </button>
          <button className="btn-filter">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M14 3V15H4V3M6 3V1H12V3M7.5 7V11M10.5 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
