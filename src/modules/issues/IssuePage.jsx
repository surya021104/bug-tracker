// src/modules/issues/IssuePage.jsx
import React, { useState, useMemo } from "react";
import IssueHeader from "./IssueHeader";
import IssueList from "./IssueList";
import useIssues from "../../hooks/useIssues";
import { RESOLVED_STATUSES } from "./constants";
import { filterIssuesByStatus } from "./issueUtils";
import { X, Trash2, CheckCircle, AlertCircle, LayoutList } from "lucide-react";
import "./FloatingActionBar.css";

export default function IssuePage({ currentUser }) {
  const { issues, addIssue, updateStatus, generateAIReport, deleteIssue } = useIssues();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState('active'); // 'active' | 'resolved' | 'all'
  const [selectedIssues, setSelectedIssues] = useState([]);

  const nonBugBuddyIssues = useMemo(() => {
    return issues.filter(issue => issue.createdBy !== 'BugBuddy');
  }, [issues]);

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
  };

  const activeIssues = useMemo(() => {
    return nonBugBuddyIssues.filter(i => !RESOLVED_STATUSES.includes(i.status));
  }, [nonBugBuddyIssues]);

  const resolvedIssues = useMemo(() => {
    return nonBugBuddyIssues.filter(i => RESOLVED_STATUSES.includes(i.status));
  }, [nonBugBuddyIssues]);

  const filteredIssues = useMemo(() => {
    let baseIssues;
    if (viewMode === 'active') baseIssues = activeIssues;
    else if (viewMode === 'resolved') baseIssues = resolvedIssues;
    else baseIssues = nonBugBuddyIssues;
    return filterIssuesByStatus(baseIssues, selectedFilter);
  }, [nonBugBuddyIssues, activeIssues, resolvedIssues, selectedFilter, viewMode]);

  const handleSelectAll = () => {
    if (selectedIssues.length === filteredIssues.length) {
      setSelectedIssues([]);
    } else {
      setSelectedIssues(filteredIssues.map(issue => issue.id));
    }
  };

  const handleSelectIssue = (id) => {
    setSelectedIssues(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIssues.length === 0) return;

    if (!window.confirm(`Delete ${selectedIssues.length} selected issue(s)?`)) {
      return;
    }

    try {
      await Promise.all(selectedIssues.map(id => deleteIssue(id)));
      setSelectedIssues([]);
      console.log(`✅ Deleted ${selectedIssues.length} issues`);
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  const handleClearSelection = () => {
    setSelectedIssues([]);
  };

  return (
    <>
      <IssueHeader
        issues={viewMode === 'resolved' ? resolvedIssues : (viewMode === 'all' ? nonBugBuddyIssues : activeIssues)}
        onAddIssue={(issueData) => addIssue(issueData, currentUser)}
        onGenerateAI={generateAIReport}
        currentUser={currentUser}
        selectedFilter={selectedFilter}
        onFilterChange={handleFilterChange}
      />

      {selectedIssues.length > 0 && (
        <div className="floating-action-bar">
          <div className="action-bar-content">
            <div className="action-bar-left">
              <div className="selected-count">
                <span className="count">{selectedIssues.length}</span>
                <span className="label">selected</span>
              </div>
              <button onClick={handleClearSelection} className="btn-clear">
                <X size={16} />
                Clear Selection
              </button>
            </div>
            <div className="action-bar-right">
              <button onClick={handleSelectAll} className="btn-select-all">
                {selectedIssues.length === filteredIssues.length ? 'Deselect All' : 'Select All'}
              </button>
              <button onClick={handleBulkDelete} className="btn-delete-bulk">
                <Trash2 size={16} />
                Delete {selectedIssues.length} {selectedIssues.length === 1 ? 'Issue' : 'Issues'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Segmented Tab Bar */}
      <div className="issue-view-tabs">
        <button
          className={`view-tab ${viewMode === 'active' ? 'active' : ''}`}
          onClick={() => setViewMode('active')}
        >
          <AlertCircle size={15} />
          Active
          <span className="tab-count">{activeIssues.length}</span>
        </button>
        <button
          className={`view-tab ${viewMode === 'resolved' ? 'active' : ''}`}
          onClick={() => setViewMode('resolved')}
        >
          <CheckCircle size={15} />
          Resolved
          <span className="tab-count">{resolvedIssues.length}</span>
        </button>
        <button
          className={`view-tab ${viewMode === 'all' ? 'active' : ''}`}
          onClick={() => setViewMode('all')}
        >
          <LayoutList size={15} />
          All
          <span className="tab-count">{nonBugBuddyIssues.length}</span>
        </button>
      </div>

      <IssueList
        issues={filteredIssues}
        onStatusChange={(id, status) => updateStatus(id, status, currentUser)}
        onDelete={deleteIssue}
        selectedIssues={selectedIssues}
        onSelectIssue={handleSelectIssue}
        onSelectAll={handleSelectAll}
        isAllSelected={selectedIssues.length > 0 && selectedIssues.length === filteredIssues.length}
      />
    </>
  );
}
