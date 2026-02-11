/**
 * State Flow Display Component
 * Shows component state changes leading to error
 */

import React from 'react';
import { formatTimeOnly } from '../utils/dateUtils';

export default function StateFlow({ flow }) {
  if (!flow || flow.length === 0) {
    return <div className="state-flow-empty">No state data available</div>;
  }

  const formatTime = (timestamp) => {
    return formatTimeOnly(timestamp);
  };

  return (
    <div className="state-flow">
      <h4 className="flow-title">📊 State Changes Before Error</h4>
      <div className="state-timeline">
        {flow.map((stateChange, index) => (
          <div key={index} className="state-item">
            <div className="state-header">
              <div className="state-component">{stateChange.component}</div>
              <div className="state-action">{stateChange.action}</div>
              <div className="state-time">{formatTime(stateChange.timestamp)}</div>
            </div>
            <div className="state-data">
              <pre>{JSON.stringify(stateChange.state, null, 2)}</pre>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .state-flow {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        }

        .flow-title {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .state-timeline {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .state-item {
          background: white;
          border-radius: 6px;
          padding: 12px;
          border-left: 3px solid #8b5cf6;
        }

        .state-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .state-component {
          font-weight: 700;
          color: #1f2937;
          font-size: 14px;
        }

        .state-action {
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          font-family: monospace;
        }

        .state-time {
          font-size: 12px;
          color: #6b7280;
          font-family: monospace;
          margin-left: auto;
        }

        .state-data {
          background: #f3f4f6;
          border-radius: 4px;
          padding: 8px;
        }

        .state-data pre {
          margin: 0;
          font-size: 12px;
          color: #374151;
          font-family: 'Courier New', monospace;
          overflow-x: auto;
        }

        .state-flow-empty {
          color: #6b7280;
          font-style: italic;
          padding: 16px;
        }
      `}</style>
    </div>
  );
}
