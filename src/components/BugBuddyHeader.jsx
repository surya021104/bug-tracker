import { useState, useMemo } from 'react';

export default function BugBuddyHeader({ issues, selectedFilter, onFilterChange }) {
    const [showFilters, setShowFilters] = useState(false);

    // Calculate test statistics
    const stats = useMemo(() => {
        const total = issues.length;
        const byType = {};

        issues.forEach(issue => {
            const type = issue.type || 'UNKNOWN';
            byType[type] = (byType[type] || 0) + 1;
        });

        const lastTestTime = issues.length > 0
            ? new Date(issues[0].createdAt)
            : null;

        return {
            total,
            byType,
            lastTestTime,
            types: Object.keys(byType).sort()
        };
    }, [issues]);

    const getRelativeTime = (date) => {
        if (!date) return 'Never';
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const bugTypes = [
        { key: 'all', label: 'All Types', icon: '🔍' },
        { key: 'CONSOLE_ERROR', label: 'Console', icon: '💬', color: '#f59e0b' },
        { key: 'NETWORK_ERROR', label: 'Network', icon: '🌐', color: '#ef4444' },
        { key: 'VALIDATION_BUG', label: 'Validation', icon: '✅', color: '#10b981' },
        { key: 'API_ERROR', label: 'API', icon: '⚡', color: '#3b82f6' },
        { key: 'UI_INTERACTION_FAILURE', label: 'UI', icon: '🖱️', color: '#8b5cf6' },
        { key: 'PROMISE_REJECTION', label: 'Promise', icon: '⚠️', color: '#f97316' },
    ];

    return (
        <div className="bugbuddy-header">
            {/* Hero Section */}
            <div className="bugbuddy-hero">
                <div className="hero-content">
                    <div className="hero-title-section">
                        <div className="hero-icon">🔬</div>
                        <div>
                            <h1 className="hero-title">BugBuddy</h1>
                            <p className="hero-subtitle">Automated Test Execution & Analysis</p>
                        </div>
                    </div>

                    {/* Test Statistics */}
                    <div className="test-stats-grid">
                        <div className="test-stat-card">
                            <div className="stat-icon">📊</div>
                            <div className="stat-content">
                                <div className="stat-number">{stats.total}</div>
                                <div className="stat-label">Test Failures</div>
                            </div>
                        </div>

                        <div className="test-stat-card">
                            <div className="stat-icon">🎯</div>
                            <div className="stat-content">
                                <div className="stat-number">{stats.types.length}</div>
                                <div className="stat-label">Failure Categories</div>
                            </div>
                        </div>

                        <div className="test-stat-card">
                            <div className="stat-icon">⏱️</div>
                            <div className="stat-content">
                                <div className="stat-number">{getRelativeTime(stats.lastTestTime)}</div>
                                <div className="stat-label">Last Execution</div>
                            </div>
                        </div>
                    </div>

                    {/* Type Breakdown */}
                    {stats.total > 0 && (
                        <div className="type-breakdown">
                            <div className="breakdown-title">Failure Distribution</div>
                            <div className="breakdown-chips">
                                {stats.types.map(type => {
                                    const bugType = bugTypes.find(t => t.key === type) || { label: type, icon: '🐛' };
                                    return (
                                        <div key={type} className="breakdown-chip">
                                            <span className="chip-icon">{bugType.icon}</span>
                                            <span className="chip-label">{bugType.label}</span>
                                            <span className="chip-count">{stats.byType[type]}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bugbuddy-filters">
                <button
                    className="filter-toggle"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M2 4.5H16M5 9H13M7.5 13.5H10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Filter by Type
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                        <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>

                {showFilters && (
                    <div className="filter-chips-container">
                        {bugTypes.map(type => (
                            <button
                                key={type.key}
                                className={`filter-chip ${selectedFilter === type.key ? 'active' : ''}`}
                                style={{ '--chip-color': type.color }}
                                onClick={() => onFilterChange(type.key)}
                            >
                                <span className="chip-icon">{type.icon}</span>
                                {type.label}
                                {type.key !== 'all' && stats.byType[type.key] && (
                                    <span className="chip-badge">{stats.byType[type.key]}</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
