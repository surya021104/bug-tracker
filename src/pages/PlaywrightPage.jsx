import { useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import IssueList from '../modules/issues/IssueList';
import PlaywrightHeader from '../components/PlaywrightHeader';
import '../styles/playwright.css';

export default function PlaywrightPage({ currentUser }) {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState('all');

    // Fetch only Playwright bugs
    useEffect(() => {
        fetchPlaywrightBugs();

        // Setup WebSocket for real-time updates
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000', { transports: ['websocket'] });

        socket.on('newBug', (newBug) => {
            if (newBug.createdBy === 'Playwright') {
                setIssues(prev => [newBug, ...prev]);
            }
        });

        return () => socket.disconnect();
    }, []);

    const fetchPlaywrightBugs = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/issues`);
            const allIssues = await response.json();

            // Filter for Playwright bugs only
            const playwrightBugs = allIssues.filter(
                issue => issue.createdBy === 'Playwright'
            );

            setIssues(playwrightBugs);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch Playwright bugs:', error);
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/issues/${id}/status`, {
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

    // Filter issues by type
    const filteredIssues = useMemo(() => {
        if (selectedFilter === 'all') return issues;
        return issues.filter(issue => issue.type === selectedFilter);
    }, [issues, selectedFilter]);

    if (loading) {
        return <div className="loading-container">Loading Playwright bugs...</div>;
    }

    return (
        <div className="issue-page">
            <PlaywrightHeader
                issues={issues}
                selectedFilter={selectedFilter}
                onFilterChange={setSelectedFilter}
            />
            <IssueList
                issues={filteredIssues}
                onStatusChange={handleStatusChange}
                emptyMessage="No Playwright bugs found! 🎉"
            />
        </div>
    );
}
