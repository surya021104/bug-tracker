// IssueCard.jsx - With Ownership Tracking & Professional Icons
import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Trash2, User, CheckCircle, Eye } from "lucide-react";
import Status from "../../components/common/Status";
import NavigationFlow from "../../components/NavigationFlow";
import StateFlow from "../../components/StateFlow";
import { formatDateTime, formatShortDateTime as formatShortDate, getRelativeTime, formatFullDate } from "../../utils/dateUtils";
import {
  isResolvedStatus,
  truncateText,
  getNavigationFlow
} from "./issueUtils";
import {
  DEFAULT_SEVERITY,
  DEFAULT_AUTHOR,
  DEFAULT_MODULE,
  VANISH_ANIMATION_DURATION
} from "./constants";

// Helper: Extract initials from a name like "EMP001 - John Smith" -> "JS"
function getInitials(name) {
  if (!name) return '?';
  // Remove employee ID prefix (e.g., "EMP001 - ")
  const cleanName = name.replace(/^[A-Z0-9]+ - /i, '').trim();
  if (!cleanName) return name.charAt(0).toUpperCase();
  const parts = cleanName.split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return cleanName.substring(0, 2).toUpperCase();
}



export default function IssueCard({ issue, onStatusChange, onDelete, isSelected = false, onSelect, showCheckbox = false }) {
  const [open, setOpen] = useState(false);
  const [isVanishing, setIsVanishing] = useState(false);
  const [previousStatus, setPreviousStatus] = useState(issue.status);
  const [justFixed, setJustFixed] = useState(false);

  const severity = (issue.severity || DEFAULT_SEVERITY).toLowerCase();
  const severityClass = `severity-${severity}`;

  const displayModule = useMemo(() =>
    issue.module || issue.applicationUrl || DEFAULT_MODULE,
    [issue.module, issue.applicationUrl]
  );

  const displayAuthor = useMemo(() => {
    // 1. Check if created by explicit user/system
    const creator = issue.createdBy || issue.openedBy || DEFAULT_AUTHOR;

    // 2. Handle specific system signatures
    if (creator === 'Auto-AI Monitor') return 'AI Monitor (Auto)';
    if (creator === 'BugBuddy') return 'BugBuddy Test';

    // 3. Handle API Key vs Manual
    // If it has "API Key" in the name or isAuto is true but no specific system
    if (issue.isAuto && !creator.includes('Monitor')) return `API Key: ${issue.appName || 'External App'}`;

    return creator;
  }, [issue.createdBy, issue.openedBy, issue.isAuto, issue.appName]);

  const navigationFlowData = useMemo(() =>
    getNavigationFlow(issue.navigationFlow),
    [issue.navigationFlow]
  );

  useEffect(() => {
    if (issue.status !== previousStatus) {
      if (isResolvedStatus(issue.status)) {
        setIsVanishing(true);
        setJustFixed(true);
        const timer = setTimeout(() => {
          setIsVanishing(false);
          setJustFixed(false);
        }, VANISH_ANIMATION_DURATION);
        return () => clearTimeout(timer);
      }
      setPreviousStatus(issue.status);
    }
  }, [issue.status, previousStatus]);

  const handleStatusChange = async (newStatus) => {
    if (typeof onStatusChange !== 'function') {
      console.error('IssueCard: onStatusChange callback is not provided');
      return;
    }

    try {
      await onStatusChange(issue.id, newStatus);
    } catch (error) {
      console.error('IssueCard: Failed to update status:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete issue "${issue.title}"?`)) {
      onDelete(issue.id);
    }
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(issue.id);
    }
  };

  const isResolved = isResolvedStatus(issue.status);
  const cardClasses = `issue-card ${open ? "open" : ""} ${isVanishing ? "vanishing" : ""} ${isResolved ? "resolved" : ""} ${isSelected ? "selected" : ""} ${justFixed ? "just-fixed" : ""}`;

  return (
    <div className={cardClasses}>
      <div className="card-top" style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 20px', // Slightly more compact vertical padding
        gap: '0', // Using individual padding/margins for precise control
        width: '100%',
        minHeight: '64px'
      }}>
        {/* 1. Checkbox - Primary Selection Action */}
        <div style={{ width: '40px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxClick}
              onClick={(e) => e.stopPropagation()}
              className="issue-checkbox"
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#667eea' }}
            />
          )}
        </div>

        {/* 2. ID - Quick Reference Identifier */}
        <div className="id" style={{
          width: '160px',
          flexShrink: 0,
          fontFamily: 'Monaco, monospace',
          fontSize: '13px',
          color: '#6b7280',
          fontWeight: '500'
        }}>
          {issue.id}
        </div>

        {/* 3. Module - Context first (Logical grouping) */}
        <div style={{
          width: '120px',
          flexShrink: 0,
          fontSize: '13px',
          color: '#4b5563',
          fontWeight: '500',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          paddingRight: '16px'
        }}>
          {displayModule}
        </div>

        {/* 4. Title - Main Content (Flex Grow) */}
        <div className="title" style={{
          flex: 1,
          fontWeight: '600',
          fontSize: '15px',
          color: '#1f2937',
          paddingRight: '20px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <span>{issue.title}</span>
          {/* Sub-meta: Author & Time (Context for title) */}
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '400', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Source: {displayAuthor}
            {/* Ownership Badges */}
            <span style={{ display: 'inline-flex', gap: '4px', marginLeft: '8px' }}>
              {issue.createdBy && (
                <span title={`Created by: ${issue.createdBy}`} style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '22px', height: '22px', borderRadius: '50%', fontSize: '9px', fontWeight: '700',
                  background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', cursor: 'default'
                }}>{getInitials(issue.createdBy)}</span>
              )}
              {issue.openedBy && (
                <span title={`Opened by: ${issue.openedBy}`} style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '22px', height: '22px', borderRadius: '50%', fontSize: '9px', fontWeight: '700',
                  background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', cursor: 'default'
                }}>{getInitials(issue.openedBy)}</span>
              )}
              {issue.fixedBy && (
                <span title={`Fixed by: ${issue.fixedBy}`} style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '22px', height: '22px', borderRadius: '50%', fontSize: '9px', fontWeight: '700',
                  background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'default'
                }}>{getInitials(issue.fixedBy)}</span>
              )}
            </span>
          </div>
        </div>

        {/* 5. Status - Current State */}
        <div style={{ width: '140px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
          <Status
            value={issue.status}
            issue={issue}
            onChange={handleStatusChange}
          />
        </div>

        {/* 6. Severity - Importance Indicator */}
        <div style={{ width: '100px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
          <div className={`severity ${severityClass}`} style={{
            fontSize: '11px',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            textAlign: 'center',
            minWidth: '80px'
          }}>
            {issue.severity || DEFAULT_SEVERITY}
          </div>
        </div>

        {/* 7. Delete - Destructive Action (Far Right) */}
        <div style={{ width: '48px', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
          {onDelete && (
            <button
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              title="Delete issue"
              style={{
                padding: '8px',
                color: '#9ca3af',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; }}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="card-body">
        <div className="desc">
          <strong>Description:</strong> {truncateText(issue.description)}
        </div>
        <div className="actions">
          <button
            className="btn-text"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls={`issue-details-${issue.id}`}
          >
            {open ? "Hide details" : "View details"}
          </button>
          <div className="relative-time">
            <small style={{ color: 'var(--text-muted)' }}>{getRelativeTime(issue.createdAt)}</small>
          </div>
        </div>
      </div>

      {open && (
        <div className="card-details" id={`issue-details-${issue.id}`}>
          {/* Ownership Timeline */}
          <div className="detail-row" style={{ marginBottom: '16px' }}>
            <div className="label" style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '12px' }}>Handled By</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap' }}>
              {/* Created */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700',
                  background: '#eff6ff', color: '#3b82f6', border: '2px solid #3b82f6'
                }}>
                  <User size={14} />
                </div>
                <div style={{ fontSize: '12px', color: '#374151' }}>
                  <div style={{ fontWeight: '600' }}>Created</div>
                  <div style={{ color: '#6b7280' }}>{issue.createdBy || 'Unknown'}</div>
                  {issue.createdAt && <div style={{ color: '#9ca3af', fontSize: '10px' }}>{formatShortDate(issue.createdAt)}</div>}
                </div>
              </div>

              {/* Connector */}
              <div style={{ width: '32px', height: '2px', background: issue.openedBy ? '#d1d5db' : '#e5e7eb', margin: '0 4px' }} />

              {/* Opened */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: issue.openedBy ? 1 : 0.4 }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700',
                  background: issue.openedBy ? '#fef3c7' : '#f3f4f6', color: issue.openedBy ? '#d97706' : '#9ca3af',
                  border: `2px solid ${issue.openedBy ? '#d97706' : '#d1d5db'}`
                }}>
                  <Eye size={14} />
                </div>
                <div style={{ fontSize: '12px', color: '#374151' }}>
                  <div style={{ fontWeight: '600' }}>Opened</div>
                  <div style={{ color: '#6b7280' }}>{issue.openedBy || '—'}</div>
                  {issue.openedAt && <div style={{ color: '#9ca3af', fontSize: '10px' }}>{formatShortDate(issue.openedAt)}</div>}
                </div>
              </div>

              {/* Connector */}
              <div style={{ width: '32px', height: '2px', background: issue.fixedBy ? '#d1d5db' : '#e5e7eb', margin: '0 4px' }} />

              {/* Fixed */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: issue.fixedBy ? 1 : 0.4 }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700',
                  background: issue.fixedBy ? '#dcfce7' : '#f3f4f6', color: issue.fixedBy ? '#16a34a' : '#9ca3af',
                  border: `2px solid ${issue.fixedBy ? '#16a34a' : '#d1d5db'}`
                }}>
                  <CheckCircle size={14} />
                </div>
                <div style={{ fontSize: '12px', color: '#374151' }}>
                  <div style={{ fontWeight: '600' }}>Resolved</div>
                  <div style={{ color: '#6b7280' }}>{issue.fixedBy || '—'}</div>
                  {issue.fixedAt && <div style={{ color: '#9ca3af', fontSize: '10px' }}>{formatShortDate(issue.fixedAt)}</div>}
                </div>
              </div>
            </div>
          </div>

          {issue.steps && (
            <div className="detail-row">
              <div className="label">Steps</div>
              <div className="value pre">{issue.steps}</div>
            </div>
          )}

          {issue.expected && (
            <div className="detail-row">
              <div className="label">Expected</div>
              <div className="value">{issue.expected}</div>
            </div>
          )}

          {issue.actual && (
            <div className="detail-row">
              <div className="label">Actual</div>
              <div className="value">{issue.actual}</div>
            </div>
          )}

          {navigationFlowData && navigationFlowData.length > 0 && (
            <NavigationFlow data={navigationFlowData} />
          )}

          {issue.stateChanges && issue.stateChanges.length > 0 && (
            <StateFlow stateChanges={issue.stateChanges} />
          )}
        </div>
      )}
    </div>
  );
}

IssueCard.propTypes = {
  issue: PropTypes.object.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func,
  showCheckbox: PropTypes.bool
};
