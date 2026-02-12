import { useEffect, useState } from "react";

import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL || "http://localhost:4000");

export default function useIssues() {
  const [issues, setIssues] = useState([]);

  // 🔁 FETCH + DEDUPE (FALLBACK)
  const loadIssues = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/issues`);
      if (!res.ok) throw new Error("API failed");

      const backendIssues = await res.json();

      const normalized = backendIssues.map(bug => ({
        ...bug,
        isAuto: true,
        // BUG FIX #7: Improved ID generation to prevent collisions
        id: bug.id || `AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      }));

      setIssues(prev => {
        const map = new Map();

        // keep manual issues
        prev.filter(i => !i.isAuto).forEach(i => {
          map.set(i.id, i);
        });

        // backend overwrites
        normalized.forEach(i => map.set(i.id, i));

        return Array.from(map.values());
      });
    } catch (err) {
      console.error("Fetch failed:", err);
    }
  };

  // 🔥 INITIAL LOAD + SOCKET + POLLING FALLBACK
  useEffect(() => {

    // 2️⃣ initial backend sync
    loadIssues();

    // 3️⃣ LIVE MONITORING - Only add NEW bugs, don't overwrite existing
    socket.on("new-bug", bug => {
      setIssues(prev => {
        // Check if bug already exists
        const exists = prev.some(i => i.id === bug.id);

        // If it exists, DON'T overwrite (preserve local status changes)
        if (exists) {
          console.log('⏭️ Ignoring duplicate bug:', bug.id);
          return prev;
        }

        // Only add if it's truly new
        console.log('✅ Adding new bug:', bug.id);
        return [{ ...bug, isAuto: true }, ...prev];
      });
    });

    // 4️⃣ LISTEN FOR BUG UPDATES (duplicate occurrences)
    socket.on("bug-updated", updatedBug => {
      setIssues(prev => prev.map(bug =>
        bug.id === updatedBug.id ? { ...bug, ...updatedBug } : bug
      ));
      console.log('🔄 Bug updated:', updatedBug.id, `(${updatedBug.occurrences} occurrences)`);
    });

    // 5️⃣ LISTEN FOR DELETIONS
    socket.on("issue-deleted", ({ id }) => {
      setIssues(prev => prev.filter(bug => bug.id !== id));
      console.log('🗑️ Bug deleted:', id);
    });



    return () => {
      socket.off("new-bug");
      socket.off("bug-updated");
      socket.off("issue-deleted");

    };
  }, []);

  // AI REPORT GENERATION - Calls AI to generate full bug report from title
  const generateAIReport = async (title) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/bugs/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plainTextDescription: title })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate report");
      }

      const { report } = await res.json();
      return report;
    } catch (err) {
      console.error('AI report generation failed:', err);
      throw err;
    }
  };

  // MANUAL ISSUE - Now saves to backend with full issue data!
  const addIssue = async (issueData, currentUser) => {
    // Support both old format (string title) and new format (full object)
    const isLegacyFormat = typeof issueData === 'string';
    const title = isLegacyFormat ? issueData : issueData.title;

    if (!title || !title.trim()) return;

    try {
      const fullIssueData = isLegacyFormat ? {
        title,
        module: "Frontend",
        createdBy: currentUser ? `${currentUser.empId} - ${currentUser.name}` : "Manual Entry",
        assignee: "Frontend Team"
      } : {
        ...issueData,
        createdBy: currentUser ? `${currentUser.empId} - ${currentUser.name}` : "Manual Entry"
      };

      console.log('=== addIssue - Sending to backend ===');
      console.log('Original issueData:', issueData);
      console.log('isLegacyFormat:', isLegacyFormat);
      console.log('fullIssueData:', fullIssueData);

      // POST to backend
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullIssueData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create issue");
      }

      const { issue } = await res.json();

      // BUG FIX #1: Don't add to local state - let socket event handle it
      // This prevents duplicate issues from appearing (one from here, one from socket)
      // The socket "new-bug" event will add it to the list
      // Removed: setIssues(prev => [issue, ...prev]);

      console.log('Manual issue created, waiting for socket event:', issue.id);
      return issue;
    } catch (err) {
      console.error(' Failed to create manual issue:', err);
      throw err;
    }
  };

  // 🔄 STATUS UPDATE - Now saves to backend!
  const updateStatus = async (id, status, currentUser) => {
    // Optimistic update (update UI immediately)
    setIssues(prev =>
      prev.map(issue => {
        if (issue.id !== id) return issue;

        // BUG FIX #9: Use ISO format for dates instead of locale strings
        const now = new Date().toISOString(); // Changed from toLocaleString()
        const updated = { ...issue, status };

        if (status === "Open" && !issue.openedBy) {
          const opener = currentUser
            ? `${currentUser.empId || 'SYS'} - ${currentUser.name || 'System'}`
            : 'System - Auto Update';
          updated.openedBy = opener;
          updated.openedAt = now;
        } else if (status === "Fixed" && !issue.fixedBy) {
          const fixer = currentUser
            ? `${currentUser.empId || 'SYS'} - ${currentUser.name || 'System'}`
            : 'System - Auto Update';
          updated.fixedBy = fixer;
          updated.fixedAt = now;
        } else if (status === "Closed") {
          updated.closedAt = now;
        }

        return updated;
      })
    );

    // Save to backend
    try {
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/issues/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, currentUser })
      });
      console.log(` Status saved to backend: ${id} -> ${status}`);
    } catch (err) {
      console.error(' Failed to save status to backend:', err);
      // Status is still updated locally, just not persisted
    }
  };

  // 🗑️ DELETE ISSUE
  const deleteIssue = async (id) => {
    // Optimistic delete - remove from UI immediately
    setIssues(prev => prev.filter(issue => issue.id !== id));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/issues/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Failed to delete issue');
      }

      console.log(`🗑️ Issue deleted successfully: ${id}`);
    } catch (err) {
      console.error('❌ Failed to delete issue:', err);
      // Re-fetch to restore the issue if delete failed
      loadIssues();
      throw err;
    }
  };

  return { issues, loadIssues, addIssue, updateStatus, generateAIReport, deleteIssue };
}
