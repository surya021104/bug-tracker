import { useState } from "react";
import { issues as initialIssues } from "../data/issues";

export default function useIssues() {
  const [issues, setIssues] = useState(initialIssues);

  const addIssue = (title) => {
  const issueType = title.toLowerCase().includes("login")
    ? "LOGIN_CRASH"
    : title.toLowerCase().includes("server")
    ? "SERVER_CRASH"
    : "UI_BUG";

  const newIssue = {
    id: `BUG-${String(issues.length + 1).padStart(3, "0")}`,
    title,
    issueType,
    module: "Frontend",
    status: "Open",
    assignee: "Frontend Team",
    createdAt: new Date().toLocaleString(),
    resolvedAt: null
  };

  setIssues(prev => [newIssue, ...prev]);
};


  const updateStatus = (id, status) => {
    setIssues(prev =>
      prev.map(issue =>
        issue.id === id
          ? {
              ...issue,
              status,
              updatedAt: new Date().toLocaleString(),
              resolvedAt:
                status === "Fixed" || status === "Closed"
                  ? new Date().toLocaleString()
                  : issue.resolvedAt
            }
          : issue
      )
    );
  };

  return { issues, addIssue, updateStatus };
}
