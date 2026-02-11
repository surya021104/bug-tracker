// src/pages/TeamPage.jsx – Live Leaderboard
import React, { useMemo } from 'react';
import { Users, TrendingUp, Activity, Award, Trophy, Flame, Target, Zap, Bug } from 'lucide-react';
import useIssues from '../hooks/useIssues';

// Extract clean name from "EMP001 - John Smith" format
function extractName(raw) {
    if (!raw) return null;
    const parts = raw.split(' - ');
    return parts.length >= 2 ? parts.slice(1).join(' - ').trim() : raw.trim();
}
function extractEmpId(raw) {
    if (!raw) return null;
    return raw.split(' - ')[0].trim();
}
function getInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

function formatHours(ms) {
    if (!ms || ms <= 0) return '—';
    const hours = ms / (1000 * 60 * 60);
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = [
    'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    'linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%)',
    'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
];

export default function TeamPage() {
    const { issues } = useIssues();

    // Derive real team data from issues
    const teamData = useMemo(() => {
        const members = {};

        const ensureMember = (raw) => {
            if (!raw) return null;
            const empId = extractEmpId(raw);
            const name = extractName(raw);
            // Only allow real employees (EMP### format) — exclude System, AI, Auto-Monitor etc.
            if (!empId || !name || !empId.startsWith('EMP')) return null;

            if (!members[empId]) {
                members[empId] = {
                    empId,
                    name,
                    bugsCreated: 0,
                    bugsOpened: 0,
                    bugsFixed: 0,
                    totalResolutionMs: 0,
                    activeIssues: 0,
                    modules: new Set()
                };
            }
            return members[empId];
        };

        issues.forEach(issue => {
            // Track creators
            const creator = ensureMember(issue.createdBy);
            if (creator) {
                creator.bugsCreated++;
                if (issue.module) creator.modules.add(issue.module);
            }

            // Track openers
            const opener = ensureMember(issue.openedBy);
            if (opener) opener.bugsOpened++;

            // Track fixers
            const fixer = ensureMember(issue.fixedBy);
            if (fixer) {
                fixer.bugsFixed++;
                if (issue.fixedAt && issue.createdAt) {
                    const ms = new Date(issue.fixedAt) - new Date(issue.createdAt);
                    if (ms > 0) fixer.totalResolutionMs += ms;
                }
            }

            // Track active issues (assigned)
            if (issue.status === 'Open' || issue.status === 'In Progress') {
                const assignee = ensureMember(issue.assignee);
                if (assignee) assignee.activeIssues++;
            }
        });

        return Object.values(members).map(m => ({
            ...m,
            avgResolutionMs: m.bugsFixed > 0 ? m.totalResolutionMs / m.bugsFixed : 0,
            modules: Array.from(m.modules),
            totalContribution: m.bugsCreated + m.bugsOpened + m.bugsFixed
        }));
    }, [issues]);

    const topFixers = useMemo(() =>
        [...teamData].sort((a, b) => b.bugsFixed - a.bugsFixed).slice(0, 5),
        [teamData]
    );

    const fastestResolvers = useMemo(() =>
        [...teamData]
            .filter(m => m.bugsFixed > 0 && m.avgResolutionMs > 0)
            .sort((a, b) => a.avgResolutionMs - b.avgResolutionMs)
            .slice(0, 5),
        [teamData]
    );

    const mostActive = useMemo(() =>
        [...teamData].sort((a, b) => b.totalContribution - a.totalContribution).slice(0, 5),
        [teamData]
    );

    const totalFixed = teamData.reduce((s, m) => s + m.bugsFixed, 0);
    const totalCreated = teamData.reduce((s, m) => s + m.bugsCreated, 0);

    if (teamData.length === 0) {
        return (
            <div className="team-page">
                <div className="team-header">
                    <div>
                        <h1>🏆 Team Leaderboard</h1>
                        <p className="subtitle">Track team performance in real-time</p>
                    </div>
                </div>
                <div className="empty-state">
                    <Users size={64} color="#cbd5e1" />
                    <h3>No Team Data Yet</h3>
                    <p>Start creating, opening, and fixing bugs to see the leaderboard come alive!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="team-page">
            {/* Header */}
            <div className="team-header">
                <div>
                    <h1>🏆 Team Leaderboard</h1>
                    <p className="subtitle">Real-time performance tracking from issue activity</p>
                </div>
                <div className="team-stats-summary">
                    <div className="stat-pill">
                        <Users size={18} />
                        <span>{teamData.length} Members</span>
                    </div>
                    <div className="stat-pill">
                        <Bug size={18} />
                        <span>{totalCreated} Reported</span>
                    </div>
                    <div className="stat-pill" style={{ color: '#16a34a' }}>
                        <Award size={18} />
                        <span>{totalFixed} Fixed</span>
                    </div>
                </div>
            </div>

            {/* Top 3 Podium */}
            {topFixers.length >= 1 && (
                <div className="podium-section">
                    <div className="podium">
                        {topFixers.slice(0, 3).map((member, i) => (
                            <div key={member.empId} className={`podium-card podium-${i + 1}`}>
                                <div className="podium-medal">{RANK_MEDALS[i]}</div>
                                <div className="podium-avatar" style={{ background: RANK_COLORS[i] }}>
                                    {getInitials(member.name)}
                                </div>
                                <div className="podium-name">{member.name}</div>
                                <div className="podium-empid">{member.empId}</div>
                                <div className="podium-stat">
                                    <span className="podium-value">{member.bugsFixed}</span>
                                    <span className="podium-label">bugs fixed</span>
                                </div>
                                <div className="podium-avg">
                                    <Zap size={12} />
                                    {formatHours(member.avgResolutionMs)} avg
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Leaderboard Tables */}
            <div className="performance-grid">
                {/* Bug Fixers */}
                <div className="performance-card">
                    <h3><Trophy size={18} style={{ color: '#f59e0b' }} /> Top Bug Fixers</h3>
                    <div className="leaderboard">
                        {topFixers.map((member, i) => (
                            <div key={member.empId} className={`leaderboard-item ${i < 3 ? `rank-${i + 1}` : ''}`}>
                                <div className="rank" style={i < 3 ? { background: RANK_COLORS[i], color: 'white' } : {}}>
                                    {i < 3 ? RANK_MEDALS[i] : `#${i + 1}`}
                                </div>
                                <div className="avatar-small">{getInitials(member.name)}</div>
                                <div className="leader-info">
                                    <span className="leader-name">{member.name}</span>
                                    <span className="leader-stats">{member.bugsFixed} bugs fixed</span>
                                </div>
                                <div className="leader-bar-wrap">
                                    <div
                                        className="leader-bar"
                                        style={{
                                            width: `${topFixers[0]?.bugsFixed ? (member.bugsFixed / topFixers[0].bugsFixed) * 100 : 0}%`
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fastest Resolvers */}
                <div className="performance-card">
                    <h3><Zap size={18} style={{ color: '#8b5cf6' }} /> Fastest Resolvers</h3>
                    <div className="leaderboard">
                        {fastestResolvers.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                                No resolution data yet
                            </div>
                        ) : fastestResolvers.map((member, i) => (
                            <div key={member.empId} className={`leaderboard-item ${i < 3 ? `rank-${i + 1}` : ''}`}>
                                <div className="rank" style={i === 0 ? { background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white' } : {}}>
                                    {i === 0 ? '⚡' : `#${i + 1}`}
                                </div>
                                <div className="avatar-small">{getInitials(member.name)}</div>
                                <div className="leader-info">
                                    <span className="leader-name">{member.name}</span>
                                    <span className="leader-stats">{formatHours(member.avgResolutionMs)} avg · {member.bugsFixed} fixed</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Most Active Contributors */}
                <div className="performance-card">
                    <h3><Flame size={18} style={{ color: '#ef4444' }} /> Most Active</h3>
                    <div className="leaderboard">
                        {mostActive.map((member, i) => (
                            <div key={member.empId} className={`leaderboard-item ${i < 3 ? `rank-${i + 1}` : ''}`}>
                                <div className="rank" style={i === 0 ? { background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' } : {}}>
                                    {i === 0 ? '🔥' : `#${i + 1}`}
                                </div>
                                <div className="avatar-small">{getInitials(member.name)}</div>
                                <div className="leader-info">
                                    <span className="leader-name">{member.name}</span>
                                    <span className="leader-stats">
                                        {member.bugsCreated} created · {member.bugsOpened} opened · {member.bugsFixed} fixed
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Full Team Table */}
            <div className="team-table-section">
                <h2>📋 Full Team Breakdown</h2>
                <div className="team-table-wrap">
                    <table className="team-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Member</th>
                                <th>ID</th>
                                <th>Created</th>
                                <th>Opened</th>
                                <th>Fixed</th>
                                <th>Avg Time</th>
                                <th>Modules</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...teamData]
                                .sort((a, b) => b.bugsFixed - a.bugsFixed)
                                .map((member, i) => (
                                    <tr key={member.empId}>
                                        <td>
                                            <span className="table-rank">{i < 3 ? RANK_MEDALS[i] : i + 1}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className="avatar-small">{getInitials(member.name)}</div>
                                                <span style={{ fontWeight: 600 }}>{member.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{member.empId}</td>
                                        <td><span className="stat-chip created">{member.bugsCreated}</span></td>
                                        <td><span className="stat-chip opened">{member.bugsOpened}</span></td>
                                        <td><span className="stat-chip fixed">{member.bugsFixed}</span></td>
                                        <td style={{ fontWeight: 500 }}>{formatHours(member.avgResolutionMs)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {member.modules.slice(0, 3).map(m => (
                                                    <span key={m} className="module-chip">{m}</span>
                                                ))}
                                                {member.modules.length > 3 && (
                                                    <span className="module-chip" style={{ opacity: 0.6 }}>+{member.modules.length - 3}</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
