// src/pages/ReportsPage.jsx
import React, { useState, useEffect } from 'react';
import {
    Download, Activity, TrendingUp, Layers, AlertCircle,
    Zap, ShieldCheck, Clock, Target, Filter, Users
} from 'lucide-react';
import useIssues from '../hooks/useIssues';
import { formatTimeOnly } from '../utils/dateUtils';
import TimeRangeSelector from '../components/TimeRangeSelector';
import {
    ProgressRing, BarChart,
    PieChart, MetricCard, AreaChartComponent
} from '../components/ReportCharts';
import '../styles/reports.css';

import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL || "http://localhost:4000");

// Live Activity Feed Component
const LiveActivityFeed = () => {
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        const addActivity = (type, data) => {
            const now = new Date();
            const time = formatTimeOnly(now.toISOString());

            let message = '';
            let icon = '';
            let color = '';

            if (type === 'new') {
                message = `New Issue: ${data.title}`;
                icon = '🚨';
                color = 'text-red-600';
            } else if (type === 'update') {
                message = `Updated: ${data.title} (${data.status})`;
                icon = '🔄';
                color = 'text-blue-600';
            } else if (type === 'delete') {
                message = `Issue Deleted: ${data.id}`;
                icon = '🗑️';
                color = 'text-gray-500';
            }

            setActivities(prev => [{ id: Date.now(), time, message, icon, color }, ...prev].slice(0, 5));
        };

        socket.on("new-bug", (bug) => addActivity('new', bug));
        socket.on("bug-updated", (bug) => addActivity('update', bug));
        socket.on("issue-deleted", (id) => addActivity('delete', { id }));

        return () => {
            socket.off("new-bug");
            socket.off("bug-updated");
            socket.off("issue-deleted");
        };
    }, []);

    if (activities.length === 0) return null;

    return (
        <div className="report-card full-width" style={{ marginBottom: 32, animation: 'fadeIn 0.5s' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={18} className="text-primary" />
                Live System Activity
                <span className="live-indicator">
                    <span className="blink">●</span> Live
                </span>
            </h3>
            <div className="activity-list">
                {activities.map(act => (
                    <div key={act.id} className="activity-item" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 60 }}>{act.time}</span>
                        <span style={{ fontSize: 16 }}>{act.icon}</span>
                        <span className={act.color} style={{ fontSize: 14, fontWeight: 500 }}>{act.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Animated Number Component for smooth transitions
const AnimatedNumber = ({ value, duration = 1000 }) => {
    const [count, setCount] = useState(0);
    const [prevValue, setPrevValue] = useState(0);

    useEffect(() => {
        // Parse value if it contains non-numeric characters (like 'h' or '%')
        const numericValue = parseInt(String(value).replace(/[^0-9.-]/g, '')) || 0;

        // If value hasn't changed meaningfully, don't animate from 0
        if (prevValue === numericValue) return;

        const end = numericValue;
        const totalFrames = Math.min(end, duration / 16) || 1; // limit frames for performance
        const increment = end / totalFrames;

        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, 16);

        setPrevValue(numericValue);
        return () => clearInterval(timer);
    }, [value, duration]);

    // Format display
    const isPercentage = typeof value === 'string' && value.includes('%');
    const isTime = typeof value === 'string' && value.includes('h');

    return (
        <span>
            {Math.floor(count)}
            {isPercentage ? '%' : ''}
            {isTime ? 'h' : ''}
        </span>
    );
};

export default function ReportsPage() {
    const { issues } = useIssues();
    const [timeRange, setTimeRange] = useState('30d');
    const [appFilter, setAppFilter] = useState('all');
    const [availableApps, setAvailableApps] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch available apps for filter dropdown
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/reports/apps`)
            .then(r => r.json())
            .then(apps => setAvailableApps(apps))
            .catch(() => setAvailableApps([]));
    }, []);

    // Fetch analytics from backend (re-fetch when timeRange, appFilter, or issues change)
    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({ timeRange });
                if (appFilter && appFilter !== 'all') params.append('appName', appFilter);
                const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/reports/analytics?${params}`);

                if (!response.ok) {
                    throw new Error(`Analytics API failed: ${response.status}`);
                }

                const data = await response.json();

                if (!data || !data.summary) {
                    throw new Error('Invalid data format received from analytics API');
                }

                setAnalytics(data);
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [timeRange, appFilter, issues]);

    const handleExport = async (format) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/reports/export?format=${format}&timeRange=${timeRange}`);
            if (format === 'csv' || format === 'excel' || format === 'xlsx' || format === 'xml') {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                if (format === 'csv') {
                    a.download = `bug-report-${timeRange}.csv`;
                } else if (format === 'xml') {
                    a.download = `bug-report-${timeRange}.xml`;
                } else {
                    a.download = `bug-report-${timeRange}.xlsx`;
                }
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                const data = await response.json();
                console.log('Export data:', data);
            }
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    if (loading && !analytics) {
        return (
            <div className="reports-page">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading analytics data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="reports-page">
                <div className="error-state" style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
                    <AlertCircle size={48} style={{ marginBottom: '16px' }} />
                    <h2>Analytics Unavailable</h2>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '16px', padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!analytics) return null;

    const {
        summary, mttr, velocity, severityDistribution, statusDistribution,
        typeDistribution, firstResponseTime, reopenRate, bugAging,
        sourceDistribution, environmentDistribution, topRecurringIssues,
        topImpactingIssues
    } = analytics;

    const rangeLabel = { today: 'Today', '7d': 'Last 7 Days', '30d': 'Last 30 Days', '90d': 'Last 90 Days', all: 'All Time' }[timeRange] || 'All Time';

    return (
        <div className="reports-page">
            <div className="reports-header">
                <div>
                    <h1> Executive Analytics Dashboard</h1>
                    <p className="subtitle">Comprehensive bug tracking metrics and performance insights</p>
                </div>
                <div className="header-actions">
                    {/* Application Filter */}
                    {availableApps.length > 1 && (
                        <div className="app-filter-wrapper">
                            <Filter size={14} />
                            <select
                                className="app-filter-select"
                                value={appFilter}
                                onChange={(e) => setAppFilter(e.target.value)}
                            >
                                <option value="all">All Applications</option>
                                {availableApps.map(app => (
                                    <option key={app} value={app}>{app}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <button className="btn-export-white" onClick={() => handleExport('csv')}>
                        <Download size={16} />
                        Export CSV
                    </button>
                    <button className="btn-export-excel" onClick={() => handleExport('excel')}>
                        <Download size={16} />
                        Export Excel
                    </button>
                    <button className="btn-export-xml" onClick={() => handleExport('xml')}>
                        <Download size={16} />
                        Export XML
                    </button>
                </div>
            </div>

            {/* Time Range Selector */}
            <TimeRangeSelector selected={timeRange} onChange={setTimeRange} showComparison={true} />

            {/* Live Activity Feed */}
            <LiveActivityFeed />

            {/* Executive Summary KPIs */}
            <section className="section-executive-summary">
                <h2 className="section-title">
                    <Target size={24} />
                    Executive Summary - <span style={{ color: '#6366f1' }}>{rangeLabel}</span>
                    {appFilter !== 'all' && <span style={{ color: '#f59e0b', fontSize: '0.7em', marginLeft: 8 }}>({appFilter})</span>}
                </h2>
                <div className="kpi-grid">
                    <MetricCard
                        title="Total Issues"
                        value={<AnimatedNumber value={summary.total} />}
                        icon={<Layers size={20} />}
                        color="#3b82f6"
                    />
                    <MetricCard
                        title="Active Issues"
                        value={<AnimatedNumber value={summary.active} />}
                        trend={-8}
                        icon={<Activity size={20} />}
                        color="#f59e0b"
                    />
                    <MetricCard
                        title="Resolved"
                        value={<AnimatedNumber value={summary.resolved} />}
                        trend={12}
                        icon={<ShieldCheck size={20} />}
                        color="#10b981"
                    />
                    <MetricCard
                        title="Critical Blockers"
                        value={<AnimatedNumber value={summary.critical} />}
                        icon={<AlertCircle size={20} />}
                        color="#ef4444"
                    />
                    <MetricCard
                        title="Resolution Rate"
                        value={<AnimatedNumber value={`${summary.resolutionRate}%`} />}
                        trend={5}
                        icon={<TrendingUp size={20} />}
                        color="#8b5cf6"
                    />
                    <MetricCard
                        title="MTTR"
                        value={<AnimatedNumber value={`${mttr.average}h`} />}
                        trend={-3}
                        icon={<Clock size={20} />}
                        color="#06b6d4"
                    />
                </div>
            </section>

            {/* Bug Velocity Area Chart */}
            <section className="section-velocity">
                <h2 className="section-title">
                    <TrendingUp size={24} />
                    Bug Reporting & Resolution Velocity
                </h2>
                <div className="chart-card-full">
                    <AreaChartComponent
                        data={velocity}
                        dataKeys={[
                            { key: 'opened', name: 'New Bugs' },
                            { key: 'closed', name: 'Resolved' }
                        ]}
                        colors={['#ef4444', '#10b981']}
                        height={350}
                    />
                </div>
            </section>

            {/* Distribution Reports Section */}
            <section className="section-time-reports">
                <h2 className="section-title">
                    <Activity size={24} />
                    {timeRange === 'today' && 'Today\'s Activity Report'}
                    {timeRange === '7d' && 'Weekly Performance Report'}
                    {timeRange === '30d' && 'Monthly Analytics Report'}
                    {timeRange === '90d' && 'Quarterly Analytics Report'}
                    {timeRange === 'all' && 'All-Time Distribution Analytics'}
                </h2>

                <div className="time-report-grid">
                    <div className="report-card">
                        <h3> Status Distribution</h3>
                        <PieChart data={statusDistribution} size={300} />
                    </div>

                    <div className="report-card">
                        <h3>Severity Breakdown</h3>
                        <PieChart data={severityDistribution} size={300} />
                    </div>

                    {typeDistribution && Object.keys(typeDistribution).length > 0 && (
                        <div className="report-card full-width">
                            <h3> Issue Categories</h3>
                            <BarChart
                                data={Object.entries(typeDistribution).map(([label, value]) => ({ label, value }))}
                                labelKey="label"
                                valueKey="value"
                                color="#8b5cf6"
                                height={250}
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* Advanced Metrics Section */}
            <section className="section-advanced-metrics">
                <h2 className="section-title">
                    <Zap size={24} />
                    Advanced Metrics & SLAs
                </h2>
                <div className="metrics-grid">
                    <div className="metric-detail-card">
                        <div className="metric-detail-header">
                            <Clock size={20} />
                            <h3>Mean Time To Resolution (MTTR)</h3>
                        </div>
                        <div className="metric-stats">
                            <div className="stat-item">
                                <span className="stat-label">Average</span>
                                <span className="stat-value"><AnimatedNumber value={`${mttr.average}h`} /></span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Median (p50)</span>
                                <span className="stat-value"><AnimatedNumber value={`${mttr.median}h`} /></span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">75th Percentile</span>
                                <span className="stat-value"><AnimatedNumber value={`${mttr.p75}h`} /></span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">90th Percentile</span>
                                <span className="stat-value"><AnimatedNumber value={`${mttr.p90}h`} /></span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Resolved Count</span>
                                <span className="stat-value"><AnimatedNumber value={mttr.count} /></span>
                            </div>
                        </div>
                    </div>

                    <div className="metric-detail-card">
                        <div className="metric-detail-header">
                            <ShieldCheck size={20} />
                            <h3>Quality Metrics</h3>
                        </div>
                        <div className="metric-stats">
                            <div className="stat-item">
                                <span className="stat-label">Reopen Rate</span>
                                <span className="stat-value"><AnimatedNumber value={`${reopenRate.rate}%`} /></span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Reopened Issues</span>
                                <span className="stat-value"><AnimatedNumber value={reopenRate.reopened} /></span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">First Response Time</span>
                                <span className="stat-value"><AnimatedNumber value={`${firstResponseTime.average}h`} /></span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Response Median</span>
                                <span className="stat-value"><AnimatedNumber value={`${firstResponseTime.median}h`} /></span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bug Aging Section */}
            {bugAging && (
                <section className="section-bug-aging">
                    <h2 className="section-title">
                        <Clock size={24} />
                        Open Bug Aging
                    </h2>
                    <p className="section-description">
                        This shows how long currently open bugs have been waiting for a resolution. Use this to identify "stale" bugs that need attention.
                    </p>
                    <div className="aging-grid">
                        {[
                            { label: '< 1 Day', value: bugAging.today, color: '#10b981', bg: '#ecfdf5' },
                            { label: '1–3 Days', value: bugAging.days1to3, color: '#3b82f6', bg: '#eff6ff' },
                            { label: '3–7 Days', value: bugAging.days3to7, color: '#f59e0b', bg: '#fffbeb' },
                            { label: '1–2 Weeks', value: bugAging.weeks1to2, color: '#f97316', bg: '#fff7ed' },
                            { label: '2+ Weeks', value: bugAging.weeks2plus, color: '#ef4444', bg: '#fef2f2' }
                        ].map(bucket => (
                            <div key={bucket.label} className="aging-card" style={{ borderLeftColor: bucket.color, background: bucket.bg }}>
                                <div className="aging-value" style={{ color: bucket.color }}>
                                    <AnimatedNumber value={bucket.value} />
                                </div>
                                <div className="aging-label">{bucket.label}</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Environment Distribution */}
            {environmentDistribution && Object.keys(environmentDistribution).length > 0 && (
                <section className="section-env-dist">
                    <h2 className="section-title">
                        <Layers size={24} />
                        Environment Breakdown
                    </h2>
                    <p className="section-description">
                        Distribution of issues across different environments (Production, Staging, etc.).
                    </p>
                    <div className="report-card full-width">
                        <div className="env-chart-container" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <BarChart
                                data={Object.entries(environmentDistribution).map(([label, value]) => ({ label, value }))}
                                labelKey="label"
                                valueKey="value"
                                color="#06b6d4"
                                height={250}
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* Source Distribution */}
            {sourceDistribution && (
                <section className="section-source-dist">
                    <h2 className="section-title">
                        <Zap size={24} />
                        Detection Source & Automation
                    </h2>
                    <p className="section-description">
                        Comparison between bugs auto-detected by our monitoring system vs bugs reported manually by users.
                    </p>
                    <div className="time-report-grid">
                        <div className="report-card">
                            <h3>Auto-Detected vs Manual</h3>
                            <PieChart data={sourceDistribution} size={280} />
                        </div>
                        <div className="report-card">
                            <h3>Analytics Summary</h3>
                            <div className="source-stats-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '20px',
                                width: '100%',
                                padding: '10px'
                            }}>
                                <div className="stat-box" style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Automated</div>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#3b82f6' }}>{sourceDistribution.Automated || 0}</div>
                                </div>
                                <div className="stat-box" style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Manual</div>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b' }}>{sourceDistribution.Manual || 0}</div>
                                </div>
                                <div className="stat-box" style={{ gridColumn: 'span 2', background: '#eff6ff', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Automation Efficiency</div>
                                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#1d4ed8' }}>
                                        {summary.total > 0
                                            ? Math.round(((sourceDistribution.Automated || 0) / summary.total) * 100)
                                            : 0}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Top Recurring Issues */}
            {topRecurringIssues && topRecurringIssues.length > 0 && (
                <section className="section-recurring">
                    <h2 className="section-title">
                        <AlertCircle size={24} />
                        Most Frequent Issues
                    </h2>
                    <p className="section-description">
                        Bugs that occur most often, regardless of total count. These are candidates for permanent architectural fixes.
                    </p>
                    <div className="report-card full-width" style={{ padding: 0, overflow: 'hidden' }}>
                        <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '15px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Issue Title</th>
                                    <th style={{ padding: '15px 20px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Occurrences</th>
                                    <th style={{ padding: '15px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Application</th>
                                    <th style={{ padding: '15px 20px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Severity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topRecurringIssues.slice(0, 5).map((issue, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '15px 20px', fontWeight: 600, color: '#1e293b' }}>{issue.title}</td>
                                        <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 12px',
                                                background: '#fee2e2',
                                                color: '#b91c1c',
                                                borderRadius: '20px',
                                                fontSize: '13px',
                                                fontWeight: 800
                                            }}>
                                                {issue.occurrences}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px 20px', fontSize: '14px', color: '#64748b' }}>{issue.appName}</td>
                                        <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                                            <span style={{
                                                color: issue.severity === 'Critical' ? '#ef4444' : issue.severity === 'High' ? '#f97316' : '#3b82f6',
                                                fontWeight: 700,
                                                fontSize: '13px'
                                            }}>
                                                {issue.severity}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Top Impacting Issues */}
            {topImpactingIssues && topImpactingIssues.length > 0 && (
                <section className="section-impacting">
                    <h2 className="section-title">
                        <Users size={24} />
                        Top User-Impacting Issues
                    </h2>
                    <p className="section-description">
                        Bugs that affect the highest number of unique users or sessions. Fixing these will have the biggest impact on customer satisfaction.
                    </p>
                    <div className="report-card full-width" style={{ padding: 0, overflow: 'hidden' }}>
                        <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '15px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Issue Title</th>
                                    <th style={{ padding: '15px 20px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Affected Users</th>
                                    <th style={{ padding: '15px 20px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Affected Sessions</th>
                                    <th style={{ padding: '15px 20px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Severity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topImpactingIssues.slice(0, 5).map((issue, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '15px 20px', fontWeight: 600, color: '#1e293b' }}>{issue.title}</td>
                                        <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 12px',
                                                background: '#dcfce7',
                                                color: '#166534',
                                                borderRadius: '20px',
                                                fontSize: '13px',
                                                fontWeight: 800
                                            }}>
                                                <Users size={14} /> {issue.affectedUsers}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px 20px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                                            {issue.affectedSessions}
                                        </td>
                                        <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                                            <span style={{
                                                color: issue.severity === 'Critical' ? '#ef4444' : issue.severity === 'High' ? '#f97316' : '#3b82f6',
                                                fontWeight: 700,
                                                fontSize: '13px'
                                            }}>
                                                {issue.severity}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}
