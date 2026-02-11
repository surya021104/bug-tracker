// src/modules/issues/IssueList.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import IssueCard from "./IssueCard";
import { getSafeTimestamp } from "./issueUtils";

export default function IssueList({ issues, onStatusChange, onDelete, selectedIssues = [], onSelectIssue, onSelectAll, isAllSelected, emptyMessage }) {
  if (!issues || issues.length === 0) {
    return <div className="empty">{emptyMessage || "No issues found"}</div>;
  }

  // Memoize sorted issues to prevent unnecessary re-sorting
  // Uses safe date parsing to handle invalid or missing createdAt values
  const sortedIssues = useMemo(() => {
    return [...issues].sort((a, b) => {
      const timeA = getSafeTimestamp(a.createdAt);
      const timeB = getSafeTimestamp(b.createdAt);
      return timeB - timeA; // Descending order (newest first)
    });
  }, [issues]);

  return (
    <div className="issue-list anim-fade-up">
      {/* List Header - Perfectly Aligned with Cards */}
      <div className="issue-list-header" style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        marginBottom: '12px',
        color: '#6b7280',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {/* 1. Select All Checkbox */}
        <div style={{ width: '40px', display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            onChange={onSelectAll}
            checked={isAllSelected}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#667eea' }}
            title="Select All"
          />
        </div>

        {/* 2. ID */}
        <div style={{ width: '160px' }}>ID</div>

        {/* 3. Module */}
        <div style={{ width: '120px' }}>Module</div>

        {/* 4. Title & Meta */}
        <div style={{ flex: 1 }}>Title</div>

        {/* 5. Status */}
        <div style={{ width: '140px', textAlign: 'center' }}>Status</div>

        {/* 6. Severity */}
        <div style={{ width: '100px', textAlign: 'center' }}>Severity</div>

        {/* 7. Delete (Empty placeholder for alignment) */}
        <div style={{ width: '48px' }}></div>
      </div>
      {sortedIssues.map(issue => (
        <IssueCard
          key={issue.id}
          issue={issue}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          isSelected={selectedIssues.includes(issue.id)}
          onSelect={onSelectIssue}
          showCheckbox={!!onSelectIssue}
        />
      ))}
    </div>
  );
}

IssueList.propTypes = {
  issues: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    createdAt: PropTypes.string,
    description: PropTypes.string,
    severity: PropTypes.string,
    module: PropTypes.string,
    applicationUrl: PropTypes.string,
  })),
  onStatusChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  selectedIssues: PropTypes.array,
  onSelectIssue: PropTypes.func,
  emptyMessage: PropTypes.string,
};

IssueList.defaultProps = {
  issues: [],
  selectedIssues: [],
  emptyMessage: "No issues found",
};
