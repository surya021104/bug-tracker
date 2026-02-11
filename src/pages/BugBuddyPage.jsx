import { useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import IssueList from '../modules/issues/IssueList';
import { Search, Filter, Download, TrendingUp, Plus } from 'lucide-react';
import '../styles/bugbuddy.css';

export default function BugBuddyPage({ currentUser }) {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIssues, setSelectedIssues] = useState([]);

    // Fetch only BugBuddy (automated test) bugs
    useEffect(() => {
        fetchBugBuddyBugs();

        // Setup WebSocket for real-time updates
        const socket = io('http://localhost:4000', { transports: ['websocket'] });

        socket.on('newBug', (newBug) => {
            if (newBug.createdBy === 'BugBuddy') {
                setIssues(prev => [newBug, ...prev]);
            }
        });

        socket.on('issueDeleted', (deletedId) => {
            setIssues(prev => prev.filter(issue => issue.id !== deletedId));
            setSelectedIssues(prev => prev.filter(id => id !== deletedId));
        });

        return () => socket.disconnect();
    }, []);

    const fetchBugBuddyBugs = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/issues');
            const allIssues = await response.json();

            // Filter for BugBuddy bugs only
            const bugBuddyBugs = allIssues.filter(
                issue => issue.createdBy === 'BugBuddy'
            );

            setIssues(bugBuddyBugs);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch BugBuddy bugs:', error);
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const response = await fetch(`http://localhost:4000/api/issues/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, currentUser })
            });

            if (response.ok) {
                const updated = await response.json();
                setIssues(prev =>
                    prev.map(issue => issue.id === id ? updated.issue : issue)
                );
            }
        } catch (error) {
            console.error('Status update failed:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`http://localhost:4000/api/issues/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setIssues(prev => prev.filter(issue => issue.id !== id));
                console.log(`✅ Deleted BugBuddy issue: ${id}`);
            } else {
                console.error('Failed to delete issue');
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleSelectIssue = (id) => {
        setSelectedIssues(prev =>
            prev.includes(id)
                ? prev.filter(selectedId => selectedId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIssues.length === filteredIssues.length) {
            setSelectedIssues([]);
        } else {
            setSelectedIssues(filteredIssues.map(issue => issue.id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIssues.length === 0) return;

        if (!window.confirm(`Delete ${selectedIssues.length} selected issue(s)?`)) {
            return;
        }

        try {
            // Delete all selected issues
            await Promise.all(selectedIssues.map(id =>
                fetch(`http://localhost:4000/api/issues/${id}`, { method: 'DELETE' })
            ));

            // Optimistic UI update
            setIssues(prev => prev.filter(issue => !selectedIssues.includes(issue.id)));
            setSelectedIssues([]);
            console.log(`✅ Bulk deleted ${selectedIssues.length} issues`);
        } catch (error) {
            console.error('Bulk delete failed:', error);
        }
    };

    // Calculate stats
    const stats = useMemo(() => {
        const total = issues.length;
        const todo = issues.filter(i => i.status === 'To Do' || i.status === 'Todo').length;
        const open = issues.filter(i => i.status === 'Open').length;
        const inProgress = issues.filter(i => i.status === 'In Progress').length;
        const fixed = issues.filter(i => i.status === 'Fixed').length;
        const closed = issues.filter(i => ['Closed', 'Resolved'].includes(i.status)).length;

        return { total, todo, open, inProgress, fixed, closed };
    }, [issues]);

    // Filter issues by search
    const filteredIssues = useMemo(() => {
        let filtered = issues;

        if (searchQuery) {
            filtered = filtered.filter(issue =>
                issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                issue.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    }, [issues, searchQuery]);

    if (loading) {
        return <div className="loading-container">Loading BugBuddy results... 🔬</div>;
    }

    return (
        <div className="issue-tracker-container">
            {/* Header with gradient background */}
            <div className="issue-tracker-header">
                <div className="header-content-wrapper">
                    <div className="header-title-section">
                        <h1>BugBuddy</h1>
                        <p>Automated test execution and analysis</p>
                    </div>

                    {/* Stats Cards - Horizontal Layout */}
                    <div className="stats-row">
                        <div className="stat-box primary">
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-name">ALL ISSUES</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-value">{stats.todo}</div>
                            <div className="stat-name">TODO</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-value">{stats.open}</div>
                            <div className="stat-name">OPEN</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-value">{stats.inProgress}</div>
                            <div className="stat-name">IN PROGRESS</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-value">{stats.fixed}</div>
                            <div className="stat-name">FIXED</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-value">{stats.closed}</div>
                            <div className="stat-name">CLOSED</div>
                        </div>
                    </div>

                    {/* New Issue Button - Centered below stats */}
                    <div className="new-issue-btn-container">
                        <button className="btn-new-issue">
                            <Plus size={16} />
                            New Issue
                        </button>
                    </div>
                </div>
            </div>

            {/* Search and Action Bar - White background */}
            <div className="search-action-bar">
                <div className="search-input-wrapper">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search issues, modules, reporters..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="action-buttons">
                    <button className="btn-action">
                        <Filter size={16} />
                        Filter
                    </button>
                    <button className="btn-action">
                        <TrendingUp size={16} />
                        Sort
                    </button>
                    <button className="btn-action">
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {/* Floating Action Bar */}
            {selectedIssues.length > 0 && (
                <div className="floating-action-bar">
                    <div className="action-bar-content">
                        <div className="action-bar-left">
                            <div className="selected-count">
                                <span className="count">{selectedIssues.length}</span>
                                <span className="label">selected</span>
                            </div>
                            <button onClick={() => setSelectedIssues([])} className="btn-clear">
                                <span style={{ marginRight: '6px' }}>✕</span>
                                Clear Selection
                            </button>
                        </div>
                        <div className="action-bar-right">
                            <button onClick={handleSelectAll} className="btn-select-all">
                                {selectedIssues.length === filteredIssues.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <button onClick={handleBulkDelete} className="btn-delete-bulk">
                                <span style={{ marginRight: '6px' }}>🗑️</span>
                                Delete {selectedIssues.length} {selectedIssues.length === 1 ? 'Issue' : 'Issues'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Issue List */}
            <div className="issue-list-container">
                <IssueList
                    issues={filteredIssues}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    selectedIssues={selectedIssues}
                    onSelectIssue={handleSelectIssue}
                    onSelectAll={handleSelectAll}
                    isAllSelected={selectedIssues.length > 0 && selectedIssues.length === filteredIssues.length}
                    emptyMessage="No test failures found! 🎉 All tests passing!"
                />
            </div>
        </div>
    );
}
