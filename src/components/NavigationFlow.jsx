/**
 * Navigation Flow Display Component
 * Shows user's navigation path visually
 */

import React from 'react';
import { formatTimeOnly } from '../utils/dateUtils';

export default function NavigationFlow({ flow }) {
  // Handle both formats: array or object with flow property
  const actualFlow = Array.isArray(flow) ? flow : (flow?.flow || []);

  if (!actualFlow || actualFlow.length === 0) {
    return <div className="navigation-flow-empty">No navigation data available</div>;
  }

  // Show only last 5 entries for cleaner display
  const displayFlow = actualFlow.slice(-5);

  const formatDuration = (ms) => {
    if (!ms || ms < 1000) return `${ms || 0}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (timestamp) => {
    return formatTimeOnly(timestamp);
  };

  // Extract module/page name from URL
  const getPageName = (navItem) => {
    const url = navItem.path || navItem.url || navItem.pathname || navItem.fullUrl || navItem.referrer || '';

    console.log('🔍 Nav item:', navItem, 'URL:', url);

    if (!url || url === '/' || url === 'Unknown URL') return 'Home';

    // Remove query params and hash
    const cleanUrl = url.split('?')[0].split('#')[0];

    // Get last meaningful part
    const parts = cleanUrl.split('/').filter(p => p);
    if (parts.length === 0) return 'Home';

    // Capitalize and format
    const pageName = parts[parts.length - 1]
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return pageName || parts[parts.length - 2] || 'Page';
  };

  // Get full URL from navigation item
  const getFullUrl = (navItem) => {
    const url = navItem.path || navItem.url || navItem.pathname || navItem.fullUrl || navItem.referrer;
    return url && url !== 'Unknown URL' ? url : 'URL not captured';
  };

  return (
    <div className="navigation-flow">
      <h4 className="flow-title">🗺️ User Navigation Path</h4>

      {/* Visual Journey Summary */}
      <div className="journey-summary">
        {displayFlow.map((nav, i) => (
          <span key={i} className="journey-step">
            {getPageName(nav)}
            {i < displayFlow.length - 1 && ' → '}
          </span>
        ))}
      </div>

      <div className="flow-timeline">
        {displayFlow.map((nav, index) => {
          const isErrorPage = index === displayFlow.length - 1;

          return (
            <div key={index} className={`flow-item ${isErrorPage ? 'error-page' : ''}`}>
              <div className="flow-time">{formatTime(nav.timestamp)}</div>
              <div className="flow-connector">
                <div className={`flow-dot ${isErrorPage ? 'error-dot' : ''}`}></div>
                {index < flow.length - 1 && <div className="flow-line"></div>}
              </div>
              <div className="flow-content">
                <div className="flow-page-name">{getPageName(nav)}</div>
                <div className="flow-path">{getFullUrl(nav)}</div>
                <div className="flow-meta">
                  {nav.duration > 0 && (
                    <span className="meta-item">⏱️ {formatDuration(nav.duration)}</span>
                  )}
                  {nav.sessionTime !== undefined && (
                    <span className="meta-item">📍 +{formatDuration(nav.sessionTime)} from start</span>
                  )}
                </div>
                {isErrorPage && (
                  <div className="flow-error-badge">❌ Error occurred on this page</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <style jsx>{`
        .navigation-flow {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          padding: 20px;
          margin: 16px 0;
          border: 1px solid #dee2e6;
        }

        .flow-title {
          margin: 0 0 12px 0;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .journey-summary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 600;
          overflow-x: auto;
          white-space: nowrap;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .journey-step {
          display: inline-block;
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .flow-timeline {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .flow-item {
          display: grid;
          grid-template-columns: 90px 40px 1fr;
          gap: 12px;
          align-items: start;
          padding: 12px;
          border-radius: 8px;
          transition: all 0.2s;
          background: white;
        }

        .flow-item:hover {
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .flow-item.error-page {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border-left: 4px solid #ef4444;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }

        .flow-time {
          font-size: 13px;
          color: #6b7280;
          font-family: 'Courier New', monospace;
          font-weight: 600;
          padding-top: 4px;
        }

        .flow-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .flow-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border: 3px solid white;
          box-shadow: 0 0 0 2px #3b82f6, 0 2px 4px rgba(0,0,0,0.2);
          z-index: 1;
        }

        .flow-dot.error-dot {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          box-shadow: 0 0 0 2px #ef4444, 0 2px 8px rgba(239, 68, 68, 0.4);
          width: 16px;
          height: 16px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .flow-line {
          width: 3px;
          flex: 1;
          background: linear-gradient(180deg, #cbd5e1 0%, #e2e8f0 100%);
          margin-top: 6px;
          min-height: 30px;
        }

        .flow-content {
          padding-bottom: 4px;
        }

        .flow-page-name {
          font-weight: 700;
          color: #1f2937;
          font-size: 16px;
          margin-bottom: 6px;
          letter-spacing: 0.3px;
        }

        .flow-path {
          font-size: 12px;
          color: #6366f1;
          font-family: 'Courier New', monospace;
          margin-bottom: 8px;
          word-break: break-all;
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }

        .flow-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 6px;
        }

        .meta-item {
          font-size: 11px;
          color: #6b7280;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .flow-error-badge {
          display: inline-block;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 700;
          margin-top: 10px;
          box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);
        }

        .navigation-flow-empty {
          color: #9ca3af;
          font-style: italic;
          padding: 20px;
          text-align: center;
          background: #f9fafb;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
