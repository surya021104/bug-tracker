// src/components/ReportCharts.jsx
import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell,
    BarChart as ReBarChart, Bar, Legend,
    LineChart, Line
} from 'recharts';
import { formatChartDate } from '../utils/dateUtils';

/**
 * Metric Card with Trend
 */
export function MetricCard({ title, value, trend, icon, color = '#3b82f6' }) {
    const trendUp = trend && trend > 0;
    const trendDown = trend && trend < 0;

    return (
        <div className="metric-card" style={{ borderLeftColor: color }}>
            <div className="metric-header">
                <span className="metric-icon" style={{ color }}>{icon}</span>
                <span className="metric-title">{title}</span>
            </div>
            <div className="metric-value">{value}</div>
            {trend !== undefined && (
                <div className={`metric-trend ${trendUp ? 'up' : trendDown ? 'down' : 'neutral'}`}>
                    {trendUp && '↑'} {trendDown && '↓'} {Math.abs(trend)}%
                    <span className="trend-label">vs prev period</span>
                </div>
            )}
        </div>
    );
}

/**
 * Enhanced Area Chart for Velocity
 */
export function AreaChartComponent({ data, dataKeys, colors, height = 300 }) {
    if (!data || data.length === 0) return <div className="chart-empty">No data available</div>;

    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer>
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        {colors.map((color, index) => (
                            <linearGradient key={index} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickFormatter={(str) => {
                            return formatChartDate(str);
                        }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                    />
                    <Legend />
                    {dataKeys.map((key, index) => (
                        <Area
                            key={key.key}
                            type="monotone"
                            dataKey={key.key}
                            name={key.name}
                            stroke={colors[index]}
                            fillOpacity={1}
                            fill={`url(#color${index})`}
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

/**
 * Enhanced Pie Chart (Donut)
 */
export function PieChart({ data, size = 300 }) {
    if (!data || Object.keys(data).length === 0) return <div className="chart-empty">No data available</div>;

    const COLORS = {
        Critical: '#ef4444',
        High: '#f59e0b',
        Medium: '#3b82f6',
        Low: '#10b981',
        Open: '#3b82f6',
        "In Progress": '#8b5cf6',
        Resolved: '#10b981',
        Closed: '#6b7280'
    };

    const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));
    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div style={{ width: '100%', height: size, position: 'relative' }}>
            <ResponsiveContainer>
                <RePieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value) => [`${value} issues`, 'Count']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </RePieChart>
            </ResponsiveContainer>
            <div className="donut-center-text" style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -65%)',
                textAlign: 'center',
                pointerEvents: 'none'
            }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>{total}</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total</div>
            </div>
        </div>
    );
}

/**
 * Simple Bar Chart
 */
export function BarChart({ data, labelKey, valueKey, color = '#3b82f6', height = 250 }) {
    if (!data || data.length === 0) return <div className="chart-empty">No data available</div>;

    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer>
                <ReBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey={labelKey}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 11 }}
                        interval={0}
                    />
                    <YAxis hide />
                    <Tooltip
                        cursor={{ fill: '#f3f4f6' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar
                        dataKey={valueKey}
                        fill={color}
                        radius={[4, 4, 0, 0]}
                        barSize={30}
                    />
                </ReBarChart>
            </ResponsiveContainer>
        </div>
    );
}

/**
 * Progress Ring (Re-implemented with SVG for simplicity as Recharts doesn't have a direct circular progress)
 */
export function ProgressRing({ value, max = 100, size = 60, color = '#3b82f6' }) {
    const radius = size * 0.4;
    const stroke = 6;
    const normalizedRadius = radius - stroke * 0.5;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (value / max) * circumference;

    return (
        <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg height={size} width={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle
                    stroke="#e5e7eb"
                    strokeWidth={stroke}
                    fill="transparent"
                    r={normalizedRadius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <span style={{
                position: 'absolute',
                fontSize: size * 0.25,
                fontWeight: 'bold',
                color: '#374151'
            }}>
                {value}
            </span>
        </div>
    );
}

// Export Sparkline as simple LineChart for compatibility
export function Sparkline({ data, width = 100, height = 40, color = '#3b82f6' }) {
    if (!data || data.length === 0) return null;

    // Format data for Recharts
    const chartData = data.map((val, i) => ({ i, val }));

    return (
        <div style={{ width, height }}>
            <ResponsiveContainer>
                <LineChart data={chartData}>
                    <Line type="monotone" dataKey="val" stroke={color} strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
