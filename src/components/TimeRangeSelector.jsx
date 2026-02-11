// src/components/TimeRangeSelector.jsx
import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';

export default function TimeRangeSelector({ selected, onChange, showComparison = false }) {
    const ranges = [
        { value: 'today', label: 'Today', icon: '📅' },
        { value: '7d', label: 'Last 7 Days', icon: '📊' },
        { value: '30d', label: 'Last 30 Days', icon: '📈' },
        { value: '90d', label: 'Last 90 Days', icon: '📆' },
        { value: 'all', label: 'All Time', icon: '⏳' }
    ];

    return (
        <div className="time-range-selector">
            <div className="range-buttons">
                {ranges.map(range => (
                    <button
                        key={range.value}
                        className={`range-btn ${selected === range.value ? 'active' : ''}`}
                        onClick={() => onChange(range.value)}
                    >
                        <span className="range-icon">{range.icon}</span>
                        <span className="range-label">{range.label}</span>
                    </button>
                ))}
            </div>
            {showComparison && selected !== 'all' && (
                <div className="comparison-indicator">
                    <TrendingUp size={16} />
                    <span>Comparing to previous period</span>
                </div>
            )}
        </div>
    );
}
